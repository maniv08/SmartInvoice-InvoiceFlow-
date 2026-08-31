import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCheck, Calendar, ShieldCheck, XCircle, Plus, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ApprovalDelegation, User } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

export const DelegationManager: React.FC = () => {
  const { user } = useAuth();
  const [delegations, setDelegations] = useState<ApprovalDelegation[]>([]);
  const [eligibleUsers, setEligibleUsers] = useState<User[]>([]);
  const [toUserId, setToUserId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  const fetchDelegations = async () => {
    try {
      const res = await api.get('/approvals/delegations/list');
      if (res.data.success) {
        setDelegations(res.data.delegations);
      }
    } catch (err) {
      console.error('Failed to fetch delegations:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/settings/users');
      if (res.data.success) {
        // Filter out current user and vendor users
        const approverCandidates = res.data.users.filter(
          (u: User) => u.id !== user?.id && u.role !== 'VENDOR'
        );
        setEligibleUsers(approverCandidates);
        if (approverCandidates.length > 0) {
          setToUserId(approverCandidates[0].id || approverCandidates[0]._id);
        }
      }
    } catch (err) {
      // silent
    }
  };

  useEffect(() => {
    fetchDelegations();
    fetchUsers();
  }, []);

  const handleCreateDelegation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toUserId) {
      toast.error('Please select a manager to delegate to');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/approvals/delegations', {
        toUserId,
        startDate,
        endDate,
        reason: reason || 'Temporary absence and leave coverage',
      });
      if (res.data.success) {
        toast.success('Approval delegation established successfully!');
        setIsFormOpen(false);
        setReason('');
        fetchDelegations();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to establish delegation');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      const res = await api.delete(`/approvals/delegations/${id}`);
      if (res.data.success) {
        toast.success('Delegation revoked');
        fetchDelegations();
      }
    } catch (err: any) {
      toast.error('Failed to revoke delegation');
    }
  };

  return (
    <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Approval Authority Delegations
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Authorize another manager to review and approve invoices during planned absences or leave
          </CardDescription>
        </div>

        <Button
          size="sm"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="text-xs rounded-xl font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          {isFormOpen ? 'Close Form' : 'Delegate Authority'}
        </Button>
      </div>

      {/* Delegation Form */}
      {isFormOpen && (
        <form
          onSubmit={handleCreateDelegation}
          className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Delegatee Manager *</Label>
              <Select value={toUserId} onValueChange={setToUserId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleUsers.map((u: any) => (
                    <SelectItem key={u._id || u.id} value={u._id || u.id} className="text-xs">
                      {u.name} ({u.role?.replace('_', ' ')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Start Date *</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">End Date *</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Reason for Delegation</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Annual Executive Leave / Client On-site Visit"
              className="text-xs"
            />
          </div>

          <div className="flex justify-end gap-2">
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
              {loading ? 'Creating...' : 'Confirm Delegation Authority'}
            </Button>
          </div>
        </form>
      )}

      {/* Delegations Table */}
      <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800/60">
        {delegations.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No active approval delegations currently configured.
          </div>
        ) : (
          delegations.map((d) => (
            <div
              key={d._id}
              className="py-3 flex items-center justify-between gap-4 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {d.fromUser?.name || 'Manager'}
                  </span>
                  <span className="text-slate-400 font-medium">➔</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {d.toUser?.name || 'Delegatee'}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      d.isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {d.isActive ? 'Active Delegation' : 'Revoked'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Coverage: {formatDate(d.startDate)} to {formatDate(d.endDate)} • Reason: "{d.reason || 'Absence'}"
                </p>
              </div>

              {d.isActive && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRevoke(d._id)}
                  className="h-7 text-xs rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 border-rose-200 dark:border-rose-900"
                >
                  Revoke
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
