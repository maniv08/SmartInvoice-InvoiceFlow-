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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DuplicateAlertBanner } from './DuplicateAlertBanner';
import { VendorModal } from '@/components/vendors/VendorModal';
import { Plus, Trash2, Upload, FileText, X, Sparkles, AlertCircle, Building } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { Vendor, InvoiceItem, DuplicateCheckResult, Invoice } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

interface InvoiceFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceToEdit?: Invoice | null;
  onSuccess: () => void;
}

export const InvoiceFormModal: React.FC<InvoiceFormModalProps> = ({
  open,
  onOpenChange,
  invoiceToEdit,
  onSuccess,
}) => {
  const { user, isVendor } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Form State - start completely clean & clear
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [vendorId, setVendorId] = useState<string>('');
  const [poNumber, setPoNumber] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [paymentTerms, setPaymentTerms] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [status, setStatus] = useState<string>('SUBMITTED');

  // Dynamic Line Items - default blank
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      description: '',
      quantity: '' as any,
      unitPrice: '' as any,
      taxRate: '' as any,
      taxAmount: 0,
      amount: 0,
    },
  ]);

  // Real-time Duplicate Check State
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheckResult | null>(null);

  // File Attachments
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Quick Vendor Onboard Modal State
  const [isVendorModalOpen, setIsVendorModalOpen] = useState<boolean>(false);
  const [vendorSearch, setVendorSearch] = useState<string>('');

  const fetchVendorsList = async (autoSelectId?: string) => {
    try {
      const res = await api.get('/vendors');
      if (res.data.success) {
        setVendors(res.data.vendors);
        if (autoSelectId) {
          setVendorId(autoSelectId);
        } else if (isVendor && user?.vendor) {
          setVendorId(user.vendor._id || (user.vendor as any));
        }
      }
    } catch (err) {
      console.error('Failed to load vendors:', err);
    }
  };

  // Fetch vendors list on modal open
  useEffect(() => {
    if (open) {
      fetchVendorsList();

      if (invoiceToEdit) {
        setInvoiceNumber(invoiceToEdit.invoiceNumber);
        setVendorId(invoiceToEdit.vendor?._id || (invoiceToEdit.vendor as any));
        setPoNumber(invoiceToEdit.poNumber || '');
        setDescription(invoiceToEdit.description || '');
        setIssueDate(new Date(invoiceToEdit.issueDate).toISOString().split('T')[0]);
        setDueDate(new Date(invoiceToEdit.dueDate).toISOString().split('T')[0]);
        setPaymentTerms(invoiceToEdit.paymentTerms || 'Net 30');
        setDiscountAmount(invoiceToEdit.discountAmount || 0);
        setNotes(invoiceToEdit.notes || '');
        setStatus(invoiceToEdit.status);
        setItems(invoiceToEdit.items || []);
        setSelectedFile(null);
      } else {
        // Reset all fields clean & clear for new invoice
        setInvoiceNumber('');
        if (!isVendor) {
          setVendorId('');
        }
        setPoNumber('');
        setDescription('');
        setIssueDate('');
        setDueDate('');
        setPaymentTerms('');
        setDiscountAmount(0);
        setNotes('');
        setStatus('SUBMITTED');
        setSelectedFile(null);
        setDuplicateCheck(null);
        setItems([
          {
            description: '',
            quantity: '' as any,
            unitPrice: '' as any,
            taxRate: '' as any,
            taxAmount: 0,
            amount: 0,
          },
        ]);
      }
    }
  }, [open, invoiceToEdit]);

  // Math Calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.unitPrice) * Number(item.quantity) || 0), 0);
  const totalTax = items.reduce(
    (sum, item) => sum + ((Number(item.unitPrice) * Number(item.quantity) * Number(item.taxRate)) / 100 || 0),
    0
  );
  const totalAmount = Math.max(0, subtotal + totalTax - discountAmount);

  // Real-time Duplicate Check Trigger (Debounced)
  useEffect(() => {
    if (!invoiceNumber || !vendorId) {
      setDuplicateCheck(null);
      return;
    }

    const timer = setTimeout(() => {
      api
        .post('/invoices/check-duplicate', {
          vendorId,
          invoiceNumber,
          amount: totalAmount,
          issueDate,
          excludeId: invoiceToEdit?._id,
        })
        .then((res) => {
          if (res.data.success) {
            setDuplicateCheck(res.data.duplicateCheck);
          }
        })
        .catch(() => {});
    }, 400);

    return () => clearTimeout(timer);
  }, [invoiceNumber, vendorId, totalAmount, issueDate]);

  // Line Item Handlers
  const handleItemChange = (index: number, field: keyof InvoiceItem, val: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: val };

      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      const rate = Number(item.taxRate) || 0;

      const itemSub = qty * price;
      const itemTax = (itemSub * rate) / 100;
      const itemTot = itemSub + itemTax;

      item.taxAmount = itemTax;
      item.amount = itemTot;

      updated[index] = item;
      return updated;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        description: '',
        quantity: '' as any,
        unitPrice: '' as any,
        taxRate: '' as any,
        taxAmount: 0,
        amount: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast.error('Invoice must have at least one line item');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoiceNumber.trim()) {
      toast.error('Please provide an invoice number');
      return;
    }
    if (!vendorId) {
      toast.error('Please select a vendor');
      return;
    }
    if (items.some((i) => !i.description.trim())) {
      toast.error('Please fill in descriptions for all line items');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        invoiceNumber,
        vendorId,
        poNumber,
        description,
        issueDate,
        dueDate,
        paymentTerms,
        items,
        subtotal,
        taxRate: 18,
        taxAmount: totalTax,
        discountAmount,
        totalAmount,
        status,
        notes,
      };

      let createdInvoiceId = '';

      if (invoiceToEdit) {
        const res = await api.put(`/invoices/${invoiceToEdit._id}`, payload);
        createdInvoiceId = invoiceToEdit._id;
        toast.success('Invoice updated successfully!');
      } else {
        const res = await api.post('/invoices', payload);
        createdInvoiceId = res.data.invoice?._id;
        toast.success(
          duplicateCheck?.isDuplicate
            ? 'Invoice submitted with duplicate advisory notice.'
            : 'Invoice created and submitted for verification!'
        );
      }

      // Upload attachment if selected
      if (selectedFile && createdInvoiceId) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        await api.post(`/invoices/${createdInvoiceId}/attachments`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save invoice';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            {invoiceToEdit ? 'Edit Invoice' : 'Create & Submit Vendor Invoice'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Enter B2B invoice details, line items, and GST schedules. Automated multi-level approval rules will apply.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
          {/* Duplicate Detection Alert Banner (Real-time Non-blocking) */}
          <DuplicateAlertBanner checkResult={duplicateCheck} />

          {/* Primary Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Invoice Number *</Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value.toUpperCase())}
                placeholder="INV-2026-XXXX"
                required
                className="font-mono text-xs uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Vendor Supplier *</Label>
                {!isVendor && (
                  <button
                    type="button"
                    onClick={() => setIsVendorModalOpen(true)}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Onboard New</span>
                  </button>
                )}
              </div>
              {isVendor ? (
                <Input
                  disabled
                  value={(user?.vendor as any)?.name || 'Linked Vendor'}
                  className="bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                />
              ) : (
                <Select value={vendorId} onValueChange={setVendorId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsVendorModalOpen(true);
                      }}
                      className="p-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg cursor-pointer flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 mb-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Onboard / Register New Supplier</span>
                    </div>
                    {vendors.map((v) => (
                      <SelectItem key={v._id} value={v._id} className="text-xs">
                        {v.name} ({v.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">PO Number</Label>
              <Input
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value.toUpperCase())}
                placeholder="PO-2026-XXXX"
                className="font-mono text-xs uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Issue Date *</Label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Payment Due Date *</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Payment Terms</Label>
              <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select terms (e.g. Net 30)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Immediate">Immediate / Upon Receipt</SelectItem>
                  <SelectItem value="Net 15">Net 15 (15 Days)</SelectItem>
                  <SelectItem value="Net 30">Net 30 (30 Days)</SelectItem>
                  <SelectItem value="Net 45">Net 45 (45 Days)</SelectItem>
                  <SelectItem value="Net 60">Net 60 (60 Days)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Invoice Purpose / Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Q3 Software Licenses and Dedicated Cloud Hosting"
              className="text-xs"
            />
          </div>

          {/* Line Items Table */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Line Items & Tax Breakdown (INR ₹)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="h-7 text-xs gap-1 font-semibold text-indigo-600 dark:text-indigo-400"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </Button>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              <div className="grid grid-cols-12 gap-2 bg-slate-50/80 dark:bg-slate-900/60 p-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                <div className="col-span-5">Item Description</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-right">Price (₹)</div>
                <div className="col-span-1 text-center">GST %</div>
                <div className="col-span-2 text-right">Total (₹)</div>
              </div>

              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 p-2.5 items-center text-xs">
                  <div className="col-span-5">
                    <Input
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      placeholder="Item description"
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={(item.quantity as any) === '' || item.quantity === undefined || item.quantity === null ? '' : item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value === '' ? '' : Number(e.target.value))}
                      className="h-8 text-xs text-center"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Price"
                      value={(item.unitPrice as any) === '' || item.unitPrice === undefined || item.unitPrice === null ? '' : item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value === '' ? '' : Number(e.target.value))}
                      className="h-8 text-xs text-right tabular-nums font-mono"
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      placeholder="GST %"
                      value={(item.taxRate as any) === '' || item.taxRate === undefined || item.taxRate === null ? '' : item.taxRate}
                      onChange={(e) => handleItemChange(idx, 'taxRate', e.target.value === '' ? '' : Number(e.target.value))}
                      className="h-8 text-xs text-center font-mono px-1"
                      title="Enter GST % (e.g. 0, 5, 12, 18, 28)"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums text-xs">
                      {formatINR(item.amount || (item.quantity * item.unitPrice * (1 + item.taxRate / 100)))}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mathematical Summary Calculation Card */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col items-end space-y-2 text-xs">
            <div className="flex justify-between w-64 text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {formatINR(subtotal)}
              </span>
            </div>
            <div className="flex justify-between w-64 text-slate-600 dark:text-slate-400">
              <span>Estimated GST (CGST+SGST/IGST):</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                +{formatINR(totalTax)}
              </span>
            </div>
            <div className="flex justify-between w-64 items-center text-slate-600 dark:text-slate-400">
              <span>Discount (₹):</span>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={discountAmount === 0 ? '' : discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                className="h-7 w-28 text-right font-mono text-xs"
              />
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between w-64 text-sm font-extrabold text-slate-950 dark:text-white">
              <span>Grand Total:</span>
              <span className="tabular-nums text-indigo-600 dark:text-indigo-400 text-base">
                {formatINR(totalAmount)}
              </span>
            </div>
          </div>

          {/* Attachment Upload */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Supporting Invoice File (PDF, PNG, JPG)</Label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                id="invoice-file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('invoice-file')?.click()}
                className="text-xs h-9 gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" />
                {selectedFile ? 'Change File' : 'Attach PDF / Document'}
              </Button>
              {selectedFile && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <FileText className="h-4 w-4" />
                  <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-slate-400 hover:text-rose-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Internal Audit Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add optional notes for the reviewing manager..."
              className="text-xs min-h-[60px]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-2"
            >
              {loading ? 'Processing...' : invoiceToEdit ? 'Save Changes' : 'Submit for Verification & Approval'}
            </Button>
          </DialogFooter>
        </form>

        {/* Quick Onboard Vendor Modal */}
        <VendorModal
          open={isVendorModalOpen}
          onOpenChange={setIsVendorModalOpen}
          onSuccess={(newVendor?: Vendor) => {
            if (newVendor) {
              fetchVendorsList(newVendor._id);
              toast.success(`Supplier "${newVendor.name}" onboarded and selected!`);
            } else {
              fetchVendorsList();
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
