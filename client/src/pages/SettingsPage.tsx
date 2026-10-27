import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Bell,
  Building,
  Users,
  Clock,
  Play,
  Save,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { Setting, User } from '@/lib/types';
import api from '@/lib/api';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Setting | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State: Thresholds
  const [tier1Limit, setTier1Limit] = useState<number>(10000);
  const [tier2Limit, setTier2Limit] = useState<number>(100000);

  // Form State: Reminders
  const [preDueDays, setPreDueDays] = useState<string>('7, 3, 1');
  const [postDueDays, setPostDueDays] = useState<string>('1, 7, 15');

  // Form State: Org Profile
  const [companyName, setCompanyName] = useState<string>('Acme Enterprises India Pvt Ltd');
  const [companyEmail, setCompanyEmail] = useState<string>('finance@acmeindia.com');
  const [companyPhone, setCompanyPhone] = useState<string>('+91 80 4567 8900');
  const [companyTaxId, setCompanyTaxId] = useState<string>('29AABCA1234F1Z5');

  // Scheduler Trigger
  const [schedulerRunning, setSchedulerRunning] = useState<boolean>(false);
  const [schedulerOutput, setSchedulerOutput] = useState<any>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [resSettings, resUsers] = await Promise.all([
        api.get('/settings'),
        api.get('/settings/users'),
      ]);

      if (resSettings.data.success) {
        const s = resSettings.data.settings;
        setSettings(s);
        setTier1Limit(s.approvalThresholds?.tier1Limit || 10000);
        setTier2Limit(s.approvalThresholds?.tier2Limit || 100000);
        setPreDueDays((s.reminderConfig?.preDueDays || [7, 3, 1]).join(', '));
        setPostDueDays((s.reminderConfig?.postDueDays || [1, 7, 15]).join(', '));
        setCompanyName(s.companyProfile?.name || 'DBS World Pvt Ltd');
        setCompanyEmail(s.companyProfile?.email || 'contact@dbsworld.com');
        setCompanyPhone(s.companyProfile?.phone || '+91 80 4567 8900');
        setCompanyTaxId(s.companyProfile?.taxId || '29AABCA1234F1Z5');
      }

      if (resUsers.data.success) {
        setUsers(resUsers.data.users);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.put('/settings/approval-thresholds', {
        tier1Limit: Number(tier1Limit),
        tier2Limit: Number(tier2Limit),
      });
      toast.success(res.data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update thresholds');
    }
  };

  const handleSaveReminders = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const preArray = preDueDays.split(',').map((n) => Number(n.trim())).filter((n) => !isNaN(n));
      const postArray = postDueDays.split(',').map((n) => Number(n.trim())).filter((n) => !isNaN(n));

      const res = await api.put('/settings/reminder-config', {
        preDueDays: preArray,
        postDueDays: postArray,
        emailNotificationsEnabled: true,
        inAppNotificationsEnabled: true,
        escalationRole: 'FINANCE_MANAGER',
      });
      toast.success(res.data.message);
    } catch (err: any) {
      toast.error('Failed to update reminder settings');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.put('/settings/company-profile', {
        name: companyName,
        email: companyEmail,
        phone: companyPhone,
        taxId: companyTaxId,
      });
      toast.success(res.data.message);
    } catch (err: any) {
      toast.error('Failed to update company profile');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await api.put(`/settings/users/${userId}/role`, { role: newRole });
      toast.success(res.data.message);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId || (u as any)._id === userId ? { ...u, role: newRole as any } : u))
      );
    } catch (err: any) {
      toast.error('Failed to update user role');
    }
  };

  const handleTriggerScheduler = async () => {
    setSchedulerRunning(true);
    setSchedulerOutput(null);
    try {
      const res = await api.post('/settings/trigger-scheduler');
      if (res.data.success) {
        setSchedulerOutput(res.data.result);
        toast.success(res.data.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to trigger scheduler');
    } finally {
      setSchedulerRunning(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <SettingsIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            System Administration & Governance Rules
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure dynamic multi-tier approval limits, automated escalation intervals, user RBAC, and background jobs.
          </p>
        </div>
      </div>

      <Tabs defaultValue="thresholds" className="space-y-6">
        <TabsList className="grid w-full sm:w-auto grid-cols-4 rounded-xl">
          <TabsTrigger value="thresholds" className="text-xs font-semibold">
            Approval Tiers
          </TabsTrigger>
          <TabsTrigger value="reminders" className="text-xs font-semibold">
            Reminder Scheduler
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs font-semibold">
            User RBAC ({users.length})
          </TabsTrigger>
          <TabsTrigger value="org" className="text-xs font-semibold">
            Organization Profile
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Approval Thresholds Configuration */}
        <TabsContent value="thresholds">
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-6">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                Dynamic Multi-Tier Approval Governance Rules
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Set statutory rupee amount thresholds that determine required sequential approval gates for every submitted invoice.
              </CardDescription>
            </div>

            <form onSubmit={handleSaveThresholds} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Tier 1: Single Approval</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      1 Gate
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Applied automatically to all invoices below the Tier 1 ceiling.
                  </p>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Tier 1 Ceiling (₹ INR)</Label>
                    <Input
                      type="number"
                      value={tier1Limit}
                      onChange={(e) => setTier1Limit(Number(e.target.value))}
                      className="text-xs font-mono font-bold"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Condition: &lt; {formatINR(tier1Limit)}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Tier 2: Dual Approval</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      2 Gates
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Requires line-item review followed by Department Manager authorization.
                  </p>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Tier 2 Ceiling (₹ INR)</Label>
                    <Input
                      type="number"
                      value={tier2Limit}
                      onChange={(e) => setTier2Limit(Number(e.target.value))}
                      className="text-xs font-mono font-bold"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Condition: {formatINR(tier1Limit)} – {formatINR(tier2Limit)}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-950 dark:text-indigo-200">Tier 3: Executive Sign-off</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-200 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200">
                      3 Gates
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    High-value procurement requiring Executive Finance sign-off.
                  </p>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-800 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    &gt; {formatINR(tier2Limit)}
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Automatically assigned to all high-value invoices.
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-indigo-500/20"
                >
                  <Save className="h-4 w-4" />
                  <span>Update Approval Governance Rules</span>
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        {/* TAB 2: Reminder & Background Scheduler */}
        <TabsContent value="reminders" className="space-y-6">
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-6">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                Automated Due Date Reminders & Escalation Schedule
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Configure background `node-cron` intervals for pre-due alerts and escalating post-due overdue reminders.
              </CardDescription>
            </div>

            <form onSubmit={handleSaveReminders} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Pre-Due Reminder Days (Comma Separated)</Label>
                  <Input
                    value={preDueDays}
                    onChange={(e) => setPreDueDays(e.target.value)}
                    placeholder="7, 3, 1"
                    className="text-xs font-mono"
                  />
                  <p className="text-[11px] text-slate-400">
                    Sends in-app notifications and simulated email 7, 3, and 1 days before due date.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Post-Due Escalation Days (Comma Separated)</Label>
                  <Input
                    value={postDueDays}
                    onChange={(e) => setPostDueDays(e.target.value)}
                    placeholder="1, 7, 15"
                    className="text-xs font-mono"
                  />
                  <p className="text-[11px] text-slate-400">
                    Escalates overdue invoices to Finance Managers at 1, 7, and 15 days overdue.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Reminder Schedules</span>
                </Button>
              </div>
            </form>

            {/* Manual Trigger Test Section */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <Play className="h-4 w-4 text-emerald-500" />
                    Manual Scheduler Execution (Instant Testing)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Trigger the reminder and recurring template generation job immediately without waiting for midnight cron.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleTriggerScheduler}
                  disabled={schedulerRunning}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shrink-0"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>{schedulerRunning ? 'Executing Cron...' : 'Run Scheduler Now'}</span>
                </Button>
              </div>

              {schedulerOutput && (
                <div className="mt-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-950 dark:text-emerald-200 space-y-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Scheduler Run Completed Successfully:
                  </span>
                  <p className="font-mono text-[11px]">
                    Processed: {schedulerOutput.processedInvoices} Invoices | Reminders Dispatched: {schedulerOutput.remindersSent} | Overdue Marked: {schedulerOutput.overdueMarked} | Recurring Invoices Auto-Generated: {schedulerOutput.recurringGenerated}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* TAB 3: User Role Management */}
        <TabsContent value="users">
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                User Management & Role Permissions
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Assign and modify role authorities (Admin, Finance Manager, Approver, Vendor) across the organization.
              </CardDescription>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u: any) => (
                <div key={u._id || u.id} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                    <p className="text-slate-500 text-[11px]">{u.email}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleUpdateRole(u._id || u.id, e.target.value)}
                      className="h-8 rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 text-xs px-2 font-semibold text-slate-800 dark:text-slate-200"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="FINANCE_MANAGER">FINANCE_MANAGER</option>
                      <option value="APPROVER">APPROVER</option>
                      <option value="VENDOR">VENDOR</option>
                    </select>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      {u.isActive !== false ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* TAB 4: Organization Profile */}
        <TabsContent value="org">
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-6">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="h-5 w-5 text-indigo-600" />
                Enterprise Organization Profile
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Corporate identification and statutory GST details rendered on generated invoices and purchase orders.
              </CardDescription>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Organization Name</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Corporate GSTIN</Label>
                  <Input
                    value={companyTaxId}
                    onChange={(e) => setCompanyTaxId(e.target.value.toUpperCase())}
                    required
                    className="text-xs font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Finance Desk Email</Label>
                  <Input
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Contact Phone</Label>
                  <Input
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  <span>Update Organization Profile</span>
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
