import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatCompactINR, formatINR } from '@/lib/utils';

interface AreaChartCardProps {
  data: Array<{
    month: string;
    'Total Invoiced': number;
    'Total Paid': number;
  }>;
  title?: string;
  description?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-500 dark:text-slate-400">{entry.name}:</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                {formatINR(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const AreaChartCard: React.FC<AreaChartCardProps> = ({
  data,
  title = 'Invoice Billing vs Settlement Trends',
  description = 'Monthly total billed invoice volume compared to settled vendor disbursements',
}) => {
  return (
    <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
            {title}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {description}
          </CardDescription>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
            <span className="text-slate-600 dark:text-slate-300">Total Invoiced</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-300">Total Paid</span>
          </div>
        </div>
      </div>

      <div className="h-[280px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="invoicedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCompactINR(v)}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              width={65}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="Total Invoiced"
              stroke="#6366f1"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#invoicedGradient)"
            />
            <Area
              type="monotone"
              dataKey="Total Paid"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#paidGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
