import { Response } from 'express';
import { Invoice, Payment, Vendor, AuditLog, IInvoice } from '../models';
import { AuthRequest } from '../middleware/auth';

export const getDashboardMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  const orgId = req.user?.organization;

  // Filter based on role (Vendor only sees vendor metrics)
  const invoiceFilter: any = { organization: orgId };
  if (req.userRole === 'VENDOR' && req.user?.vendor) {
    invoiceFilter.vendor = req.user.vendor;
  }

  // 1. KPI Counts and Amounts
  const allInvoices = await Invoice.find(invoiceFilter).populate('vendor', 'name code');

  const totalInvoicesCount = allInvoices.length;
  const draftCount = allInvoices.filter((i) => i.status === 'DRAFT').length;
  const pendingCount = allInvoices.filter((i) => ['PENDING_APPROVAL', 'UNDER_VERIFICATION', 'SUBMITTED'].includes(i.status)).length;
  const approvedCount = allInvoices.filter((i) => i.status === 'APPROVED').length;
  const rejectedCount = allInvoices.filter((i) => i.status === 'REJECTED').length;
  const processingCount = allInvoices.filter((i) => i.status === 'PAYMENT_PROCESSING').length;
  const paidCount = allInvoices.filter((i) => i.status === 'PAID').length;
  const overdueCount = allInvoices.filter((i) => i.status === 'OVERDUE').length;

  const totalPayable = allInvoices
    .filter((i) => ['APPROVED', 'PENDING_APPROVAL', 'UNDER_VERIFICATION', 'PAYMENT_PROCESSING', 'OVERDUE'].includes(i.status))
    .reduce((acc, i) => acc + i.totalAmount, 0);

  const totalPaid = allInvoices
    .filter((i) => i.status === 'PAID')
    .reduce((acc, i) => acc + i.totalAmount, 0);

  const totalPendingAmount = allInvoices
    .filter((i) => ['PENDING_APPROVAL', 'UNDER_VERIFICATION', 'SUBMITTED'].includes(i.status))
    .reduce((acc, i) => acc + i.totalAmount, 0);

  const overdueAmount = allInvoices
    .filter((i) => i.status === 'OVERDUE')
    .reduce((acc, i) => acc + i.totalAmount, 0);

  // 2. Status Distribution for Donut Chart
  const statusDistribution = [
    { status: 'Paid', count: paidCount, amount: totalPaid, color: '#10b981' },
    { status: 'Pending Approval', count: pendingCount, amount: totalPendingAmount, color: '#f59e0b' },
    { status: 'Approved', count: approvedCount, amount: allInvoices.filter(i => i.status === 'APPROVED').reduce((s, i) => s + i.totalAmount, 0), color: '#059669' },
    { status: 'Payment Processing', count: processingCount, amount: allInvoices.filter(i => i.status === 'PAYMENT_PROCESSING').reduce((s, i) => s + i.totalAmount, 0), color: '#8b5cf6' },
    { status: 'Overdue', count: overdueCount, amount: overdueAmount, color: '#dc2626' },
    { status: 'Rejected', count: rejectedCount, amount: allInvoices.filter(i => i.status === 'REJECTED').reduce((s, i) => s + i.totalAmount, 0), color: '#ef4444' },
    { status: 'Draft', count: draftCount, amount: allInvoices.filter(i => i.status === 'DRAFT').reduce((s, i) => s + i.totalAmount, 0), color: '#64748b' },
  ].filter((item) => item.count > 0);

  // 3. Monthly Trends (Invoiced vs Paid over past 6 months)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const monthlyTrends = [];

  for (let m = 5; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const monthLabel = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;

    const monthInvoices = allInvoices.filter((inv) => {
      const invDate = new Date(inv.issueDate);
      return invDate.getMonth() === d.getMonth() && invDate.getFullYear() === d.getFullYear();
    });

    const invoicedSum = monthInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const paidSum = monthInvoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    monthlyTrends.push({
      month: monthLabel,
      'Total Invoiced': invoicedSum,
      'Total Paid': paidSum,
    });
  }

  // 4. Top Vendor Spending (Bar Chart)
  const vendorSpendMap = new Map();
  allInvoices.forEach((inv) => {
    const vendorName = (inv.vendor as any)?.name || 'Unknown';
    const current = vendorSpendMap.get(vendorName) || 0;
    vendorSpendMap.set(vendorName, current + inv.totalAmount);
  });

  const topVendors = Array.from(vendorSpendMap.entries())
    .map(([name, amount]) => ({ vendor: name.length > 18 ? name.slice(0, 18) + '...' : name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  // 5. Recent Activity and Upcoming Payments
  const recentActivities = await AuditLog.find({ organization: orgId })
    .sort({ createdAt: -1 })
    .limit(8);

  const upcomingPayments = allInvoices
    .filter((inv) => ['APPROVED', 'PAYMENT_PROCESSING'].includes(inv.status))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 6);

  res.status(200).json({
    success: true,
    kpis: {
      totalInvoices: totalInvoicesCount,
      pendingApprovalCount: pendingCount,
      approvedCount,
      rejectedCount,
      paidCount,
      overdueCount,
      processingCount,
      totalPayable,
      totalPaid,
      totalPendingAmount,
      overdueAmount,
      spendingLimit: 2500000,
      spentSoFar: totalPaid,
    },
    monthlyTrends,
    statusDistribution,
    topVendors,
    recentActivities,
    upcomingPayments,
  });
};
