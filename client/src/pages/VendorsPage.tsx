import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { VendorModal } from '@/components/vendors/VendorModal';
import { VendorProfile360 } from '@/components/vendors/VendorProfile360';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Building,
  Plus,
  Search,
  Mail,
  Phone,
  Landmark,
  FileText,
  CreditCard,
  Edit,
  Trash2,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { Vendor } from '@/lib/types';
import api from '@/lib/api';
import { toast } from 'sonner';

export const VendorsPage: React.FC = () => {
  const { user, isAdmin, isFinance } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [vendorToEdit, setVendorToEdit] = useState<Vendor | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vendors', {
        params: {
          search: search || undefined,
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        },
      });
      if (res.data.success) {
        setVendors(res.data.vendors);
      }
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVendors();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  const categories = [
    'ALL',
    'IT Services & Consulting',
    'Software & Cloud Services',
    'Hardware & Infrastructure',
    'Logistics & Freight',
    'Machinery & Electrical',
    'General Supplies',
  ];

  const handleDeleteVendor = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete vendor "${name}"?`)) return;
    try {
      await api.delete(`/vendors/${id}`);
      toast.success('Vendor deleted');
      fetchVendors();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete vendor');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Building className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Vendor Supplier Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage verified supplier directory, corporate banking profiles, and 360-degree disbursement ledgers.
          </p>
        </div>

        {(isAdmin || isFinance) && (
          <Button
            size="sm"
            onClick={() => {
              setVendorToEdit(null);
              setIsModalOpen(true);
            }}
            className="text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5 shadow-md shadow-indigo-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Onboard Supplier</span>
          </Button>
        )}
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-950'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat === 'ALL' ? `All Vendors (${vendors.length})` : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers, GSTIN, code..."
            className="pl-9 text-xs h-9 rounded-xl border-slate-200 dark:border-slate-800"
          />
        </div>
      </div>

      {/* Vendors Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-400">
            Loading supplier profiles...
          </div>
        ) : vendors.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-500">
            ✨ No vendors found matching your search.
          </div>
        ) : (
          vendors.map((v) => (
            <Card
              key={v._id}
              onClick={() => setSelectedProfileId(v._id)}
              className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                      {v.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                        {v.name}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                        {v.code}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={v.status} />
                </div>

                <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <p className="flex items-center gap-1.5 truncate">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">GSTIN:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">{v.gstin}</span>
                  </p>
                  <p className="flex items-center gap-1.5 truncate">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Contact:</span>
                    <span>{v.contactPerson} ({v.phone})</span>
                  </p>
                  <p className="flex items-center gap-1.5 truncate">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Bank:</span>
                    <span>{v.bankDetails?.bankName || 'HDFC Bank'}</span>
                  </p>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Billed Volume
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums font-mono">
                    {formatINR(v.stats?.totalAmount || 0)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {(isAdmin || isFinance) && (
                    <button
                      onClick={() => {
                        setVendorToEdit(v);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                      title="Edit Vendor"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedProfileId(v._id)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 transition-colors"
                    title="View 360 Profile"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      <VendorModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        vendorToEdit={vendorToEdit}
        onSuccess={fetchVendors}
      />

      <VendorProfile360
        vendorId={selectedProfileId}
        open={!!selectedProfileId}
        onOpenChange={(op) => !op && setSelectedProfileId(null)}
      />
    </div>
  );
};
