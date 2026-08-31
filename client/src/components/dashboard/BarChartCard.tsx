import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { formatCompactINR, formatINR } from '@/lib/utils';

interface BarChartCardProps {
  data: Array<{
    vendor: string;
    amount: number;
  }>;
  title?: string;
  description?: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900 text-xs">
        <p className="font-semibold text-slate-800 dark:text-slate-200">{d.vendor}</p>
        <p className="text-indigo-600 dark:text-indigo-400 font-bold mt-1 tabular-nums">
          {formatINR(d.amount)}
        </p>
      </div>
    );
  }
  return null;
};

export const BarChartCard: React.FC<BarChartCardProps> = ({
  data,
  title = 'Top Vendor Spending Breakdown',
  description = 'Aggregated invoice disbursement allocation across major suppliers',
}) => {
  const colors = ['#6366f1', '#4f46e5', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

  return (
    <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm p-6">
      <div className="pb-4">
        <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
          {title}
        </CardTitle>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {description}
        </CardDescription>
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148, 163, 184, 0.15)" />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCompactINR(v)}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
            />
            <YAxis
              type="category"
              dataKey="vendor"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              width={140}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
