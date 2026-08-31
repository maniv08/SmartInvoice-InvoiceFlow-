import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-indigo-600 text-white hover:bg-indigo-700',
        secondary:
          'border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100',
        destructive:
          'border-transparent bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900',
        outline: 'text-slate-950 dark:text-slate-50 border-slate-200 dark:border-slate-800',
        success:
          'border-emerald-200 dark:border-emerald-900 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
        warning:
          'border-amber-200 dark:border-amber-900 bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
        info:
          'border-blue-200 dark:border-blue-900 bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
        purple:
          'border-purple-200 dark:border-purple-900 bg-purple-50 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
