import React from 'react';
import { Invoice, Approval } from '@/lib/types';
import { Check, Clock, X, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface StepperTimelineProps {
  invoice: Invoice;
  approvals: Approval[];
}

export const StepperTimeline: React.FC<StepperTimelineProps> = ({ invoice, approvals }) => {
  const totalSteps = invoice.requiredApprovalSteps || 1;
  const currentStep = invoice.currentApprovalStep || 1;
  const isRejected = invoice.status === 'REJECTED';
  const isApproved = ['APPROVED', 'PAYMENT_PROCESSING', 'PAID'].includes(invoice.status);

  const getStepTitle = (stepNum: number) => {
    switch (stepNum) {
      case 1:
        return 'Step 1: Verification & Line-Item Review';
      case 2:
        return 'Step 2: Department Manager Authorization';
      case 3:
        return 'Step 3: Executive Finance Board Sign-off';
      default:
        return `Step ${stepNum} Approval`;
    }
  };

  const getStepDescription = (stepNum: number) => {
    switch (stepNum) {
      case 1:
        return 'Base compliance and PO verification (<₹10,000 threshold)';
      case 2:
        return 'Mid-tier procurement authorization (₹10k–₹1 Lakh threshold)';
      case 3:
        return 'High-value executive threshold sign-off (>₹1 Lakh threshold)';
      default:
        return '';
    }
  };

  const steps = [];
  for (let i = 1; i <= totalSteps; i++) {
    const approvalRecord = approvals.find((a) => a.stepNumber === i);
    let stepStatus: 'COMPLETED' | 'CURRENT' | 'UPCOMING' | 'REJECTED' = 'UPCOMING';

    if (isRejected && i === currentStep) {
      stepStatus = 'REJECTED';
    } else if (approvalRecord?.status === 'APPROVED' || (isApproved && i <= totalSteps)) {
      stepStatus = 'COMPLETED';
    } else if (i === currentStep && !isRejected && !isApproved) {
      stepStatus = 'CURRENT';
    }

    steps.push({
      stepNumber: i,
      title: getStepTitle(i),
      description: getStepDescription(i),
      status: stepStatus,
      record: approvalRecord,
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Approval Workflow & Audit Timeline
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tier-based multi-step governance: requires {totalSteps} {totalSteps === 1 ? 'level' : 'levels'} of approval
          </p>
        </div>

        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {totalSteps > 1 ? `Tier ${totalSteps} (${totalSteps} Approvals)` : 'Standard (1 Approval)'}
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {steps.map((step, idx) => (
          <div key={step.stepNumber} className="relative flex items-start gap-4">
            {/* Step Icon Indicator */}
            <div
              className={cn(
                'absolute -left-6 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 text-xs font-bold transition-all',
                step.status === 'COMPLETED' &&
                  'bg-emerald-600 text-white',
                step.status === 'CURRENT' &&
                  'bg-amber-500 text-white animate-pulse',
                step.status === 'REJECTED' &&
                  'bg-rose-600 text-white',
                step.status === 'UPCOMING' &&
                  'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              )}
            >
              {step.status === 'COMPLETED' ? (
                <Check className="h-3.5 w-3.5" />
              ) : step.status === 'REJECTED' ? (
                <X className="h-3.5 w-3.5" />
              ) : step.status === 'CURRENT' ? (
                <Clock className="h-3.5 w-3.5" />
              ) : (
                step.stepNumber
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-900 dark:text-slate-100">
                  {step.title}
                </p>
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                    step.status === 'COMPLETED' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
                    step.status === 'CURRENT' && 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
                    step.status === 'REJECTED' && 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
                    step.status === 'UPCOMING' && 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  )}
                >
                  {step.status}
                </span>
              </div>

              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                {step.description}
              </p>

              {/* Approval or Rejection Details */}
              {step.record && (
                <div className="mt-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Reviewed by: {step.record.approver?.name || 'Assigned Manager'}
                    </span>
                    {step.record.decisionDate && (
                      <span className="text-slate-400">
                        {formatDateTime(step.record.decisionDate)}
                      </span>
                    )}
                  </div>
                  {step.record.comments && (
                    <p className="text-slate-600 dark:text-slate-300 italic">
                      "{step.record.comments}"
                    </p>
                  )}
                </div>
              )}

              {step.status === 'REJECTED' && invoice.rejectionReason && !step.record && (
                <div className="mt-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 p-2.5 border border-rose-200 dark:border-rose-900 text-[11px] text-rose-800 dark:text-rose-200">
                  <span className="font-bold block">Rejection Reason:</span>
                  <p className="italic mt-0.5">"{invoice.rejectionReason}"</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
