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
import { formatINR } from '@/lib/utils';
import {
  Percent,
  TrendingUp,
  Clock,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  Calendar,
  Building,
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface DynamicDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  onSuccess?: () => void;
}

export const DynamicDiscountModal: React.FC<DynamicDiscountModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}) => {
  const [daysEarly, setDaysEarly] = useState<number>(20);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!invoice) return null;

  const totalAmount = invoice.totalAmount || 100000;
  // Sliding scale: max 3% at 25+ days early, down to 0.5% at 5 days early
  const discountRatePercent = Math.min(3.0, Math.max(0.5, Number((daysEarly * 0.12).toFixed(2))));
  const discountSavings = Math.round((totalAmount * discountRatePercent) / 100);
  const discountedPayout = totalAmount - discountSavings;
  
  // Annualized ROI: (Discount Rate / (30 - Days Early)) * (365 / Days Early) * 100
  const annualizedROI = Math.min(72, Number(((discountRatePercent / 100) * (365 / Math.max(1, daysEarly)) * 100).toFixed(1)));

  const handleAuthorizeEarlyPayment = async () => {
    try {
      setIsSubmitting(true);
      // Call payment or discount authorization
      const res = await api.post(`/payments`, {
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        amount: discountedPayout,
        paymentMethod: 'NEFT',
        utrNumber: `UTR-${Date.now().toString().slice(-8)}`,
        remarks: `Dynamic Early Discount Settled (${discountRatePercent}% discount, Saved ${formatINR(discountSavings)})`,
      });

      if (res.data?.success) {
        toast.success(`Early settlement authorized! Saved ${formatINR(discountSavings)} at ${annualizedROI}% Annualized ROI.`);
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to authorize early payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-6 rounded-2xl bg-slate-900 border border-slate-800 text-white">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-white shadow-lg shadow-amber-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                Dynamic Early Payment Calculator
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  FinTech ROI
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 mt-0.5">
                Invoice {invoice.invoiceNumber} • {invoice.vendor?.name || 'Vendor'} • Full: {formatINR(totalAmount)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* Slider Control */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Pay Invoice Days Early:
              </label>
              <span className="text-sm font-extrabold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
                {daysEarly} Days Early
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="28"
              step="1"
              value={daysEarly}
              onChange={(e) => setDaysEarly(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
              <span>1 Day Early (0.5% min)</span>
              <span>14 Days</span>
              <span>28 Days Early (3.0% max)</span>
            </div>
          </div>

          {/* Dynamic Calculated Financial Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5" />
                Dynamic Cash Discount
              </div>
              <div className="text-xl font-black text-emerald-300 mt-1">
                {formatINR(discountSavings)}
              </div>
              <div className="text-[10px] text-emerald-400/80 mt-0.5">
                {discountRatePercent}% instant invoice reduction
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <div className="text-[11px] font-medium text-indigo-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Annualized Buyer Yield (APR)
              </div>
              <div className="text-xl font-black text-indigo-300 mt-1">
                +{annualizedROI}% APR
              </div>
              <div className="text-[10px] text-indigo-400/80 mt-0.5">
                Risk-free working capital return
              </div>
            </div>
          </div>

          {/* Settlement Comparison Card */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2.5">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Original Invoice Amount:</span>
              <span className="font-semibold">{formatINR(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-xs text-emerald-400">
              <span>Early Settlement Discount:</span>
              <span className="font-semibold">-{formatINR(discountSavings)}</span>
            </div>
            <div className="border-t border-slate-700 pt-2 flex justify-between text-sm font-bold text-white">
              <span>Net Settlement Payable to Vendor:</span>
              <span className="text-emerald-400">{formatINR(discountedPayout)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-800 pt-4 flex gap-2">
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800">
            Cancel
          </Button>
          <Button
            onClick={handleAuthorizeEarlyPayment}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold shadow-md shadow-amber-500/20 gap-1.5"
          >
            <Zap className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
            {isSubmitting ? 'Authorizing...' : `Disburse ${formatINR(discountedPayout)} Now`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
