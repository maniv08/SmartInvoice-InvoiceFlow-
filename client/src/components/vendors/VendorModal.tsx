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
import { Building, Landmark, Phone, Mail, MapPin } from 'lucide-react';
import { Vendor } from '@/lib/types';
import api from '@/lib/api';
import { toast } from 'sonner';

interface VendorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorToEdit?: Vendor | null;
  onSuccess: (newVendor?: Vendor) => void;
}

export const VendorModal: React.FC<VendorModalProps> = ({
  open,
  onOpenChange,
  vendorToEdit,
  onSuccess,
}) => {
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [category, setCategory] = useState<string>('IT Services & Consulting');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [gstin, setGstin] = useState<string>('');
  const [panNumber, setPanNumber] = useState<string>('');
  const [city, setCity] = useState<string>('Bengaluru');
  const [state, setState] = useState<string>('Karnataka');
  const [street, setStreet] = useState<string>('');
  const [paymentTerms, setPaymentTerms] = useState<string>('Net 30');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'BLOCKED'>('ACTIVE');

  // Bank Details
  const [accountName, setAccountName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [ifscCode, setIfscCode] = useState<string>('HDFC0000004');
  const [bankName, setBankName] = useState<string>('HDFC Bank Ltd');
  const [branch, setBranch] = useState<string>('Main Branch');

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (vendorToEdit) {
      setName(vendorToEdit.name);
      setCode(vendorToEdit.code);
      setCategory(vendorToEdit.category || 'IT Services & Consulting');
      setContactPerson(vendorToEdit.contactPerson);
      setEmail(vendorToEdit.email);
      setPhone(vendorToEdit.phone);
      setGstin(vendorToEdit.gstin);
      setPanNumber(vendorToEdit.panNumber || '');
      setStreet(vendorToEdit.address?.street || '');
      setCity(vendorToEdit.address?.city || 'Bengaluru');
      setState(vendorToEdit.address?.state || 'Karnataka');
      setPaymentTerms(vendorToEdit.paymentTerms || 'Net 30');
      setStatus(vendorToEdit.status || 'ACTIVE');

      setAccountName(vendorToEdit.bankDetails?.accountName || vendorToEdit.name);
      setAccountNumber(vendorToEdit.bankDetails?.accountNumber || '');
      setIfscCode(vendorToEdit.bankDetails?.ifscCode || 'HDFC0000004');
      setBankName(vendorToEdit.bankDetails?.bankName || 'HDFC Bank Ltd');
      setBranch(vendorToEdit.bankDetails?.branch || '');
    } else {
      setName('');
      setCode(`VEND-${Math.floor(100 + Math.random() * 900)}`);
      setContactPerson('');
      setEmail('');
      setPhone('+91 ');
      setGstin('');
      setPanNumber('');
      setStreet('');
      setAccountName('');
      setAccountNumber('');
    }
  }, [vendorToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gstin.match(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)) {
      toast.error('Please enter a valid 15-character Indian GSTIN (e.g. 29ABCDE1234F1Z5)');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        code: code.toUpperCase(),
        category,
        contactPerson,
        email,
        phone,
        gstin: gstin.toUpperCase(),
        panNumber: panNumber ? panNumber.toUpperCase() : undefined,
        address: { street, city, state, country: 'India' },
        paymentTerms,
        status,
        bankDetails: {
          accountName: accountName || name,
          accountNumber,
          ifscCode: ifscCode.toUpperCase(),
          bankName,
          branch,
        },
      };

      if (vendorToEdit) {
        const res = await api.put(`/vendors/${vendorToEdit._id}`, payload);
        toast.success('Vendor profile updated successfully!');
        onOpenChange(false);
        onSuccess(res.data.vendor);
      } else {
        const res = await api.post('/vendors', payload);
        toast.success('New vendor onboarded successfully!');
        onOpenChange(false);
        onSuccess(res.data.vendor);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building className="h-5 w-5 text-indigo-600" />
            {vendorToEdit ? 'Edit Vendor Supplier' : 'Onboard New Vendor Supplier'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Register verified B2B supplier credentials, GSTIN compliance, and electronic settlement bank details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2 text-xs">
          {/* General Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Vendor Company Name *</Label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!accountName) setAccountName(e.target.value);
                }}
                placeholder="e.g. Larsen & Toubro Technologies"
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Vendor Code *</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="VEND-XXXX"
                required
                className="text-xs font-mono uppercase"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Industry Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IT Services & Consulting">IT Services & Consulting</SelectItem>
                  <SelectItem value="Software & Cloud Services">Software & Cloud Services</SelectItem>
                  <SelectItem value="Hardware & Infrastructure">Hardware & Infrastructure</SelectItem>
                  <SelectItem value="Logistics & Freight">Logistics & Freight</SelectItem>
                  <SelectItem value="Office & Facilities">Office & Facilities</SelectItem>
                  <SelectItem value="Legal & Audit Services">Legal & Audit Services</SelectItem>
                  <SelectItem value="General Supplies">General Supplies</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Contact Person *</Label>
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Billing Email *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="billing@vendor.com"
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Phone Number *</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
                className="text-xs"
              />
            </div>
          </div>

          {/* Tax Identification */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
              Tax & Statutory Compliance (India)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">GSTIN Number *</Label>
                <Input
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="29ABCDE1234F1Z5"
                  required
                  className="text-xs font-mono uppercase"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">PAN Card Number</Label>
                <Input
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  className="text-xs font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* Electronic Settlement Bank Details */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
              <Landmark className="h-4 w-4 text-indigo-600" />
              Direct Electronic Settlement Bank Details
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Beneficiary A/C Name *</Label>
                <Input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Beneficiary name"
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Account Number *</Label>
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="000405001234"
                  required
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">IFSC Code *</Label>
                <Input
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="HDFC0000004"
                  required
                  className="text-xs font-mono uppercase"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-semibold">Bank Name *</Label>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank Ltd / ICICI Bank"
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Branch Location</Label>
                <Input
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. Fort, Mumbai"
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              {loading ? 'Saving...' : vendorToEdit ? 'Save Changes' : 'Onboard Vendor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
