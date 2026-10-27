import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldAlert,
  Wallet,
  CheckCheck,
  Store,
  FileSpreadsheet,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { UserRole } from '@/lib/types';
import { cn } from '@/lib/utils';

interface RoleRegisterConfig {
  id: UserRole;
  label: string;
  badge: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  headline: string;
  description: string;
  features: string[];
  colorClass: string;
  borderClass: string;
  iconColor: string;
  submitButtonText: string;
}

const REGISTER_CONFIGS: Record<UserRole, RoleRegisterConfig> = {
  ADMIN: {
    id: 'ADMIN',
    label: 'Admin',
    badge: 'Enterprise Governance',
    icon: ShieldAlert,
    title: 'Create Organization Workspace',
    subtitle: 'Setup your enterprise procurement and invoice automation instance',
    headline: 'Next-Generation Accounts Payable & Supplier Remittance Infrastructure',
    description: 'Eliminate disbursement discrepancies with deterministic 3-way matching, automated Indian GST statutory validation, and real-time duplicate fraud protection.',
    features: [
      '98–99% Precision Multi-Pass OCR & Line-Item Extraction',
      'Deterministic 3-Way Reconciliation (Invoice vs PO vs GRN)',
      'Indian GST Breakdown, Multi-Payment Ledgers & Bank UTRs',
      'Dynamic Multi-Tier Approval Matrix & Statutory Audit Trails',
    ],
    colorClass: 'text-purple-600 dark:text-purple-400',
    borderClass: 'border-purple-500/30',
    iconColor: 'text-purple-500',
    submitButtonText: 'Create Organization & Admin Account',
  },
  FINANCE_MANAGER: {
    id: 'FINANCE_MANAGER',
    label: 'Finance',
    badge: 'Treasury & AP Ops',
    icon: Wallet,
    title: 'Register Finance Department Account',
    subtitle: 'Join the finance & accounts payable operations team',
    headline: 'Finance & Treasury Management Console',
    description: 'Disburse scheduled vendor payments, reconcile bank UTRs, execute 3-way matching, and generate statutory tax credit reports.',
    features: [
      'Automated 3-Way Reconciliation (Invoice vs PO vs GRN)',
      'Direct Bank UTR & Real-Time NEFT/RTGS Remittances',
      'Statutory Indian GST Breakdown & Tax Credit Ledger',
      'Dynamic Cashflow Projections & Batch Payouts',
    ],
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-500/30',
    iconColor: 'text-emerald-500',
    submitButtonText: 'Register Finance Manager Account',
  },
  APPROVER: {
    id: 'APPROVER',
    label: 'Approver',
    badge: 'Multi-Level Review',
    icon: CheckCheck,
    title: 'Register Approver Account',
    subtitle: 'Create your managerial review & departmental sign-off account',
    headline: 'Executive & Departmental Approval Portal',
    description: 'Review invoice line items, verify contract threshold limits, authorize disbursements, or request purchase clarifications.',
    features: [
      'One-Click Tiered Authorization & Delegation Rules',
      'Interactive Line-Item Discrepancy & PO Comparison',
      'Expedited Mobile-Responsive Decision Workflows',
      'Contextual Comments & Departmental Budget Checks',
    ],
    colorClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-500/30',
    iconColor: 'text-amber-500',
    submitButtonText: 'Register Approver Account',
  },
  VENDOR: {
    id: 'VENDOR',
    label: 'Vendor',
    badge: 'Supplier Self-Service',
    icon: Store,
    title: 'Register Supplier / Vendor Account',
    subtitle: 'Onboard your business to submit invoices and track remittances',
    headline: 'Supplier Self-Service & Invoicing Portal',
    description: 'Submit electronic tax invoices, monitor real-time approval status, and track scheduled payment remittances directly.',
    features: [
      'Instant OCR Invoice Ingestion & PDF Uploading',
      'Transparent Multi-Tier Verification Lifecycle',
      'Disbursement Advice & Downloadable Bank UTR Slips',
      'Direct Dispute Resolution & Query Messaging',
    ],
    colorClass: 'text-blue-600 dark:text-blue-400',
    borderClass: 'border-blue-500/30',
    iconColor: 'text-blue-500',
    submitButtonText: 'Register Vendor Account',
  },
};

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial role from query parameter
  const roleParam = searchParams.get('role')?.toUpperCase();
  const validRole: UserRole =
    roleParam === 'ADMIN' ||
    roleParam === 'FINANCE_MANAGER' ||
    roleParam === 'APPROVER' ||
    roleParam === 'VENDOR'
      ? (roleParam as UserRole)
      : 'ADMIN';

  const [selectedRole, setSelectedRole] = useState<UserRole>(validRole);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Role-Specific Fields
  const [orgName, setOrgName] = useState<string>(''); // For ADMIN
  const [department, setDepartment] = useState<string>(''); // For FINANCE & APPROVER
  const [vendorName, setVendorName] = useState<string>(''); // For VENDOR
  const [gstin, setGstin] = useState<string>(''); // For VENDOR

  const currentConfig = REGISTER_CONFIGS[selectedRole];

  useEffect(() => {
    if (roleParam && (roleParam === 'ADMIN' || roleParam === 'FINANCE_MANAGER' || roleParam === 'APPROVER' || roleParam === 'VENDOR')) {
      setSelectedRole(roleParam as UserRole);
    }
  }, [roleParam]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setSearchParams({ role: role.toLowerCase() }, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        name,
        email,
        password,
        role: selectedRole,
      };

      if (selectedRole === 'ADMIN') {
        payload.organizationName = orgName || 'DBS World Pvt Ltd';
      } else if (selectedRole === 'VENDOR') {
        payload.vendorName = vendorName || name;
        payload.gstin = gstin;
      } else {
        payload.department = department;
      }

      const res = await api.post('/auth/register', payload);

      if (res.data.success) {
        toast.success(`Account registered successfully as ${currentConfig.label}!`);
        await login(email, password);
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Left Column: Enterprise Branding & Trust Visuals (Identical to LoginPage) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-12 text-white flex-col justify-between relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/30">
            <span className="text-white font-extrabold text-xl tracking-tighter">IF</span>
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight">InvoiceFlow</span>
            <span className="block text-xs font-semibold text-indigo-400">
              Enterprise Procurement & AP Automation
            </span>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-6 max-w-md relative z-10 transition-all duration-300">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
            <currentConfig.icon className="h-3.5 w-3.5" />
            <span>{currentConfig.badge}</span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
            {currentConfig.headline}
          </h2>

          <p className="text-sm text-slate-400 leading-relaxed">
            {currentConfig.description}
          </p>

          <div className="space-y-3.5 pt-2">
            {currentConfig.features.map((feat, i) => (
              <div key={i} className="flex items-center gap-3 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center gap-6 text-xs text-slate-400 pt-6 border-t border-slate-800/80 relative z-10">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>SOC-2 Type II Certified</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-indigo-400" />
            <span>256-Bit TLS Encryption</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building className="h-4 w-4 text-slate-400" />
            <span>GST & RBI Compliant</span>
          </div>
        </div>
      </div>

      {/* Right Column: Secure Registration Form with Matching Layout */}
      <div className="flex-1 flex flex-col justify-center p-6 sm:p-12 lg:p-16 max-w-xl mx-auto w-full">
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {currentConfig.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {currentConfig.subtitle}
            </p>
          </div>

          {/* Role Portal Selector Tabs */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select Registration Role
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              {(Object.keys(REGISTER_CONFIGS) as UserRole[]).map((roleKey) => {
                const config = REGISTER_CONFIGS[roleKey];
                const isSelected = selectedRole === roleKey;
                const IconComponent = config.icon;

                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => handleRoleSelect(roleKey)}
                    className={cn(
                      'flex flex-col items-center justify-center p-2.5 rounded-xl text-center transition-all duration-200',
                      isSelected
                        ? 'bg-white dark:bg-slate-800 shadow-sm border font-bold ' + config.colorClass + ' ' + config.borderClass
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
                    )}
                  >
                    <IconComponent
                      className={cn('h-4 w-4 mb-1 transition-transform', isSelected ? 'scale-110 ' + config.iconColor : '')}
                    />
                    <span className="text-xs">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* ADMIN Specific: Organization Name */}
            {selectedRole === 'ADMIN' && (
              <div className="space-y-1.5 animate-in fade-in-50 duration-200">
                <Label className="text-xs font-semibold">Company / Organization Name *</Label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Apex Global Solutions Pvt Ltd"
                    required
                    className="pl-10 text-xs h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>
            )}

            {/* VENDOR Specific: Supplier/Business Name & GSTIN */}
            {selectedRole === 'VENDOR' && (
              <>
                <div className="space-y-1.5 animate-in fade-in-50 duration-200">
                  <Label className="text-xs font-semibold">Supplier / Company Business Name *</Label>
                  <div className="relative">
                    <Store className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      placeholder="e.g. Bharat Logistics & Transport Ltd"
                      required
                      className="pl-10 text-xs h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 animate-in fade-in-50 duration-200">
                  <Label className="text-xs font-semibold">GSTIN / Tax ID *</Label>
                  <div className="relative">
                    <FileSpreadsheet className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      placeholder="29AABCT1234Z1ZA"
                      required
                      maxLength={15}
                      className="pl-10 text-xs h-11 rounded-xl font-mono uppercase bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>
              </>
            )}

            {/* FINANCE & APPROVER Specific: Department */}
            {(selectedRole === 'FINANCE_MANAGER' || selectedRole === 'APPROVER') && (
              <div className="space-y-1.5 animate-in fade-in-50 duration-200">
                <Label className="text-xs font-semibold">Department / Unit *</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder={
                      selectedRole === 'FINANCE_MANAGER'
                        ? 'e.g. Accounts Payable & Treasury'
                        : 'e.g. IT Procurement / Operations'
                    }
                    required
                    className="pl-10 text-xs h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>
            )}

            {/* Common Fields: Name, Corporate Email, Password */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {selectedRole === 'VENDOR' ? 'Authorized Contact Person Full Name *' : 'Full Name *'}
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  required
                  className="pl-10 text-xs h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {selectedRole === 'VENDOR' ? 'Official Business / Supplier Email *' : 'Work Email Address *'}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="pl-10 text-xs h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                  className="pl-10 text-xs h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-2 shadow-md shadow-indigo-500/20 mt-2"
            >
              {loading ? 'Creating Account...' : currentConfig.submitButtonText}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            Already have an active account?{' '}
            <Link
              to={`/login?role=${selectedRole.toLowerCase()}`}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Sign In as {currentConfig.label}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
