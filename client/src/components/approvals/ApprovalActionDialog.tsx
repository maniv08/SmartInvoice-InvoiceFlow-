import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import { Invoice } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';

interface ApprovalActionDialogProps {
  invoice: Invoice | null;
  mode: 'APPROVE' | 'REJECT' | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ApprovalActionDialog: React.FC<ApprovalActionDialogProps> = ({
  invoice,
  mode,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!invoice || !mode) return null;

  const isApprove = mode === 'APPROVE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isApprove && (!comment || comment.trim().length < 3)) {
      toast.error('A clear rejection reason is required (minimum 3 characters)');
      return;
    }

    setLoading(true);
    try {
      if (isApprove) {
        const res = await api.post(`/approvals/${invoice._id}/approve`, {
          comments: comment.trim() || 'Approved by manager',
        });
        toast.success(res.data.message || 'Invoice approved!');
      } else {
        const res = await api.post(`/approvals/${invoice._id}/reject`, {
          reason: comment.trim(),
        });
        toast.success('Invoice rejected and returned to submitter with feedback.');
      }
      setComment('');
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle
            className={`text-lg font-bold flex items-center gap-2 ${
              isApprove ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
            }`}
          >
            {isApprove ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            {isApprove ? 'Confirm Invoice Approval' : 'Reject Invoice with Reason'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            {isApprove
              ? `You are authorizing Invoice ${invoice.invoiceNumber} for ${formatINR(invoice.totalAmount)}.`
              : `Please specify the compliance or pricing discrepancy for rejecting Invoice ${invoice.invoiceNumber}.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Vendor:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{invoice.vendor?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice Amount:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {formatINR(invoice.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Step:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                Step {invoice.currentApprovalStep} of {invoice.requiredApprovalSteps}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              {isApprove ? 'Approval Comments (Optional)' : 'Mandatory Rejection Reason *'}
            </Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                isApprove
                  ? 'Add optional verification notes or budget code...'
                  : 'Specify reason (e.g. Line item GST discrepancy, PO pricing mismatch, missing delivery challan)...'
              }
              required={!isApprove}
              className="text-xs min-h-[90px]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={`rounded-xl text-xs font-bold text-white ${
                isApprove
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {loading
                ? 'Processing...'
                : isApprove
                ? 'Sign & Authorize Approval'
                : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
