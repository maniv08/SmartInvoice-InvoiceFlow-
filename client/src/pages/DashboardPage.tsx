import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { WalletCards } from '@/components/dashboard/WalletCards';
import { AreaChartCard } from '@/components/dashboard/AreaChartCard';
import { DonutChartCard } from '@/components/dashboard/DonutChartCard';
import { BarChartCard } from '@/components/dashboard/BarChartCard';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { UpcomingPaymentsList } from '@/components/dashboard/UpcomingPaymentsList';
import { InvoiceFormModal } from '@/components/invoices/InvoiceFormModal';
import { InvoiceDetailModal } from '@/components/invoices/InvoiceDetailModal';
import { RecordPaymentModal } from '@/components/payments/RecordPaymentModal';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isVendor } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [targetPaymentInvoice, setTargetPaymentInvoice] = useState<any>(null);

  const fetchDashboardData = async (manual = false) => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/metrics');
      if (res.data.success) {
        setMetrics(res.data);
        if (manual) {
          toast.success('Live dashboard metrics and charts synchronized!');
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
      if (manual) {
        toast.error('Failed to synchronize dashboard metrics');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(false);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Top Welcome Header (Matching Finexy/Horizon reference mockup) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Executive'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Stay on top of your invoice verification pipelines, monitor approvals, and track disbursements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchDashboardData(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-800 shadow-inner"
            title="Refresh Live Metrics"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Invoices"
          value={metrics?.kpis?.totalInvoices || 0}
          delta={{ value: '+12%', isPositive: true, label: 'vs last month' }}
          icon={<FileText className="h-5 w-5" />}
          iconBg="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
          onClick={() => navigate('/invoices')}
        />

        <KpiCard
          title="Pending Approvals"
          value={metrics?.kpis?.pendingApprovalCount || 0}
          delta={{ value: '-4.5%', isPositive: true, label: 'in review queue' }}
          icon={<Clock className="h-5 w-5" />}
          iconBg="bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
          subtitle={metrics?.kpis?.totalPendingAmount ? `${formatINR(metrics.kpis.totalPendingAmount)} total` : undefined}
          onClick={() => navigate('/approvals')}
        />

        <KpiCard
          title="Total Disbursed"
          value={formatINR(metrics?.kpis?.totalPaid || 0)}
          delta={{ value: '+18.4%', isPositive: true, label: 'settled volume' }}
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconBg="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
          onClick={() => navigate('/payments')}
        />

        <KpiCard
          title="Overdue Payables"
          value={formatINR(metrics?.kpis?.overdueAmount || 0)}
          delta={{ value: `${metrics?.kpis?.overdueCount || 0} invoices`, isPositive: false, label: 'escalated' }}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconBg="bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
          onClick={() => navigate('/invoices?status=OVERDUE')}
        />
      </div>

      {/* Main Grid: Left Wallet Panel + Right Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Wallet, Cards, Spending Limit (Finexy Layout) */}
        <div className="lg:col-span-5 space-y-6">
          <WalletCards
            totalPayable={metrics?.kpis?.totalPayable || 0}
            totalPaid={metrics?.kpis?.totalPaid || 0}
            onNewInvoice={() => setIsInvoiceModalOpen(true)}
            onRecordPayment={() => setIsPaymentModalOpen(true)}
          />

          <DonutChartCard
            data={metrics?.statusDistribution || []}
            title="Invoice Status Breakdown"
            description="Active invoice volume across all approval and payment stages"
          />
        </div>

        {/* Right Column: Interactive Area & Bar Charts */}
        <div className="lg:col-span-7 space-y-6">
          <AreaChartCard
            data={metrics?.monthlyTrends || []}
            title="Monthly Invoicing vs Settlement Volume"
            description="Trend analysis of monthly procurement invoices compared to cash remittances"
          />

          <BarChartCard
            data={metrics?.topVendors || []}
            title="Top Vendor Spending Allocation"
            description="Disbursement concentration among key enterprise suppliers"
          />
        </div>
      </div>

      {/* Bottom Section: Upcoming Payments & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingPaymentsList
          invoices={metrics?.upcomingPayments || []}
          onPayNow={(inv) => {
            setTargetPaymentInvoice(inv);
            setIsPaymentModalOpen(true);
          }}
          onViewInvoice={(inv) => setSelectedInvoiceId(inv._id)}
        />

        <RecentActivityFeed
          activities={metrics?.recentActivities || []}
          onViewInvoice={(id) => setSelectedInvoiceId(id)}
        />
      </div>

      {/* Modals */}
      <InvoiceFormModal
        open={isInvoiceModalOpen}
        onOpenChange={setIsInvoiceModalOpen}
        onSuccess={fetchDashboardData}
      />

      <RecordPaymentModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        targetInvoice={targetPaymentInvoice}
        onSuccess={() => {
          setTargetPaymentInvoice(null);
          fetchDashboardData();
        }}
      />

      <InvoiceDetailModal
        invoiceId={selectedInvoiceId}
        open={!!selectedInvoiceId}
        onOpenChange={(op) => !op && setSelectedInvoiceId(null)}
        onApprove={() => fetchDashboardData()}
        onReject={() => fetchDashboardData()}
        onRecordPayment={(inv) => {
          setSelectedInvoiceId(null);
          setTargetPaymentInvoice(inv);
          setIsPaymentModalOpen(true);
        }}
        onRefresh={fetchDashboardData}
      />
    </div>
  );
};

