import React from 'react';
import { DuplicateCheckResult } from '@/lib/types';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { formatINR, formatDate } from '@/lib/utils';

interface DuplicateAlertBannerProps {
  checkResult: DuplicateCheckResult | null;
}

export const DuplicateAlertBanner: React.FC<DuplicateAlertBannerProps> = ({ checkResult }) => {
  if (!checkResult || !checkResult.isDuplicate || checkResult.matchedInvoices.length === 0) {
    return null;
  }

  const isHigh = checkResult.severity === 'HIGH';

  return (
    <div
      className={`rounded-2xl border p-4 text-xs transition-all shadow-sm ${
        isHigh
          ? 'border-rose-300 bg-rose-50/90 text-rose-950 dark:border-rose-900/80 dark:bg-rose-950/40 dark:text-rose-200'
          : 'border-amber-300 bg-amber-50/90 text-amber-950 dark:border-amber-900/80 dark:bg-amber-950/40 dark:text-amber-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
            isHigh
              ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300'
              : 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300'
          }`}
        >
          {isHigh ? <ShieldAlert className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
        </div>

        <div className="space-y-1.5 flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm tracking-tight">
              {isHigh ? '⚠️ High Risk: Potential Duplicate Invoice' : 'ℹ️ Duplicate Alert Warning'}
            </h4>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                isHigh
                  ? 'bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200'
                  : 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
              }`}
            >
              {checkResult.severity} SEVERITY
            </span>
          </div>

          <p className="opacity-90">
            {checkResult.message ||
              'One or more existing invoices with matching attributes were identified in the system.'}
          </p>

          <div className="mt-2 space-y-1.5 pt-1">
            <span className="font-semibold text-[11px] uppercase tracking-wider block">
              Matched Existing Invoices:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {checkResult.matchedInvoices.map((match) => (
                <div
                  key={match.id}
                  className="rounded-xl bg-white/70 dark:bg-slate-900/60 p-2.5 border border-black/5 dark:border-white/5 space-y-1"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{match.invoiceNumber}</span>
                    <span className="tabular-nums">{formatINR(match.totalAmount)}</span>
                  </div>
                  <div className="text-[11px] opacity-80 flex items-center justify-between">
                    <span>{match.vendorName || 'Vendor'}</span>
                    <span>{formatDate(match.issueDate)}</span>
                  </div>
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                    Reasons: {match.matchReasons.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[10px] italic opacity-75 mt-1">
            Note: This is an advisory warning to prevent duplicate corporate payments. You may still proceed if this is a legitimate recurring or amended invoice.
          </p>
        </div>
      </div>
    </div>
  );
};
