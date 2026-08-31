import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { InvoiceFormModal } from '@/components/invoices/InvoiceFormModal';
import { InvoiceDetailModal } from '@/components/invoices/InvoiceDetailModal';
import { BulkImportModal } from '@/components/invoices/BulkImportModal';
import { RecurringTemplateModal } from '@/components/invoices/RecurringTemplateModal';
import { ApprovalActionDialog } from '@/components/approvals/ApprovalActionDialog';
import { RecordPaymentModal } from '@/components/payments/RecordPaymentModal';
import { SmartInvoiceExtractionModal } from '@/components/ai/SmartInvoiceExtractionModal';
import { ThreeWayMatchModal } from '@/components/matching/ThreeWayMatchModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Repeat,
  MoreVertical,
  CheckCircle2,
  XCircle,
  CreditCard,
  Trash2,
  Edit,
  Eye,
  Calendar,
  Building,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';
import { formatINR, formatDate } from '@/lib/utils';
import { Invoice, Vendor, InvoiceStatus } from '@/lib/types';
import api from '@/lib/api';
import { toast } from 'sonner';

export const InvoicesPage: React.FC = () => {
  const { user, isAdmin, isFinance, isApprover, isVendor } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1, limit: 10 });

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVendorId, setSelectedVendorId] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const urlStatus = searchParams.get('status');
    if (urlStatus && urlStatus !== selectedStatus) {
      setSelectedStatus(urlStatus);
    }
  }, [searchParams]);

  // Multi-select bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState<boolean>(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState<boolean>(false);
  const [matchModalInvoice, setMatchModalInvoice] = useState<Invoice | null>(null);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
  const [approvalAction, setApprovalAction] = useState<{ invoice: Invoice | null; mode: 'APPROVE' | 'REJECT' | null }>({
    invoice: null,
    mode: null,
  });
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<Invoice | null>(null);

  const fetchInvoices = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 10,
        status: selectedStatus,
        search: searchQuery || undefined,
        vendorId: selectedVendorId !== 'ALL' ? selectedVendorId : undefined,
        sortBy,
        sortOrder,
      };

      const res = await api.get('/invoices', { params });
      if (res.data.success) {
        setInvoices(res.data.invoices);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/vendors').then((res) => {
      if (res.data.success) setVendors(res.data.vendors);
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedStatus, searchQuery, selectedVendorId, sortBy, sortOrder]);

  const statuses = [
    { label: 'All Invoices', value: 'ALL' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Submitted', value: 'SUBMITTED' },
    { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Processing', value: 'PAYMENT_PROCESSING' },
    { label: 'Paid', value: 'PAID' },
    { label: 'Overdue', value: 'OVERDUE' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(invoices.map((i) => i._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Actions
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await api.post('/invoices/bulk-approve', { invoiceIds: selectedIds });
      toast.success(res.data.message);
      setSelectedIds([]);
      fetchInvoices(pagination.page);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk approval failed');
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await api.post('/invoices/bulk-reject', { invoiceIds: selectedIds });
      toast.success(res.data.message);
      setSelectedIds([]);
      fetchInvoices(pagination.page);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk rejection failed');
    }
  };

  const handleExportCSV = () => {
    const selectedInvoices =
      selectedIds.length > 0
        ? invoices.filter((i) => selectedIds.includes(i._id))
        : invoices;

    const headers = ['Invoice Number', 'Vendor', 'Issue Date', 'Due Date', 'PO Number', 'Subtotal', 'Tax Amount', 'Total Amount', 'Status'];
    const rows = selectedInvoices.map((inv) => [
      inv.invoiceNumber,
      `"${inv.vendor?.name || ''}"`,
      formatDate(inv.issueDate),
      formatDate(inv.dueDate),
      inv.poNumber || '',
      inv.subtotal,
      inv.taxAmount,
      inv.totalAmount,
      inv.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `InvoiceFlow_Invoices_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${selectedInvoices.length} invoices to CSV`);
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      toast.success('Invoice deleted');
      fetchInvoices(pagination.page);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete invoice');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Invoices Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create, verify, approve, and track multi-tier vendor invoices with automated duplicate validation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isVendor && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRecurringModalOpen(true)}
                className="text-xs rounded-xl font-semibold gap-1.5 border-slate-200 dark:border-slate-800"
              >
                <Repeat className="h-3.5 w-3.5 text-slate-500" />
                <span>Recurring</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsImportModalOpen(true)}
                className="text-xs rounded-xl font-semibold gap-1.5 border-slate-200 dark:border-slate-800"
              >
                <Upload className="h-3.5 w-3.5 text-slate-500" />
                <span>Import CSV</span>
              </Button>
            </>
          )}

          <Button
            size="sm"
            onClick={handleExportCSV}
            variant="outline"
            className="text-xs rounded-xl font-semibold gap-1.5 border-slate-200 dark:border-slate-800"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsOcrModalOpen(true)}
            className="text-xs rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold gap-1.5 shadow-md shadow-indigo-500/20"
          >
            <Sparkles className="h-4 w-4" />
            <span>AI Smart Ingestion</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setInvoiceToEdit(null);
              setIsCreateModalOpen(true);
            }}
            className="text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5 shadow-md shadow-indigo-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>New Invoice</span>
          </Button>
        </div>
      </div>

      {/* Status Filter Chips (Pill Bar) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {statuses.map((st) => (
          <button
            key={st.value}
            onClick={() => setSelectedStatus(st.value)}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold whitespace-nowrap transition-all ${
              selectedStatus === st.value
                ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-950'
                : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Search & Filters Controls Bar */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice #, PO, description..."
            className="pl-9 text-xs h-9 rounded-xl border-slate-200 dark:border-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {!isVendor && (
            <select
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 text-xs px-3 font-medium text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Suppliers ({vendors.length})</option>
              {vendors.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order as any);
            }}
            className="h-9 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 text-xs px-3 font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="totalAmount-desc">Highest Amount</option>
            <option value="totalAmount-asc">Lowest Amount</option>
            <option value="dueDate-asc">Due Date (Earliest)</option>
          </select>
        </div>
      </div>

      {/* Floating Multi-Select Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-16 z-30 flex items-center justify-between p-3 rounded-2xl bg-indigo-600 text-white shadow-xl animate-in slide-in-from-top-2">
          <span className="text-xs font-bold pl-2">
            {selectedIds.length} invoices selected
          </span>
          <div className="flex items-center gap-2">
            {(isAdmin || isFinance || isApprover) && (
              <>
                <Button
                  size="sm"
                  onClick={handleBulkApprove}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                >
                  Bulk Approve
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkReject}
                  variant="destructive"
                  className="h-8 text-xs font-bold rounded-xl"
                >
                  Bulk Reject
                </Button>
              </>
            )}
            <Button
              size="sm"
              onClick={handleExportCSV}
              variant="secondary"
              className="h-8 text-xs font-bold rounded-xl"
            >
              Export Selected
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds([])}
              className="h-8 text-xs text-white hover:bg-indigo-700"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Desktop Data Table (>= md breakpoint) */}
      <div className="hidden md:block rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 uppercase font-semibold">
            <tr>
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.length === invoices.length && invoices.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th className="p-3 text-left">Invoice #</th>
              <th className="p-3 text-left">Supplier / Vendor</th>
              <th className="p-3 text-left">Issue Date</th>
              <th className="p-3 text-left">Due Date</th>
              <th className="p-3 text-right">Total Amount</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-400">
                  Loading invoices...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-500">
                  ✨ No invoices found matching your filters.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr
                  key={inv._id}
                  onClick={() => setSelectedDetailId(inv._id)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(inv._id)}
                      onChange={() => handleSelectOne(inv._id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {inv.invoiceNumber}
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {inv.vendor?.name || 'Vendor'}
                    </div>
                    {inv.poNumber && (
                      <span className="text-[10px] font-mono text-slate-400">
                        PO: {inv.poNumber}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400 tabular-nums">
                    {formatDate(inv.issueDate)}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400 tabular-nums">
                    {formatDate(inv.dueDate)}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900 dark:text-white tabular-nums font-mono">
                    {formatINR(inv.totalAmount)}
                  </td>
                  <td className="p-3 text-center">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-xl">
                        <DropdownMenuItem onClick={() => setSelectedDetailId(inv._id)}>
                          <Eye className="mr-2 h-3.5 w-3.5 text-slate-500" />
                          <span>View Details</span>
                        </DropdownMenuItem>

                        {['SUBMITTED', 'UNDER_VERIFICATION', 'PENDING_APPROVAL'].includes(inv.status) &&
                          (isAdmin || isFinance || isApprover) && (
                            <>
                              <DropdownMenuItem
                                onClick={() => setApprovalAction({ invoice: inv, mode: 'APPROVE' })}
                              >
                                <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                                <span>Approve</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setApprovalAction({ invoice: inv, mode: 'REJECT' })}
                              >
                                <XCircle className="mr-2 h-3.5 w-3.5 text-rose-600" />
                                <span>Reject</span>
                              </DropdownMenuItem>
                            </>
                          )}

                        {inv.status === 'APPROVED' && (isAdmin || isFinance) && (
                          <DropdownMenuItem onClick={() => setPaymentTargetInvoice(inv)}>
                            <CreditCard className="mr-2 h-3.5 w-3.5 text-indigo-600" />
                            <span>Remit Payment</span>
                          </DropdownMenuItem>
                        )}

                        {['DRAFT', 'SUBMITTED', 'REJECTED'].includes(inv.status) && (
                          <DropdownMenuItem
                            onClick={() => {
                              setInvoiceToEdit(inv);
                              setIsCreateModalOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-3.5 w-3.5 text-slate-500" />
                            <span>Edit Invoice</span>
                          </DropdownMenuItem>
                        )}

                        {inv.status !== 'PAID' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteInvoice(inv._id)}
                              className="text-rose-600 dark:text-rose-400 focus:bg-rose-50"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View (< md breakpoint) */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">✨ No invoices found.</div>
        ) : (
          invoices.map((inv) => (
            <div
              key={inv._id}
              onClick={() => setSelectedDetailId(inv._id)}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 text-xs cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {inv.invoiceNumber}
                </span>
                <StatusBadge status={inv.status} />
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="font-semibold">{inv.vendor?.name}</span>
                <span className="font-extrabold text-slate-900 dark:text-white tabular-nums font-mono text-sm">
                  {formatINR(inv.totalAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Due: {formatDate(inv.dueDate)}</span>
                {inv.poNumber && <span>PO: {inv.poNumber}</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
          <span>
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} invoices)
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={pagination.page <= 1}
              onClick={() => fetchInvoices(pagination.page - 1)}
              className="h-8 rounded-xl text-xs"
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchInvoices(pagination.page + 1)}
              className="h-8 rounded-xl text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <InvoiceFormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        invoiceToEdit={invoiceToEdit}
        onSuccess={() => fetchInvoices(pagination.page)}
      />

      <BulkImportModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onSuccess={() => fetchInvoices(1)}
      />

      <RecurringTemplateModal
        open={isRecurringModalOpen}
        onOpenChange={setIsRecurringModalOpen}
        onSuccess={() => fetchInvoices(1)}
      />

      <InvoiceDetailModal
        invoiceId={selectedDetailId}
        open={!!selectedDetailId}
        onOpenChange={(op) => !op && setSelectedDetailId(null)}
        onApprove={(inv) => setApprovalAction({ invoice: inv, mode: 'APPROVE' })}
        onReject={(inv) => setApprovalAction({ invoice: inv, mode: 'REJECT' })}
        onRecordPayment={(inv) => setPaymentTargetInvoice(inv)}
        onRefresh={() => fetchInvoices(pagination.page)}
      />

      <ApprovalActionDialog
        invoice={approvalAction.invoice}
        mode={approvalAction.mode}
        open={!!approvalAction.mode}
        onOpenChange={(op) => !op && setApprovalAction({ invoice: null, mode: null })}
        onSuccess={() => fetchInvoices(pagination.page)}
      />

      <SmartInvoiceExtractionModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        onExtractedData={(extracted) => {
          setInvoiceToEdit(extracted as any);
          setIsCreateModalOpen(true);
        }}
      />

      <ThreeWayMatchModal
        isOpen={!!matchModalInvoice}
        onClose={() => setMatchModalInvoice(null)}
        invoice={matchModalInvoice}
        onMatchSuccess={() => fetchInvoices(pagination.page)}
      />

      <RecordPaymentModal
        open={!!paymentTargetInvoice}
        onOpenChange={(op) => !op && setPaymentTargetInvoice(null)}
        targetInvoice={paymentTargetInvoice}
        onSuccess={() => {
          setPaymentTargetInvoice(null);
          fetchInvoices(pagination.page);
        }}
      />
    </div>
  );
};

