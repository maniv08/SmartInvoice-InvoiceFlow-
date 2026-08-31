import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import {
  Building,
  Mail,
  Phone,
  Landmark,
  FileText,
  CreditCard,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { formatINR, formatDate, formatDateTime } from '@/lib/utils';
import { Vendor, Invoice, Payment } from '@/lib/types';
import api from '@/lib/api';
import { toast } from 'sonner';

interface VendorProfile360Props {
  vendorId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewInvoice?: (invoiceId: string) => void;
}

export const VendorProfile360: React.FC<VendorProfile360Props> = ({
  vendorId,
  open,
  onOpenChange,
  onViewInvoice,
}) => {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [profileData, setProfileData] = useState<{
    totalInvoices: number;
    totalBilled: number;
    totalPaid: number;
    outstandingBalance: number;
    invoices: Invoice[];
    payments: Payment[];
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (open && vendorId) {
      setLoading(true);
      api
        .get(`/vendors/${vendorId}`)
        .then((res) => {
          if (res.data.success) {
            setVendor(res.data.vendor);
            setProfileData(res.data.profile360);
          }
        })
        .catch((err) => {
          toast.error('Failed to load vendor 360 profile');
        })
        .finally(() => setLoading(false));
    }
  }, [open, vendorId]);

  if (!vendor && loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl p-8 rounded-2xl">
          <div className="py-16 text-center text-sm text-slate-500 animate-pulse">
            Loading 360 Vendor Profile...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!vendor || !profileData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-md">
              {vendor.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {vendor.name}
                </h2>
                <StatusBadge status={vendor.status} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Code: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{vendor.code}</span> • {vendor.category}
              </p>
            </div>
          </div>
        </div>

        {/* 360 Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Billed</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
              {formatINR(profileData.totalBilled)}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs">
            <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Total Paid</span>
            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 tabular-nums mt-0.5">
              {formatINR(profileData.totalPaid)}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs">
            <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">Outstanding Balance</span>
            <div className="text-lg font-bold text-amber-700 dark:text-amber-300 tabular-nums mt-0.5">
              {formatINR(profileData.outstandingBalance)}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Invoices</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
              {profileData.totalInvoices} Invoices
            </div>
          </div>
        </div>

        {/* Contact & Banking Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider block">
              Contact & Compliance
            </span>
            <p className="text-slate-600 dark:text-slate-400">
              GSTIN: <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{vendor.gstin}</span>
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              Representative: {vendor.contactPerson}
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              Email: {vendor.email} • Phone: {vendor.phone}
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              Payment Terms: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{vendor.paymentTerms}</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider block flex items-center gap-1">
              <Landmark className="h-3.5 w-3.5 text-indigo-500" />
              Direct Electronic Settlement Bank Details
            </span>
            <p className="text-slate-600 dark:text-slate-400">
              Beneficiary: <span className="font-semibold text-slate-900 dark:text-white">{vendor.bankDetails?.accountName}</span>
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              A/C Number: <span className="font-mono font-semibold text-slate-900 dark:text-white">{vendor.bankDetails?.accountNumber}</span>
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              IFSC: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{vendor.bankDetails?.ifscCode}</span>
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              Bank: {vendor.bankDetails?.bankName} ({vendor.bankDetails?.branch || 'Main'})
            </p>
          </div>
        </div>

        {/* Tabbed Invoices and Payments History */}
        <Tabs defaultValue="invoices" className="mt-4">
          <TabsList className="grid w-full grid-cols-2 rounded-xl mb-4">
            <TabsTrigger value="invoices" className="text-xs font-semibold">
              Invoice History ({profileData.invoices.length})
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-xs font-semibold">
              Payment Remittances ({profileData.payments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices">
            <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              {profileData.invoices.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No invoices found for this vendor.
                </div>
              ) : (
                profileData.invoices.map((inv) => (
                  <div
                    key={inv._id}
                    onClick={() => {
                      if (onViewInvoice) {
                        onOpenChange(false);
                        onViewInvoice(inv._id);
                      }
                    }}
                    className="p-3 text-xs flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                          {inv.invoiceNumber}
                        </span>
                        <StatusBadge status={inv.status} />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Issued: {formatDate(inv.issueDate)} • Due: {formatDate(inv.dueDate)}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums font-mono">
                      {formatINR(inv.totalAmount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              {profileData.payments.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No payments remitted to this vendor yet.
                </div>
              ) : (
                profileData.payments.map((p) => (
                  <div key={p._id} className="p-3 text-xs flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                          {p.paymentNumber}
                        </span>
                        <StatusBadge status={p.status} />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {p.paymentMethod} • Ref: <span className="font-mono text-indigo-600 dark:text-indigo-400">{p.referenceId}</span> • Date: {formatDate(p.paymentDate)}
                      </p>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums font-mono">
                      {formatINR(p.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
