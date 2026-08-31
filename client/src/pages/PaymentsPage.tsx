import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { RecordPaymentModal } from '@/components/payments/RecordPaymentModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  CreditCard,
  Plus,
  Search,
  Download,
  Filter,
  Landmark,
  Calendar,
  CheckCircle2,
  Receipt,
  FileText,
} from 'lucide-react';
import { formatINR, formatDate, formatDateTime } from '@/lib/utils';
import { Payment } from '@/lib/types';
import api from '@/lib/api';
import { toast } from 'sonner';

export const PaymentsPage: React.FC = () => {
  const { user, isAdmin, isFinance } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments', {
        params: {
          search: search || undefined,
          paymentMethod: selectedMethod !== 'ALL' ? selectedMethod : undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        },
      });
      if (res.data.success) {
        setPayments(res.data.payments);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedMethod, selectedStatus]);

  const totalDisbursed = payments
    .filter((p) => p.status === 'PAID')
    .reduce((s, p) => s + p.amount, 0);

  const handleExportCSV = () => {
    const headers = ['Payment #', 'Invoice #', 'Supplier', 'Amount (INR)', 'Method', 'UTR / Ref ID', 'Date', 'Status'];
    const rows = payments.map((p) => [
      p.paymentNumber,
      p.invoice?.invoiceNumber || '',
      `"${p.invoice?.vendor?.name || ''}"`,
      p.amount,
      p.paymentMethod,
      p.referenceId,
      formatDate(p.paymentDate),
      p.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `InvoiceFlow_Payment_Ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported payment ledger to CSV');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <CreditCard className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Payment Remittance Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audited electronic fund settlements, UTR transaction registers, and supplier payment records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="text-xs rounded-xl font-semibold gap-1.5 border-slate-200 dark:border-slate-800"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export Register</span>
          </Button>

          {(isAdmin || isFinance) && (
            <Button
              size="sm"
              onClick={() => setIsRecordModalOpen(true)}
              className="text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5 shadow-md shadow-indigo-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>Record Remittance</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Settled Volume</span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums font-mono mt-1">
            {formatINR(totalDisbursed)}
          </div>
        </Card>
        <Card className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Transactions</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums font-mono mt-1">
            {payments.length} Transactions
          </div>
        </Card>
        <Card className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Primary Channel</span>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums font-mono mt-1">
            NEFT / RTGS (100%)
          </div>
        </Card>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payment #, UTR ref, notes..."
            className="pl-9 text-xs h-9 rounded-xl border-slate-200 dark:border-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 text-xs px-3 font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Payment Channels</option>
            <option value="NEFT">NEFT</option>
            <option value="RTGS">RTGS</option>
            <option value="UPI">UPI</option>
            <option value="IMPS">IMPS</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="CHEQUE">Cheque</option>
            <option value="WIRE_TRANSFER">Wire Transfer</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 text-xs px-3 font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid / Settled</option>
            <option value="PROCESSING">Processing</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 uppercase font-semibold">
            <tr>
              <th className="p-3 text-left">Payment #</th>
              <th className="p-3 text-left">Linked Invoice</th>
              <th className="p-3 text-left">Supplier / Vendor</th>
              <th className="p-3 text-left">Method & UTR</th>
              <th className="p-3 text-left">Remittance Date</th>
              <th className="p-3 text-right">Amount (INR)</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-400">
                  Loading payment transactions...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-500">
                  ✨ No payment records found matching your filters.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {p.paymentNumber}
                  </td>
                  <td className="p-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                    {p.invoice?.invoiceNumber || 'INV-REF'}
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {p.invoice?.vendor?.name || 'Supplier'}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {p.paymentMethod}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      UTR: {p.referenceId}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400 tabular-nums">
                    {formatDateTime(p.paymentDate)}
                  </td>
                  <td className="p-3 text-right font-extrabold text-slate-900 dark:text-white tabular-nums font-mono">
                    {formatINR(p.amount)}
                  </td>
                  <td className="p-3 text-center">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <RecordPaymentModal
        open={isRecordModalOpen}
        onOpenChange={setIsRecordModalOpen}
        onSuccess={fetchPayments}
      />
    </div>
  );
};
