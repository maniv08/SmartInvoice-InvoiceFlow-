import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Repeat, Calendar, Building, Plus, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { formatINR, formatDate } from '@/lib/utils';
import { Vendor } from '@/lib/types';
import api from '@/lib/api';
import { toast } from 'sonner';

interface RecurringTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const RecurringTemplateModal: React.FC<RecurringTemplateModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>('Monthly Cloud Infrastructure Retainer');
  const [vendorId, setVendorId] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('MONTHLY');
  const [amount, setAmount] = useState<number>(35000);
  const [description, setDescription] = useState<string>('Scheduled auto-generated recurring invoice');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/invoices/recurring-templates');
      if (res.data.success) {
        setTemplates(res.data.templates);
      }
    } catch (err) {
      console.error('Failed to fetch recurring templates:', err);
    }
  };

  useEffect(() => {
    if (open) {
      fetchTemplates();
      api.get('/vendors').then((res) => {
        if (res.data.success) {
          setVendors(res.data.vendors);
          if (res.data.vendors.length > 0 && !vendorId) {
            setVendorId(res.data.vendors[0]._id);
          }
        }
      });
    }
  }, [open]);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) {
      toast.error('Please select a vendor');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/invoices/recurring-templates', {
        name,
        vendorId,
        frequency,
        amount: Number(amount),
        description,
        startDate,
        isActive: true,
      });

      if (res.data.success) {
        toast.success('Recurring invoice template established!');
        setIsFormOpen(false);
        fetchTemplates();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create recurring template');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await api.put(`/invoices/recurring-templates/${id}`, {
        isActive: !currentStatus,
      });
      if (res.data.success) {
        toast.success(currentStatus ? 'Template paused' : 'Template activated');
        fetchTemplates();
      }
    } catch (err: any) {
      toast.error('Failed to toggle template status');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto rounded-2xl p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Repeat className="h-5 w-5 text-indigo-600" />
            Recurring Invoice Schedules & Automation
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Set up auto-generated invoices for recurring retainer contracts, monthly server clusters, and SaaS licenses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Active Recurring Templates ({templates.length})
            </span>
            <Button
              size="sm"
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="text-xs rounded-xl font-semibold gap-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isFormOpen ? 'Close Form' : 'New Recurring Schedule'}</span>
            </Button>
          </div>

          {/* New Template Form */}
          {isFormOpen && (
            <form
              onSubmit={handleCreateTemplate}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Template / Contract Name *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Vendor Supplier *</Label>
                  <Select value={vendorId} onValueChange={setVendorId}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((v) => (
                        <SelectItem key={v._id} value={v._id} className="text-xs">
                          {v.name} ({v.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Recurrence Frequency *</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly (Every 3 Months)</SelectItem>
                      <SelectItem value="YEARLY">Yearly / Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Base Amount (₹ INR) *</Label>
                  <Input
                    type="number"
                    min="100"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                    className="text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  {loading ? 'Creating...' : 'Establish Recurring Template'}
                </Button>
              </div>
            </form>
          )}

          {/* Templates List */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {templates.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">
                No recurring schedules configured yet.
              </div>
            ) : (
              templates.map((t) => (
                <div
                  key={t._id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{t.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {t.frequency}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Supplier: <span className="font-semibold text-slate-700 dark:text-slate-300">{t.vendor?.name}</span> • Next Run:{' '}
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                        {t.nextRunDate ? formatDate(t.nextRunDate) : 'Pending next cycle'}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-slate-900 dark:text-white tabular-nums font-mono">
                      {formatINR(t.amount)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(t._id, t.isActive)}
                      className={`h-7 text-xs rounded-lg font-semibold ${
                        t.isActive
                          ? 'text-emerald-600 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50'
                          : 'text-slate-400'
                      }`}
                    >
                      {t.isActive ? 'Active' : 'Paused'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
