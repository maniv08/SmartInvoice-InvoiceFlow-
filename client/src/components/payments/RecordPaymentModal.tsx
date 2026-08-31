import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Landmark, CheckCircle2, Sparkles, Building } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { Invoice } from '@/lib/types';
import api from '@/lib/api';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface RecordPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetInvoice?: Invoice | null;
  onSuccess: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  open,
  onOpenChange,
  targetInvoice,
  onSuccess,
}) => {
  const [approvedInvoices, setApprovedInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('NEFT');
  const [referenceId, setReferenceId] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      if (targetInvoice) {
        setSelectedInvoiceId(targetInvoice._id);
        setAmount(targetInvoice.totalAmount);
      } else {
        // Fetch approved invoices eligible for payment
        api.get('/invoices?status=APPROVED&limit=30').then((res) => {
          if (res.data.success) {
            setApprovedInvoices(res.data.invoices);
            if (res.data.invoices.length > 0) {
              setSelectedInvoiceId(res.data.invoices[0]._id);
              setAmount(res.data.invoices[0].totalAmount);
            }
          }
        });
      }

      setReferenceId(`UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes('Electronic bank remittance under master procurement schedule.');
    }
  }, [open, targetInvoice]);

  const handleInvoiceSelect = (invId: string) => {
    setSelectedInvoiceId(invId);
    const found = approvedInvoices.find((i) => i._id === invId);
    if (found) {
      setAmount(found.totalAmount);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInvoiceId) {
      toast.error('Please select an invoice to settle');
      return;
    }
    if (!referenceId.trim()) {
      toast.error('Please provide a UTR / Transaction Reference ID');
      return;
    }
    if (amount <= 0) {
      toast.error('Payment amount must be greater than zero');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/payments', {
        invoiceId: selectedInvoiceId,
        amount: Number(amount),
        paymentDate,
        paymentMethod,
        referenceId: referenceId.trim().toUpperCase(),
        status: 'PAID',
        notes,
      });

      if (res.data.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        toast.success(`Payment of ${formatINR(amount)} recorded & invoice marked as PAID!`);
        onOpenChange(false);
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const currentInvoice =
    targetInvoice || approvedInvoices.find((i) => i._id === selectedInvoiceId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[88vh] overflow-y-auto rounded-2xl p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-600" />
            Remit & Record Vendor Payment
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Record direct bank settlement reference (NEFT / RTGS / IMPS / UPI) and automatically update invoice lifecycle to PAID.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2 text-xs">
          {/* Target Invoice Picker */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Target Approved Invoice *</Label>
            {targetInvoice ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                <p className="font-bold text-slate-900 dark:text-white">
                  {targetInvoice.invoiceNumber} — {targetInvoice.vendor?.name}
                </p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Due: {targetInvoice.dueDate} • Approved Total: <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatINR(targetInvoice.totalAmount)}</span>
                </p>
              </div>
            ) : (
              <Select value={selectedInvoiceId} onValueChange={handleInvoiceSelect}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select approved invoice" />
                </SelectTrigger>
                <SelectContent>
                  {approvedInvoices.map((inv) => (
                    <SelectItem key={inv._id} value={inv._id} className="text-xs">
                      {inv.invoiceNumber} — {inv.vendor?.name} ({formatINR(inv.totalAmount)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Amount & Method Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Remittance Amount (₹ INR) *</Label>
              <Input
                type="number"
                min="1"
                step="100"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className="text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Payment Channel *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEFT">NEFT (National Electronic Funds)</SelectItem>
                  <SelectItem value="RTGS">RTGS (Real Time Gross Settlement)</SelectItem>
                  <SelectItem value="IMPS">IMPS (Immediate Payment Service)</SelectItem>
                  <SelectItem value="UPI">UPI Corporate Gateway</SelectItem>
                  <SelectItem value="CREDIT_CARD">Corporate Purchasing Card</SelectItem>
                  <SelectItem value="CHEQUE">Corporate Account Payee Cheque</SelectItem>
                  <SelectItem value="WIRE_TRANSFER">SWIFT International Wire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Bank Reference / UTR Number *</Label>
              <Input
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value.toUpperCase())}
                placeholder="UTR98273641029"
                required
                className="text-xs font-mono uppercase font-bold"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Disbursement Date *</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="text-xs"
              />
            </div>
          </div>

          {/* Vendor Bank Snapshot */}
          {currentInvoice?.vendor?.bankDetails && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-1 text-xs text-indigo-950 dark:text-indigo-200">
              <div className="font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <Landmark className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                Target Beneficiary Account
              </div>
              <p>
                {currentInvoice.vendor.bankDetails.bankName} • A/C: <span className="font-mono font-bold">{currentInvoice.vendor.bankDetails.accountNumber}</span>
              </p>
              <p>
                IFSC: <span className="font-mono font-bold">{currentInvoice.vendor.bankDetails.ifscCode}</span> ({currentInvoice.vendor.bankDetails.accountName})
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Remittance Audit Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cleared through HDFC Corporate Banking Portal..."
              className="text-xs min-h-[60px]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
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
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-2 shadow-sm"
            >
              {loading ? 'Recording Remittance...' : 'Authorize & Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
