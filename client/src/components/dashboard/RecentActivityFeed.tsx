import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';
import { formatINR, formatDateTime } from '@/lib/utils';
import { FileText, CreditCard, CheckCircle2, XCircle, Clock, ShieldAlert } from 'lucide-react';
import { AuditLog } from '@/lib/types';
import { Link } from 'react-router-dom';

interface RecentActivityFeedProps {
  activities: AuditLog[];
  onViewInvoice?: (invoiceId: string) => void;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activities,
  onViewInvoice,
}) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INVOICE_CREATE':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'INVOICE_APPROVE':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'INVOICE_REJECT':
        return <XCircle className="h-4 w-4 text-rose-500" />;
      case 'PAYMENT_RECORD':
        return <CreditCard className="h-4 w-4 text-purple-500" />;
      case 'SCHEDULER_MANUAL_RUN':
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <ShieldAlert className="h-4 w-4 text-slate-500" />;
    }
  };

  const formatActionTitle = (act: AuditLog) => {
    switch (act.action) {
      case 'INVOICE_CREATE':
        return `Created Invoice ${act.entityName || ''}`;
      case 'INVOICE_APPROVE':
        return `Approved Invoice ${act.entityName || ''}`;
      case 'INVOICE_REJECT':
        return `Rejected Invoice ${act.entityName || ''}`;
      case 'PAYMENT_RECORD':
        return `Remitted Payment for ${act.entityName || ''}`;
      case 'APPROVAL_THRESHOLDS_UPDATE':
        return 'Updated Approval Tiers';
      default:
        return act.action.replace(/_/g, ' ');
    }
  };

  return (
    <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
            Recent Audit & System Activities
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time audit log of operational and financial actions
          </CardDescription>
        </div>
        <Link
          to="/audit-logs"
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline flex items-center gap-1"
        >
          <span>View All</span>
          <span>→</span>
        </Link>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-2">
        {activities.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No recent activity recorded yet.
          </div>
        ) : (
          activities.slice(0, 5).map((act) => (
            <div
              key={act._id}
              className="py-3 px-3 flex items-center justify-between gap-3 text-xs transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40 rounded-xl"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                  {getActionIcon(act.action)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {formatActionTitle(act)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    By <span className="font-medium text-slate-700 dark:text-slate-300">{act.userName || 'System'}</span> • {formatDateTime(act.createdAt)}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2.5">
                {act.newValue?.totalAmount ? (
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums text-xs">
                    {formatINR(act.newValue.totalAmount)}
                  </span>
                ) : null}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                  {act.entityType}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
