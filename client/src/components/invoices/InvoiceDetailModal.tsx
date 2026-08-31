import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { StepperTimeline } from './StepperTimeline';
import { ThreeWayMatchModal } from '@/components/matching/ThreeWayMatchModal';
import { DynamicDiscountModal } from '@/components/discounts/DynamicDiscountModal';
import {
  FileText,
  Printer,
  Download,
  CreditCard,
  CheckCircle2,
  XCircle,
  Building,
  Calendar,
  Clock,
  Paperclip,
  ShieldCheck,
  Receipt,
  User,
  FileCheck,
  Zap,
} from 'lucide-react';
import { formatINR, formatDate, formatDateTime } from '@/lib/utils';
import { Invoice, Approval, Payment } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceDetailModalProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: (invoice: Invoice) => void;
  onReject?: (invoice: Invoice) => void;
  onRecordPayment?: (invoice: Invoice) => void;
  onRefresh?: () => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoiceId,
  open,
  onOpenChange,
  onApprove,
  onReject,
  onRecordPayment,
  onRefresh,
}) => {
  const { user, isFinance, isApprover, isAdmin } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState<boolean>(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (open && invoiceId) {
      setLoading(true);
      api
        .get(`/invoices/${invoiceId}`)
        .then((res) => {
          if (res.data.success) {
            setInvoice(res.data.invoice);
            setApprovals(res.data.approvals || []);
            setPayments(res.data.payments || []);
          }
        })
        .catch((err) => {
          toast.error('Failed to load invoice details');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, invoiceId]);

  const handlePrintPDF = () => {
    if (!invoice) return;

    const doc = new jsPDF();

    // Brand Header
    doc.setFillColor(79, 70, 229); // Indigo 600
    doc.rect(0, 0, 210, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('InvoiceFlow Enterprise System', 14, 15);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Tax Invoice & Remittance Schedule', 140, 15);

    // Invoice Meta
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 14, 38);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Status: ${invoice.status}`, 14, 45);
    doc.text(`Issue Date: ${formatDate(invoice.issueDate)}`, 14, 51);
    doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 14, 57);
    if (invoice.poNumber) doc.text(`PO Number: ${invoice.poNumber}`, 14, 63);

    // Vendor Meta
    doc.setFont('helvetica', 'bold');
    doc.text('Vendor / Supplier Information:', 120, 38);
    doc.setFont('helvetica', 'normal');
    doc.text(`Company: ${invoice.vendor?.name || 'N/A'}`, 120, 45);
    doc.text(`GSTIN: ${invoice.vendor?.gstin || 'N/A'}`, 120, 51);
    doc.text(`Email: ${invoice.vendor?.email || 'N/A'}`, 120, 57);
    doc.text(`Bank: ${invoice.vendor?.bankDetails?.bankName || 'HDFC Bank'} (IFSC: ${invoice.vendor?.bankDetails?.ifscCode || 'HDFC0000004'})`, 120, 63);

    // Items Table
    const tableRows = invoice.items.map((item, idx) => [
      idx + 1,
      item.description,
      item.quantity,
      `INR ${item.unitPrice.toLocaleString('en-IN')}`,
      `${item.taxRate}%`,
      `INR ${(item.amount || item.quantity * item.unitPrice).toLocaleString('en-IN')}`,
    ]);

    autoTable(doc, {
      startY: 72,
      head: [['#', 'Item Description', 'Qty', 'Unit Price', 'GST', 'Line Total']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Totals
    doc.setFontSize(9);
    doc.text(`Subtotal: INR ${invoice.subtotal.toLocaleString('en-IN')}`, 140, finalY);
    doc.text(`GST Amount: INR ${invoice.taxAmount.toLocaleString('en-IN')}`, 140, finalY + 6);
    if (invoice.discountAmount) {
      doc.text(`Discount: - INR ${invoice.discountAmount.toLocaleString('en-IN')}`, 140, finalY + 12);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Total Amount: INR ${invoice.totalAmount.toLocaleString('en-IN')}`, 140, finalY + 18);

    doc.save(`${invoice.invoiceNumber}_Statement.pdf`);
    toast.success('PDF invoice generated successfully!');
  };

  if (!invoice && loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl p-8 rounded-2xl">
          <div className="py-16 text-center text-sm text-slate-500 animate-pulse">
            Loading invoice information...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!invoice) return null;

  const canApprove =
    ['SUBMITTED', 'UNDER_VERIFICATION', 'PENDING_APPROVAL'].includes(invoice.status) &&
    (isAdmin || isFinance || isApprover);

  const canPay = invoice.status === 'APPROVED' && (isAdmin || isFinance);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {invoice.invoiceNumber}
              </h2>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Issued on {formatDate(invoice.issueDate)} • Due {formatDate(invoice.dueDate)} ({invoice.paymentTerms})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMatchModalOpen(true)}
              className="text-xs rounded-xl gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>3-Way Match</span>
            </Button>

            {invoice.status !== 'PAID' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDiscountModalOpen(true)}
                className="text-xs rounded-xl gap-1.5 font-semibold text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/50"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Dynamic Discount</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintPDF}
              className="text-xs rounded-xl gap-1.5 font-semibold"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </Button>

            {canApprove && (
              <>
                <Button
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    if (onApprove) onApprove(invoice);
                  }}
                  className="text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    onOpenChange(false);
                    if (onReject) onReject(invoice);
                  }}
                  className="text-xs rounded-xl font-bold gap-1.5"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </Button>
              </>
            )}

            {canPay && (
              <Button
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  if (onRecordPayment) onRecordPayment(invoice);
                }}
                className="text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5 shadow-sm"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Record Payment
              </Button>
            )}
          </div>
        </div>

        {/* Tabbed Navigation */}
        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-3 rounded-xl mb-4">
            <TabsTrigger value="overview" className="text-xs font-semibold">
              Invoice Statement
            </TabsTrigger>
            <TabsTrigger value="workflow" className="text-xs font-semibold">
              Approval Timeline ({approvals.length})
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-xs font-semibold">
              Payment Ledger ({payments.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Invoice Statement */}
          <TabsContent value="overview" className="space-y-6">
            {/* Vendor & Billed To Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Supplier / Vendor Details
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {invoice.vendor?.name || 'Vendor'}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  GSTIN: <span className="font-mono font-semibold">{invoice.vendor?.gstin || 'N/A'}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Contact: {invoice.vendor?.contactPerson || 'N/A'} ({invoice.vendor?.email})
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Bank: {invoice.vendor?.bankDetails?.bankName} • A/C: ••••{invoice.vendor?.bankDetails?.accountNumber?.slice(-4)}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Billed To Enterprise
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Acme Enterprises India Pvt Ltd
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  GSTIN: <span className="font-mono font-semibold">29AABCA1234F1Z5</span>
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  PO Reference: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{invoice.poNumber || 'PO-NONE'}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Submitted by: {invoice.createdBy?.name || 'Staff User'}
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                  <tr>
                    <th className="p-3 text-left">Item & Description</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-center">GST Rate</th>
                    <th className="p-3 text-right">Tax (₹)</th>
                    <th className="p-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-medium text-slate-900 dark:text-slate-100">
                        {item.description}
                      </td>
                      <td className="p-3 text-center text-slate-600 dark:text-slate-400 tabular-nums">
                        {item.quantity}
                      </td>
                      <td className="p-3 text-right text-slate-600 dark:text-slate-400 tabular-nums font-mono">
                        {formatINR(item.unitPrice)}
                      </td>
                      <td className="p-3 text-center text-slate-600 dark:text-slate-400 font-mono">
                        {item.taxRate}%
                      </td>
                      <td className="p-3 text-right text-slate-600 dark:text-slate-400 tabular-nums font-mono">
                        {formatINR(item.taxAmount || (item.quantity * item.unitPrice * item.taxRate) / 100)}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-white tabular-nums font-mono">
                        {formatINR(item.amount || item.quantity * item.unitPrice * (1 + item.taxRate / 100))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Card */}
            <div className="flex flex-col items-end space-y-1.5 text-xs">
              <div className="flex justify-between w-64 text-slate-500">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums font-mono">
                  {formatINR(invoice.subtotal)}
                </span>
              </div>
              <div className="flex justify-between w-64 text-slate-500">
                <span>Total GST (18% Schedule):</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums font-mono">
                  +{formatINR(invoice.taxAmount)}
                </span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between w-64 text-emerald-600">
                  <span>Discount Applied:</span>
                  <span className="font-semibold tabular-nums font-mono">
                    -{formatINR(invoice.discountAmount)}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between w-64 text-sm font-extrabold text-slate-950 dark:text-white">
                <span>Invoice Total:</span>
                <span className="tabular-nums font-mono text-indigo-600 dark:text-indigo-400 text-base">
                  {formatINR(invoice.totalAmount)}
                </span>
              </div>
            </div>

            {/* Attachments & Notes */}
            {invoice.attachments && invoice.attachments.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  📎 Verified Document Attachments:
                </span>
                <div className="flex flex-wrap gap-2">
                  {invoice.attachments.map((att, i) => (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:underline shadow-sm"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      <span>{att.originalName}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: Multi-step Stepper Workflow Timeline */}
          <TabsContent value="workflow">
            <StepperTimeline invoice={invoice} approvals={approvals} />
          </TabsContent>

          {/* TAB 3: Payment Ledger */}
          <TabsContent value="payments" className="space-y-4">
            {payments.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <CreditCard className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700 mb-2 opacity-50" />
                No payment transactions recorded for this invoice yet.
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p) => (
                  <div key={p._id} className="p-4 text-xs flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white font-mono">
                          {p.paymentNumber}
                        </span>
                        <StatusBadge status={p.status} />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Method: <span className="font-semibold text-slate-700 dark:text-slate-300">{p.paymentMethod}</span> • UTR / Ref:{' '}
                        <span className="font-mono text-indigo-600 dark:text-indigo-400">{p.referenceId}</span>
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        Processed on {formatDateTime(p.paymentDate)} by {p.processedBy?.name || 'Finance'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums font-mono">
                        {formatINR(p.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <ThreeWayMatchModal
          isOpen={isMatchModalOpen}
          onClose={() => setIsMatchModalOpen(false)}
          invoice={invoice}
          onMatchSuccess={() => {
            if (onRefresh) onRefresh();
          }}
        />

        <DynamicDiscountModal
          isOpen={isDiscountModalOpen}
          onClose={() => setIsDiscountModalOpen(false)}
          invoice={invoice}
          onSuccess={() => {
            if (onRefresh) onRefresh();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
