import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { StepperTimeline } from '@/components/invoices/StepperTimeline';
import { InvoiceDetailModal } from '@/components/invoices/InvoiceDetailModal';
import { ApprovalActionDialog } from '@/components/approvals/ApprovalActionDialog';
import { DelegationManager } from '@/components/approvals/DelegationManager';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Building,
  UserCheck,
  Eye,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { formatINR, formatDate } from '@/lib/utils';
import { Invoice } from '@/lib/types';
import api from '@/lib/api';
import { toast } from 'sonner';

export const ApprovalsPage: React.FC = () => {
  const { user, isAdmin, isFinance } = useAuth();
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
  const [approvalAction, setApprovalAction] = useState<{
    invoice: Invoice | null;
    mode: 'APPROVE' | 'REJECT' | null;
  }>({ invoice: null, mode: null });

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/approvals/pending');
      if (res.data.success) {
        setPendingInvoices(res.data.pendingInvoices);
      }
    } catch (err) {
      console.error('Failed to fetch pending approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const totalPendingAmount = pendingInvoices.reduce((s, i) => s + i.totalAmount, 0);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <CheckSquare className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Approval Queue & Governance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review invoices assigned to your managerial authority based on dynamic threshold rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                const res = await api.post('/notifications/trigger-cron');
                toast.success(res.data?.message || 'SLA Escalation check executed!');
                fetchPendingApprovals();
              } catch (e) {
                toast.error('Failed to run SLA check');
              }
            }}
            className="text-xs rounded-xl gap-1.5 font-semibold text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/50"
          >
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <span>Run SLA Auto-Escalation</span>
          </Button>

          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-right">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">
              Pending Volume
            </span>
            <span className="font-extrabold text-slate-900 dark:text-white tabular-nums font-mono">
              {formatINR(totalPendingAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Pending Invoices List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Invoices Awaiting Review</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {pendingInvoices.length} in queue
            </span>
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Loading pending approvals...
          </div>
        ) : pendingInvoices.length === 0 ? (
          <Card className="p-12 text-center rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              All Caught Up!
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              ✨ No invoices currently require your managerial review or sign-off.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {pendingInvoices.map((inv) => (
              <Card
                key={inv._id}
                className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm hover:shadow-md transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-extrabold text-slate-900 dark:text-white text-sm">
                      {inv.invoiceNumber}
                    </span>
                    <StatusBadge status={inv.status} />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      Step {inv.currentApprovalStep} of {inv.requiredApprovalSteps}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <Clock className="w-3 h-3" />
                      SLA: 24h Review Window
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedDetailId(inv._id)}
                      className="h-8 text-xs rounded-xl gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Details</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setApprovalAction({ invoice: inv, mode: 'APPROVE' })}
                      className="h-8 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 shadow-sm"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Approve</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setApprovalAction({ invoice: inv, mode: 'REJECT' })}
                      className="h-8 text-xs rounded-xl font-bold gap-1"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Reject</span>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Supplier</span>
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {inv.vendor?.name}
                    </p>
                    <p className="text-slate-500 text-[11px]">GSTIN: {inv.vendor?.gstin}</p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Timeline & Submitter</span>
                    <p className="text-slate-700 dark:text-slate-300">
                      Due: <span className="font-semibold">{formatDate(inv.dueDate)}</span> ({inv.paymentTerms})
                    </p>
                    <p className="text-slate-500 text-[11px]">By: {inv.createdBy?.name || 'Staff'}</p>
                  </div>

                  <div className="space-y-0.5 sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Invoice Total</span>
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums font-mono">
                      {formatINR(inv.totalAmount)}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Tax: {formatINR(inv.taxAmount)} • Sub: {formatINR(inv.subtotal)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Approval Delegation Manager Section */}
      <div className="pt-4">
        <DelegationManager />
      </div>

      {/* Modals */}
      <InvoiceDetailModal
        invoiceId={selectedDetailId}
        open={!!selectedDetailId}
        onOpenChange={(op) => !op && setSelectedDetailId(null)}
        onApprove={(inv) => setApprovalAction({ invoice: inv, mode: 'APPROVE' })}
        onReject={(inv) => setApprovalAction({ invoice: inv, mode: 'REJECT' })}
        onRefresh={fetchPendingApprovals}
      />

      <ApprovalActionDialog
        invoice={approvalAction.invoice}
        mode={approvalAction.mode}
        open={!!approvalAction.mode}
        onOpenChange={(op) => !op && setApprovalAction({ invoice: null, mode: null })}
        onSuccess={fetchPendingApprovals}
      />
    </div>
  );
};
