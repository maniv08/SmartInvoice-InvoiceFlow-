import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  History,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  User,
  Clock,
  Code,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { AuditLog } from '@/lib/types';
import api from '@/lib/api';

export const AuditLogsPage: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs', {
        params: {
          entityType: selectedEntity !== 'ALL' ? selectedEntity : undefined,
          action: selectedAction !== 'ALL' ? selectedAction : undefined,
        },
      });
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedEntity, selectedAction]);

  const toggleExpand = (id: string) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200';
    if (action.includes('APPROVE')) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200';
    if (action.includes('REJECT') || action.includes('DELETE')) return 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200';
    if (action.includes('PAYMENT')) return 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <History className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Compliance & Audit Trail Register
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Immutable, append-only security log of all financial creations, managerial authorizations, and parameter mutations.
          </p>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 text-xs px-3 font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Entities</option>
            <option value="Invoice">Invoice</option>
            <option value="Payment">Payment</option>
            <option value="Vendor">Vendor</option>
            <option value="Setting">Setting</option>
            <option value="User">User</option>
            <option value="ApprovalDelegation">Delegation</option>
          </select>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 text-xs px-3 font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Actions</option>
            <option value="INVOICE_CREATE">Invoice Created</option>
            <option value="INVOICE_APPROVE">Invoice Approved</option>
            <option value="INVOICE_REJECT">Invoice Rejected</option>
            <option value="PAYMENT_RECORD">Payment Remitted</option>
            <option value="APPROVAL_THRESHOLDS_UPDATE">Thresholds Updated</option>
            <option value="USER_ROLE_UPDATE">Permissions Changed</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          {logs.length} audit records logged
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading audit log events...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            ✨ No audit records found for the selected criteria.
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedLogId === log._id;
            const hasDiff = log.previousValue || log.newValue;

            return (
              <div key={log._id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <div
                  onClick={() => hasDiff && toggleExpand(log._id)}
                  className={`p-4 flex items-center justify-between gap-4 text-xs ${
                    hasDiff ? 'cursor-pointer' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {hasDiff && (
                      <button className="text-slate-400 hover:text-slate-600">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    )}

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getActionColor(
                            log.action
                          )}`}
                        >
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {log.entityType} #{log.entityName || log.entityId}
                        </span>
                      </div>

                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Actor: <span className="font-semibold text-slate-700 dark:text-slate-300">{log.userName || 'System'}</span> • IP:{' '}
                        <span className="font-mono">{log.ipAddress || 'Internal'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] tabular-nums font-mono">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Collapsible JSON State Diff View */}
                {isExpanded && hasDiff && (
                  <div className="px-6 pb-4 pt-1 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800/60">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Previous State:
                        </span>
                        <pre className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 overflow-x-auto max-h-48">
                          {log.previousValue
                            ? JSON.stringify(log.previousValue, null, 2)
                            : 'null (Initial Creation)'}
                        </pre>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          New Applied State:
                        </span>
                        <pre className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-indigo-600 dark:text-indigo-400 overflow-x-auto max-h-48">
                          {JSON.stringify(log.newValue, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
