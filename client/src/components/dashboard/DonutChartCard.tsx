import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatCompactINR, formatINR } from '@/lib/utils';

interface DonutChartCardProps {
  data: Array<{
    status: string;
    count: number;
    amount: number;
    color: string;
  }>;
  title?: string;
  description?: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900 text-xs">
        <p className="font-semibold text-slate-800 dark:text-slate-200">{data.status}</p>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Count: <span className="font-semibold text-slate-900 dark:text-white">{data.count}</span>
        </p>
        <p className="text-slate-500 dark:text-slate-400">
          Volume: <span className="font-semibold text-slate-900 dark:text-white">{formatINR(data.amount)}</span>
        </p>
      </div>
    );
  }
  return null;
};

export const DonutChartCard: React.FC<DonutChartCardProps> = ({
  data,
  title = 'Invoice Lifecycle Distribution',
  description = 'Breakdown of invoices by active operational status',
}) => {
  const totalInvoices = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm p-6 flex flex-col justify-between">
      <div>
        <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
          {title}
        </CardTitle>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {description}
        </CardDescription>
      </div>

      <div className="relative my-2 h-[200px] w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={80}
              paddingAngle={3}
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Centered Total Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {totalInvoices}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            Total Invoices
          </span>
        </div>
      </div>

      {/* Legend with Status color pills */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        {data.slice(0, 6).map((item, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="truncate text-slate-600 dark:text-slate-400 text-xs">{item.status}</span>
            </div>
            <span className="font-semibold text-slate-900 dark:text-slate-200 tabular-nums text-xs">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};
