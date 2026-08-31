import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app';
import { connectDB } from '../config/db';
import { seedDatabase } from '../scripts/seed';
import { User, Invoice, Vendor, Setting, Payment } from '../models';
import { checkDuplicateInvoice } from '../services/duplicateDetector';
import { calculateRequiredApprovalSteps } from '../services/approvalEngine';

describe('InvoiceFlow Comprehensive API & Workflow Test Suite', () => {
  let adminToken: string;
  let financeToken: string;
  let approverToken: string;
  let vendorToken: string;
  let testVendor: any;

  beforeAll(async () => {
    // Connect DB & Seed test data
    await connectDB();
    await seedDatabase();

    // Authenticate Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@invoiceflow.io', password: 'Password123!' });
    adminToken = adminRes.body.token;

    // Authenticate Finance Manager
    const finRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'finance@invoiceflow.io', password: 'Password123!' });
    financeToken = finRes.body.token;

    // Authenticate Approver
    const appRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'approver@invoiceflow.io', password: 'Password123!' });
    approverToken = appRes.body.token;

    // Authenticate Vendor
    const vendRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'vendor@tata.com', password: 'Password123!' });
    vendorToken = vendRes.body.token;

    testVendor = await Vendor.findOne({ name: { $regex: /Tata/i } });
    expect(testVendor).toBeDefined();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('1. Authentication & RBAC Access Control', () => {
    it('should authenticate Admin and return user object and JWT', async () => {
      expect(adminToken).toBeDefined();
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('ADMIN');
    });

    it('should prevent Vendor role from accessing Admin Settings user management', async () => {
      const res = await request(app)
        .get('/api/settings/users')
        .set('Authorization', `Bearer ${vendorToken}`);
      expect(res.status).toBe(403);
    });

    it('should permit Admin access to system settings', async () => {
      const res = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.settings.approvalThresholds).toBeDefined();
    });
  });

  describe('2. Dynamic Approval Threshold Engine', () => {
    it('should assign 1 approval step for amounts < ₹10,000', async () => {
      const steps = await calculateRequiredApprovalSteps(testVendor.organization.toString(), 5000);
      expect(steps).toBe(1);
    });

    it('should assign 2 approval steps for amounts between ₹10,000 and ₹1,00,000', async () => {
      const steps = await calculateRequiredApprovalSteps(testVendor.organization.toString(), 45000);
      expect(steps).toBe(2);
    });

    it('should assign 3 approval steps for high-value amounts > ₹1,00,000', async () => {
      const steps = await calculateRequiredApprovalSteps(testVendor.organization.toString(), 250000);
      expect(steps).toBe(3);
    });
  });

  describe('3. Duplicate Invoice Detection System', () => {
    it('should identify high severity duplicate when vendor and invoice number match', async () => {
      const existing = await Invoice.findOne({ organization: testVendor.organization });
      expect(existing).toBeDefined();

      const result = await checkDuplicateInvoice({
        organizationId: existing!.organization.toString(),
        vendorId: existing!.vendor.toString(),
        invoiceNumber: existing!.invoiceNumber,
        amount: existing!.totalAmount,
      });

      expect(result.isDuplicate).toBe(true);
      expect(result.severity).toBe('HIGH');
      expect(result.matchedInvoices.length).toBeGreaterThan(0);
    });

    it('should return isDuplicate = false for distinct invoice attributes', async () => {
      const result = await checkDuplicateInvoice({
        organizationId: testVendor.organization.toString(),
        vendorId: testVendor._id.toString(),
        invoiceNumber: 'INV-BRAND-NEW-999999',
        amount: 88888,
      });

      expect(result.isDuplicate).toBe(false);
      expect(result.matchedInvoices.length).toBe(0);
    });
  });

  describe('4. Invoice Creation & Lifecycle Workflow', () => {
    let createdInvoiceId: string;

    it('should create an invoice with calculated GST line items and dynamic threshold step requirements', async () => {
      const invoiceData = {
        invoiceNumber: 'INV-TEST-UNIT-001',
        vendorId: testVendor._id.toString(),
        poNumber: 'PO-TEST-001',
        description: 'Automated Vitest Test Invoice',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        paymentTerms: 'Net 15',
        items: [
          {
            description: 'Cloud Infrastructure & Managed Database Clusters',
            quantity: 2,
            unitPrice: 60000,
            taxRate: 18,
            taxAmount: 21600,
            amount: 141600,
          },
        ],
        subtotal: 120000,
        taxAmount: 21600,
        totalAmount: 141600,
        status: 'SUBMITTED',
      };

      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invoiceData);

      expect(res.status).toBe(201);
      expect(res.body.invoice.invoiceNumber).toBe('INV-TEST-UNIT-001');
      expect(res.body.invoice.requiredApprovalSteps).toBe(3); // >1 Lakh => 3 steps
      createdInvoiceId = res.body.invoice._id;
    });

    it('should execute multi-step approvals sequentially', async () => {
      expect(createdInvoiceId).toBeDefined();

      // Step 1 Approval
      const step1Res = await request(app)
        .post(`/api/approvals/${createdInvoiceId}/approve`)
        .set('Authorization', `Bearer ${approverToken}`)
        .send({ comments: 'Step 1 Verification Verified by QA' });

      expect(step1Res.status).toBe(200);
      const invAfterStep1 = await Invoice.findById(createdInvoiceId);
      expect(invAfterStep1!.currentApprovalStep).toBe(2);
      expect(invAfterStep1!.status).toBe('PENDING_APPROVAL');

      // Step 2 Approval
      const step2Res = await request(app)
        .post(`/api/approvals/${createdInvoiceId}/approve`)
        .set('Authorization', `Bearer ${financeToken}`)
        .send({ comments: 'Step 2 Department Approval Sign-off' });

      expect(step2Res.status).toBe(200);
      const invAfterStep2 = await Invoice.findById(createdInvoiceId);
      expect(invAfterStep2!.currentApprovalStep).toBe(3);

      // Step 3 Executive Approval
      const step3Res = await request(app)
        .post(`/api/approvals/${createdInvoiceId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ comments: 'Step 3 Final Board Sign-off Complete' });

      expect(step3Res.status).toBe(200);
      const invFinal = await Invoice.findById(createdInvoiceId);
      expect(invFinal!.status).toBe('APPROVED');
    });

    it('should record payment remittance and automatically transition invoice status to PAID', async () => {
      expect(createdInvoiceId).toBeDefined();

      const paymentRes = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${financeToken}`)
        .send({
          invoiceId: createdInvoiceId,
          amount: 141600,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'NEFT',
          referenceId: 'UTR998877665544',
          status: 'PAID',
          notes: 'Automated test settlement clearance',
        });

      expect(paymentRes.status).toBe(201);
      expect(paymentRes.body.payment.referenceId).toBe('UTR998877665544');

      const invPaid = await Invoice.findById(createdInvoiceId);
      expect(invPaid!.status).toBe('PAID');
    });
  });

  describe('5. Reports & Analytics Computation', () => {
    it('should generate financial report breakdowns for invoices, payments, and vendors', async () => {
      const res = await request(app)
        .get('/api/reports/data?reportType=invoices')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.summary.totalInvoices).toBeGreaterThan(0);
      expect(res.body.summary.totalInvoiced).toBeGreaterThan(0);
    });
  });

  describe('6. Automated Scheduler Manual Execution', () => {
    it('should execute reminder and escalation background job on-demand', async () => {
      const res = await request(app)
        .post('/api/settings/trigger-scheduler')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.result).toBeDefined();
      expect(res.body.result.processedInvoices).toBeGreaterThan(0);
    });
  });
});
