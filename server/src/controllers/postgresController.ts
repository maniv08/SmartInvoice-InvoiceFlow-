import { Request, Response } from 'express';
import { queryPG, getPGStatus } from '../config/postgres';
import { getRedisStatus, flushCache } from '../config/redis';
import { Invoice, Vendor, User, Payment, AuditLog } from '../models';

export const getSystemStackInfo = async (_req: Request, res: Response) => {
  try {
    const pgStatus = getPGStatus();
    const redisStatus = getRedisStatus();

    // Query sample table counts if Postgres is connected
    let tableStats = {
      users: 0,
      vendors: 0,
      invoices: 0,
      payments: 0,
      audit_logs: 0,
    };

    try {
      const invCount = await Invoice.countDocuments();
      const venCount = await Vendor.countDocuments();
      const usrCount = await User.countDocuments();
      const payCount = await Payment.countDocuments();
      const audCount = await AuditLog.countDocuments();

      tableStats = {
        users: usrCount,
        vendors: venCount,
        invoices: invCount,
        payments: payCount,
        audit_logs: audCount,
      };
    } catch (e) {}

    res.status(200).json({
      success: true,
      data: {
        architecture: {
          frontend: 'React 18 + TypeScript + Vite + Tailwind CSS',
          backend: 'Node.js + Express.js + TypeScript (REST API)',
          databaseRelational: 'PostgreSQL 16 (Relational DB & Enterprise Ledger)',
          caching: 'Redis 7 Alpine (In-Memory Key-Value Caching & Invalidation)',
          documentStore: 'MongoDB 7.0 / Mongoose ODM (Document & Memory Fallback)',
          containerization: 'Docker & Docker Compose Multi-Service Architecture',
          versionControl: 'Git / GitHub CI/CD Ready',
        },
        postgres: pgStatus,
        redis: redisStatus,
        statistics: tableStats,
        serverTime: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const syncToPostgres = async (_req: Request, res: Response) => {
  try {
    const invoices = await Invoice.find().populate('vendor');
    let syncedCount = 0;

    for (const inv of invoices) {
      try {
        await queryPG(
          `INSERT INTO invoices (
            id, invoice_number, vendor_name, amount, tax_amount, total_amount, 
            currency, issue_date, due_date, status, approval_tier, current_approval_step, 
            payment_status, fraud_risk_score, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO UPDATE SET 
            status = EXCLUDED.status, 
            payment_status = EXCLUDED.payment_status,
            updated_at = EXCLUDED.updated_at`,
          [
            inv._id.toString(),
            inv.invoiceNumber,
            (inv.vendor as any)?.name || 'General Vendor',
            inv.subtotal || inv.totalAmount,
            inv.taxAmount || 0,
            inv.totalAmount,
            inv.currency || 'INR',
            inv.issueDate,
            inv.dueDate,
            inv.status,
            (inv as any).approvalTier || 1,
            (inv as any).currentApprovalStep || 1,
            inv.status === 'PAID' ? 'PAID' : 'UNPAID',
            (inv as any).fraudRiskScore || 0,
            (inv as any).createdAt || new Date(),
            (inv as any).updatedAt || new Date(),
          ]
        );
        syncedCount++;
      } catch (err) {
        // Continue
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully synchronized ${syncedCount} records to PostgreSQL relational database ledger.`,
      syncedCount,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearRedisCache = async (_req: Request, res: Response) => {
  try {
    await flushCache();
    res.status(200).json({
      success: true,
      message: 'Redis cache flushed successfully. High-speed cache reset.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const runPostgresQuery = async (req: Request, res: Response) => {
  try {
    const { sql, params } = req.body;
    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ success: false, message: 'SQL query string is required.' });
    }

    const result = await queryPG(sql, params || []);
    res.status(200).json({
      success: true,
      rowCount: result.rowCount,
      rows: result.rows,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
