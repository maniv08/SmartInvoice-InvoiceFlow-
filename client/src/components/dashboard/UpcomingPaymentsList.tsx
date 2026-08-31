import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { formatINR, formatDate, cn } from '@/lib/utils';
import { Calendar, CreditCard, Building } from 'lucide-react';
import { Invoice } from '@/lib/types';
import { Link } from 'react-router-dom';

interface UpcomingPaymentsListProps {
  invoices: Invoice[];
  onPayNow?: (invoice: Invoice) => void;
  onViewInvoice?: (invoice: Invoice) => void;
}

export const UpcomingPaymentsList: React.FC<UpcomingPaymentsListProps> = ({
  invoices,
  onPayNow,
  onViewInvoice,
}) => {
  return (
    <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
            Upcoming Due Disbursements
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Approved invoices requiring remittance scheduling
          </CardDescription>
        </div>
        <Link
          to="/payments"
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline flex items-center gap-1"
        >
          <span>View All</span>
          <span>→</span>
        </Link>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-2">
        {invoices.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            ✨ No upcoming disbursements due immediately.
          </div>
        ) : (
          invoices.slice(0, 5).map((inv) => {
            const dueDate = new Date(inv.dueDate);
            const now = new Date();
            const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const isDueSoon = daysLeft <= 3 && daysLeft >= 0;
            const isOverdue = daysLeft < 0;
            const isProcessing = inv.status === 'PAYMENT_PROCESSING';
            const isPaid = inv.status === 'PAID';

            return (
              <div
                key={inv._id}
                className="py-4 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/40 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <Building className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[200px] sm:max-w-none"
                        title={inv.vendor?.name || 'Vendor'}
                      >
                        {inv.vendor?.name || 'Vendor'}
                      </span>
                      <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                        #{inv.invoiceNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Due {formatDate(inv.dueDate)} •{' '}
                      <span
                        className={
                          isOverdue
                            ? 'text-rose-600 dark:text-rose-400 font-semibold'
                            : isDueSoon
                            ? 'text-amber-600 dark:text-amber-400 font-semibold'
                            : 'text-slate-600 dark:text-slate-300'
                        }
                      >
                        {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d remaining`}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <StatusBadge status={inv.status} />
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums text-sm">
                    {formatINR(inv.totalAmount)}
                  </span>
                  {onPayNow && (
                    <Button
                      size="sm"
                      disabled={isProcessing || isPaid}
                      onClick={() => onPayNow(inv)}
                      className={cn(
                        'h-8 px-3 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors',
                        isProcessing || isPaid
                          ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      )}
                    >
                      <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{isPaid ? 'Settled' : isProcessing ? 'Processing...' : 'Pay'}</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
