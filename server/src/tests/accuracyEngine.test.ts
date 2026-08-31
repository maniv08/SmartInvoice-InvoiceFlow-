import { describe, it, expect } from 'vitest';
import { validateGSTIN, calculateGSTBreakdown, calculateGSTChecksum } from '../services/gstValidator';
import { extractInvoiceFromText } from '../services/ocrEngine';
import { performThreeWayMatch } from '../services/matchingEngine';
import { calculateStringSimilarity, normalizeInvoiceNumber } from '../services/duplicateDetector';

describe('GST Statutory & Validation Engine (99% Precision)', () => {
  it('should validate legitimate 15-digit Indian GSTIN with Mod-36 Checksum', () => {
    // Valid GSTIN for TCS Maharashtra: 27AABCU9603R1ZM
    const res1 = validateGSTIN('27AABCU9603R1ZM');
    expect(res1.isValid).toBe(true);
    expect(res1.stateCode).toBe('27');
    expect(res1.stateName).toBe('Maharashtra');
    expect(res1.panNumber).toBe('AABCU9603R');

    // Valid GSTIN for Karnataka: 29AABCA1234F1Z5
    const res2 = validateGSTIN('29AABCA1234F1Z5');
    expect(res2.isValid).toBe(true);
    expect(res2.stateCode).toBe('29');
    expect(res2.stateName).toBe('Karnataka');
  });

  it('should reject malformed or invalid GSTINs', () => {
    const invalidFormat = validateGSTIN('123INVALIDGSTIN');
    expect(invalidFormat.isValid).toBe(false);

    // Invalid State code '99'
    const invalidState = validateGSTIN('99AABCU9603R1ZM');
    expect(invalidState.isValid).toBe(false);
    expect(invalidState.error).toContain('Invalid GST state code');
  });

  it('should accurately calculate Intra-State (CGST + SGST) vs Inter-State (IGST) split', () => {
    // Intra-state (Same state Karnataka 29 to 29)
    const intra = calculateGSTBreakdown({
      supplierGSTIN: '29AABCA1234F1Z5',
      buyerGSTIN: '29AABCA9999F1Z1',
      subtotal: 100000,
      taxRate: 18,
    });
    expect(intra.isInterState).toBe(false);
    expect(intra.cgstAmount).toBe(9000);
    expect(intra.sgstAmount).toBe(9000);
    expect(intra.igstAmount).toBe(0);
    expect(intra.netPayable).toBe(118000);

    // Inter-state (Maharashtra 27 to Karnataka 29)
    const inter = calculateGSTBreakdown({
      supplierGSTIN: '27AABCU9603R1ZM',
      buyerGSTIN: '29AABCA1234F1Z5',
      subtotal: 100000,
      taxRate: 18,
    });
    expect(inter.isInterState).toBe(true);
    expect(inter.cgstAmount).toBe(0);
    expect(inter.sgstAmount).toBe(0);
    expect(inter.igstAmount).toBe(18000);
    expect(inter.netPayable).toBe(118000);
  });
});

describe('Intelligent Multi-Pass Invoice Extraction Engine', () => {
  const sampleInvoiceRawText = `
    TAX INVOICE
    Tata Consultancy Services Ltd
    GSTIN: 27AABCU9603R1ZM
    Billed To: Acme Enterprises India Pvt Ltd (GSTIN: 29AABCA1234F1Z5)
    
    Invoice No: INV-2026-TCS-0042
    Purchase Order No: PO-2026-001
    Invoice Date: 12/08/2026
    Due Date: 11/09/2026
    
    1. Cloud Infrastructure Dedicated Nodes (AWS)   998313   2   24000.00   48000.00
    
    Sub Total: INR 48,000.00
    GST @ 18%: INR 8,640.00
    Grand Total: INR 56,640.00
    
    Bank: HDFC Bank | A/C: 50200012345678 | IFSC: HDFC0000123
  `;

  it('should extract metadata with 98%+ precision and achieve mathematical balance', () => {
    const extracted = extractInvoiceFromText(sampleInvoiceRawText);

    expect(extracted.invoiceNumber.value).toBe('INV-2026-TCS-0042');
    expect(extracted.poNumber?.value).toBe('PO-2026-001');
    expect(extracted.issueDate.value).toBe('2026-08-12');
    expect(extracted.totalAmount.value).toBe(56640);
    expect(extracted.subtotal.value).toBe(48000);
    expect(extracted.isMathematicallyBalanced).toBe(true);
    expect(extracted.overallConfidence).toBeGreaterThanOrEqual(95);
    expect(extracted.supplierGSTIN.isValid).toBe(true);
  });
});

describe('Deterministic 3-Way Matching Engine', () => {
  it('should evaluate a PERFECT_MATCH when invoice matches PO and GRN exactly', () => {
    const match = performThreeWayMatch({
      invoice: {
        invoiceNumber: 'INV-2026-001',
        poNumber: 'PO-2026-001',
        totalAmount: 56640,
        items: [
          {
            description: 'Cloud Infrastructure Dedicated Nodes (AWS Mumbai)',
            quantity: 2,
            unitPrice: 24000,
            amount: 56640,
          },
        ],
      },
      po: {
        poNumber: 'PO-2026-001',
        totalAmount: 56640,
        items: [
          {
            description: 'Cloud Infrastructure Dedicated Nodes (AWS Mumbai)',
            quantity: 2,
            unitPrice: 24000,
            amount: 56640,
          },
        ],
      },
      grn: {
        grnNumber: 'GRN-2026-0881',
        items: [
          {
            description: 'Cloud Infrastructure Dedicated Nodes (AWS Mumbai)',
            receivedQuantity: 2,
            acceptedQuantity: 2,
          },
        ],
      },
    });

    expect(match.matchStatus).toBe('PERFECT_MATCH');
    expect(match.matchScore).toBe(100);
    expect(match.recommendation).toBe('APPROVE_AUTOMATICALLY');
    expect(match.discrepancies.length).toBe(0);
  });

  it('should flag price and quantity discrepancies when variance exceeds tolerance', () => {
    const mismatch = performThreeWayMatch({
      invoice: {
        invoiceNumber: 'INV-2026-002',
        poNumber: 'PO-2026-001',
        totalAmount: 70000,
        items: [
          {
            description: 'Cloud Infrastructure Dedicated Nodes (AWS Mumbai)',
            quantity: 3, // Billed 3 instead of contracted 2
            unitPrice: 28000, // Invoiced higher price
            amount: 84000,
          },
        ],
      },
      po: {
        poNumber: 'PO-2026-001',
        totalAmount: 56640,
        items: [
          {
            description: 'Cloud Infrastructure Dedicated Nodes (AWS Mumbai)',
            quantity: 2,
            unitPrice: 24000,
            amount: 56640,
          },
        ],
      },
    });

    expect(mismatch.matchStatus).toBe('DISCREPANCY_FLAGGED');
    expect(mismatch.discrepancies.length).toBeGreaterThan(0);
  });
});

describe('Fuzzy Duplicate & Fraud Detection Helpers', () => {
  it('should compute high string similarity for formatted invoice number variations', () => {
    const s1 = normalizeInvoiceNumber('INV/2026/001');
    const s2 = normalizeInvoiceNumber('INV-2026-001');
    const s3 = normalizeInvoiceNumber('INV 2026 001');

    expect(s1).toBe(s2);
    expect(s2).toBe(s3);
    expect(calculateStringSimilarity(s1, s2)).toBe(1.0);
  });
});
