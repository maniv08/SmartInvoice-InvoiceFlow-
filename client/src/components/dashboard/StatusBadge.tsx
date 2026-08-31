import React from 'react';
import { InvoiceStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: InvoiceStatus | string;
  className?: string;
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  showDot = true,
}) => {
  const normalized = status?.toUpperCase() || 'DRAFT';

  const config: Record<
    string,
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    DRAFT: {
      label: 'Draft',
      bg: 'bg-slate-100 dark:bg-slate-800/80',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-700',
      dot: 'bg-slate-500',
    },
    SUBMITTED: {
      label: 'Submitted',
      bg: 'bg-blue-50 dark:bg-blue-950/50',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      dot: 'bg-blue-500',
    },
    UNDER_VERIFICATION: {
      label: 'Under Verification',
      bg: 'bg-blue-50 dark:bg-blue-950/60',
      text: 'text-blue-800 dark:text-blue-300',
      border: 'border-blue-300 dark:border-blue-700',
      dot: 'bg-blue-600',
    },
    PENDING_APPROVAL: {
      label: 'Pending Approval',
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-500 animate-pulse',
    },
    APPROVED: {
      label: 'Approved',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    },
    REJECTED: {
      label: 'Rejected',
      bg: 'bg-rose-50 dark:bg-rose-950/50',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      dot: 'bg-rose-500',
    },
    PAYMENT_PROCESSING: {
      label: 'Processing',
      bg: 'bg-purple-50 dark:bg-purple-950/50',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
      dot: 'bg-purple-500 animate-pulse',
    },
    PAID: {
      label: 'Paid',
      bg: 'bg-green-50 dark:bg-green-950/50',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800',
      dot: 'bg-green-500',
    },
    OVERDUE: {
      label: 'Overdue',
      bg: 'bg-red-50 dark:bg-red-950/60',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-300 dark:border-red-800',
      dot: 'bg-red-600 animate-ping',
    },
    // Payment Statuses
    NOT_DUE: {
      label: 'Not Due',
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-700',
      dot: 'bg-slate-400',
    },
    DUE_SOON: {
      label: 'Due Soon',
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-500',
    },
    DUE: {
      label: 'Due',
      bg: 'bg-orange-50 dark:bg-orange-950/50',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-800',
      dot: 'bg-orange-500',
    },
    PROCESSING: {
      label: 'Processing',
      bg: 'bg-purple-50 dark:bg-purple-950/50',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
      dot: 'bg-purple-500',
    },
    FAILED: {
      label: 'Failed',
      bg: 'bg-rose-50 dark:bg-rose-950/50',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      dot: 'bg-rose-500',
    },
    ACTIVE: {
      label: 'Active',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    },
    INACTIVE: {
      label: 'Inactive',
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-200 dark:border-slate-700',
      dot: 'bg-slate-400',
    },
    BLOCKED: {
      label: 'Blocked',
      bg: 'bg-red-50 dark:bg-red-950/50',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800',
      dot: 'bg-red-500',
    },
  };

  const current = config[normalized] || config.DRAFT;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight shadow-sm transition-all',
        current.bg,
        current.text,
        current.border,
        className
      )}
    >
      {showDot && (
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', current.dot)} />
      )}
      {current.label}
    </span>
  );
};
