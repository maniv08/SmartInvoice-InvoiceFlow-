import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  delta?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  icon?: React.ReactNode;
  iconBg?: string;
  subtitle?: string;
  className?: string;
  badgeText?: string;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  delta,
  icon,
  iconBg = 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
  subtitle,
  className,
  badgeText,
  onClick,
}) => {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'relative overflow-hidden p-6 transition-all duration-200 border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700',
        onClick && 'cursor-pointer hover:-translate-y-0.5',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {value}
            </span>
            {badgeText && (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {badgeText}
              </span>
            )}
          </div>
        </div>

        {icon && (
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-inner transition-transform group-hover:scale-105',
              iconBg
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {(delta || subtitle) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {delta && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold',
                delta.isPositive !== false
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
              )}
            >
              {delta.isPositive !== false ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {delta.value}
            </span>
          )}

          {delta?.label && (
            <span className="text-slate-500 dark:text-slate-400">
              {delta.label}
            </span>
          )}

          {subtitle && !delta?.label && (
            <span className="text-slate-500 dark:text-slate-400">{subtitle}</span>
          )}
        </div>
      )}
    </Card>
  );
};
