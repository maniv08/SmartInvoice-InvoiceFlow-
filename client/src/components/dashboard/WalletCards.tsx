import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowUpRight, ArrowDownLeft, Plus, CreditCard, ShieldCheck, Sparkles } from 'lucide-react';
import { formatINR } from '@/lib/utils';

interface WalletCardsProps {
  totalPayable: number;
  totalPaid: number;
  onNewInvoice?: () => void;
  onRecordPayment?: () => void;
}

export const WalletCards: React.FC<WalletCardsProps> = ({
  totalPayable,
  totalPaid,
  onNewInvoice,
  onRecordPayment,
}) => {
  const spendingLimit = 3500000; // ₹35,00,000 corporate procurement limit
  const percentSpent = Math.min(100, Math.round((totalPaid / spendingLimit) * 100));

  // Dynamic Working Capital Balance calculated from treasury capital reserve minus settled remittances
  const totalReserve = 5500000; // ₹55 Lakh initial treasury pool
  const workingCapitalBalance = Math.max(150000, totalReserve - totalPaid);

  // Dynamic distribution across the 3 active corporate treasury accounts
  const hdfcBalance = Math.round(workingCapitalBalance * 0.5);
  const iciciBalance = Math.round(workingCapitalBalance * 0.3);
  const sbiBalance = workingCapitalBalance - hdfcBalance - iciciBalance;

  return (
    <div className="space-y-6">
      {/* Top Total Balance Card with Quick Action Pills */}
      <Card className="p-6 border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm rounded-2xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Working Capital Balance
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            🇮🇳 INR (₹)
          </span>
        </div>

        <div className="mt-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {formatINR(workingCapitalBalance)}
          </h2>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5">
              ↑ 8.4%
            </span>
            <span>liquidity buffer after active settlements</span>
          </div>
        </div>

        {/* Quick Action Buttons (Transfer & Request / Pay & Bill) */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            onClick={onRecordPayment}
            className="w-full h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            <span>Remit Payment</span>
          </Button>
          <Button
            onClick={onNewInvoice}
            variant="outline"
            className="w-full h-9 rounded-xl font-semibold flex items-center justify-center gap-2 border-slate-200 dark:border-slate-800"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Submit Invoice</span>
          </Button>
        </div>

        {/* Mini Accounts / Sub-wallets */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
            Active Corporate Accounts
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">HDFC Primary</div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">{formatINR(hdfcBalance)}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">● Active (50%)</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">ICICI Escrow</div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">{formatINR(iciciBalance)}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">● Active (30%)</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">SBI Forex</div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">{formatINR(sbiBalance)}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 font-medium">● Ready (20%)</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Monthly Procurement Budget Progress Gauge Card */}
      <Card className="p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm rounded-2xl">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Monthly Procurement Limit</span>
          <span className="text-slate-500 dark:text-slate-400 font-medium">{percentSpent}% consumed</span>
        </div>

        <div className="mt-3">
          <Progress value={percentSpent} indicatorColor="bg-emerald-500" className="h-2.5" />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
          <span>{formatINR(totalPaid)} disbursed</span>
          <span>{formatINR(spendingLimit)} budget</span>
        </div>
      </Card>

      {/* Virtual Corporate Cards Display */}
      <Card className="p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Commercial Purchasing Cards
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg"
          >
            + Issue Card
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Card 1: Primary Corporate Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-5 text-white shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">
                Corporate Primary
              </span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                ● Active
              </span>
            </div>
            <div className="mt-4 text-xs tracking-widest font-mono text-slate-300">
              •••• •••• •••• 6782
            </div>
            <div className="mt-3.5 flex items-center justify-between text-xs text-slate-400 gap-2">
              <div className="whitespace-nowrap text-[11px]">
                <span>EXP</span> <span className="text-white font-medium ml-1">09/29</span>
              </div>
              <div className="whitespace-nowrap text-[11px]">
                <span>LIMIT</span> <span className="text-white font-medium ml-1">₹15L</span>
              </div>
              <div className="font-semibold text-white truncate text-[11px] text-right">Acme Corp</div>
            </div>
          </div>

          {/* Card 2: Vendor Procurement Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-950 p-5 text-white shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-100">
                Vendor Procurement
              </span>
              <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1">
                ● Active
              </span>
            </div>
            <div className="mt-4 text-xs tracking-widest font-mono text-emerald-100">
              •••• •••• •••• 4356
            </div>
            <div className="mt-3.5 flex items-center justify-between text-xs text-emerald-200/80 gap-2">
              <div className="whitespace-nowrap text-[11px]">
                <span>EXP</span> <span className="text-white font-medium ml-1">11/28</span>
              </div>
              <div className="whitespace-nowrap text-[11px]">
                <span>LIMIT</span> <span className="text-white font-medium ml-1">₹5L</span>
              </div>
              <div className="font-semibold text-white truncate text-[11px] text-right">Procure-1</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
