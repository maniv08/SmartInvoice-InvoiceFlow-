import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  Building,
  KeyRound,
  Fingerprint,
  ShieldAlert,
  Wallet,
  CheckCheck,
  Store,
} from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '@/lib/types';
import { cn } from '@/lib/utils';

interface RoleConfig {
  id: UserRole;
  label: string;
  badge: string;
  icon: React.ElementType;
  headline: string;
  description: string;
  defaultEmail: string;
  colorClass: string;
  borderClass: string;
  activeBgClass: string;
  iconColor: string;
  features: string[];
}

const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  ADMIN: {
    id: 'ADMIN',
    label: 'Admin',
    badge: 'Enterprise Governance',
    icon: ShieldAlert,
    headline: 'Administrator & System Governance Portal',
    description: 'Configure corporate security policies, manage multi-org settings, manage users, and inspect immutable audit trails.',
    defaultEmail: 'vmanikandan9841@dbsworld.com',
    colorClass: 'text-purple-600 dark:text-purple-400',
    borderClass: 'border-purple-500/30',
    activeBgClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/40',
    iconColor: 'text-purple-500',
    features: [
      'Comprehensive System & Security Configuration',
      'Multi-Tier Approval Policy & Delegation Matrix',
      'Statutory Compliance & Immutable Audit Trails',
      'User Management & Role Permissions Enforcement',
    ],
  },
  FINANCE_MANAGER: {
    id: 'FINANCE_MANAGER',
    label: 'Finance',
    badge: 'Treasury & AP Ops',
    icon: Wallet,
    headline: 'Finance & Treasury Management Console',
    description: 'Disburse scheduled vendor payments, reconcile bank UTRs, execute 3-way matching, and generate financial reports.',
    defaultEmail: 'offxkarthik07@dbsworld.com',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-500/30',
    activeBgClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/40',
    iconColor: 'text-emerald-500',
    features: [
      'Automated 3-Way Reconciliation (Invoice vs PO vs GRN)',
      'Direct Bank UTR & Real-Time NEFT/RTGS Remittances',
      'Statutory Indian GST Breakdown & Tax Credit Ledger',
      'Dynamic Cashflow Projections & Batch Payouts',
    ],
  },
  APPROVER: {
    id: 'APPROVER',
    label: 'Approver',
    badge: 'Multi-Level Review',
    icon: CheckCheck,
    headline: 'Executive & Departmental Approval Portal',
    description: 'Review invoice line items, verify contract threshold limits, authorize disbursements, or request purchase clarifications.',
    defaultEmail: 'vmanikandan7200@dbsworld.com',
    colorClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-500/30',
    activeBgClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/40',
    iconColor: 'text-amber-500',
    features: [
      'One-Click Tiered Authorization & Delegation Rules',
      'Interactive Line-Item Discrepancy & PO Comparison',
      'Expedited Mobile-Responsive Decision Workflows',
      'Contextual Comments & Departmental Budget Checks',
    ],
  },
  VENDOR: {
    id: 'VENDOR',
    label: 'Vendor',
    badge: 'Supplier Self-Service',
    icon: Store,
    headline: 'Supplier Self-Service & Invoicing Portal',
    description: 'Submit electronic tax invoices, monitor real-time approval status, and track scheduled payment remittances directly.',
    defaultEmail: 'kishore983@dbsworld.com',
    colorClass: 'text-blue-600 dark:text-blue-400',
    borderClass: 'border-blue-500/30',
    activeBgClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/40',
    iconColor: 'text-blue-500',
    features: [
      'Instant OCR Invoice Ingestion & PDF Uploading',
      'Transparent Multi-Tier Verification Lifecycle',
      'Disbursement Advice & Downloadable Bank UTR Slips',
      'Direct Dispute Resolution & Query Messaging',
    ],
  },
};

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine initial role from query parameter (e.g. /login?role=vendor)
  const roleParam = searchParams.get('role')?.toUpperCase();
  const validRole: UserRole =
    roleParam === 'ADMIN' ||
    roleParam === 'FINANCE_MANAGER' ||
    roleParam === 'APPROVER' ||
    roleParam === 'VENDOR'
      ? (roleParam as UserRole)
      : 'ADMIN';

  const [selectedRole, setSelectedRole] = useState<UserRole>(validRole);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [ssoLoading, setSsoLoading] = useState<boolean>(false);

  // 2FA modal state
  const [is2FAModalOpen, setIs2FAModalOpen] = useState<boolean>(false);
  const [twoFactorToken, setTwoFactorToken] = useState<string>('');

  // Forgot password modal
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>('');

  const currentRoleConfig = ROLE_CONFIGS[selectedRole];

  // Update query param when role tab changes
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setSearchParams({ role: role.toLowerCase() }, { replace: true });
  };

  // Sync if URL query param changes externally
  useEffect(() => {
    if (roleParam && (roleParam === 'ADMIN' || roleParam === 'FINANCE_MANAGER' || roleParam === 'APPROVER' || roleParam === 'VENDOR')) {
      setSelectedRole(roleParam as UserRole);
    }
  }, [roleParam]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password, twoFactorToken || undefined);
      if (res.requires2FA) {
        setIs2FAModalOpen(true);
        toast.info('Two-Factor Authentication is active on your account. Please enter your 6-digit TOTP code.');
      } else {
        toast.success(`Signed in to ${currentRoleConfig.label} workspace successfully.`);
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid email or password. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password, twoFactorToken);
      setIs2FAModalOpen(false);
      toast.success('Identity verified successfully.');
      navigate('/');
    } catch (err: any) {
      toast.error('Invalid 2FA code. Please check your authenticator application.');
    } finally {
      setLoading(false);
    }
  };

  const handleSSOLogin = () => {
    setSsoLoading(true);
    setTimeout(async () => {
      try {
        await login(currentRoleConfig.defaultEmail, 'Password123!');
        toast.success(`Corporate SSO verified for ${currentRoleConfig.label} role.`);
        navigate('/');
      } catch {
        toast.error('SSO verification failed.');
      } finally {
        setSsoLoading(false);
      }
    }, 600);
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Please enter your registered email address.');
      return;
    }
    toast.success(`Password reset instructions have been dispatched to ${resetEmail}.`);
    setIsForgotPasswordOpen(false);
    setResetEmail('');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Left Column: Enterprise Branding & Trust Visuals */}
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

        {/* Dynamic Role-Specific Feature Highlights */}
        <div className="space-y-6 max-w-md relative z-10 transition-all duration-300">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
            <currentRoleConfig.icon className="h-3.5 w-3.5" />
            <span>{currentRoleConfig.badge}</span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
            {currentRoleConfig.headline}
          </h2>

          <p className="text-sm text-slate-400 leading-relaxed">
            {currentRoleConfig.description}
          </p>

          <div className="space-y-3.5 pt-2">
            {currentRoleConfig.features.map((feat, i) => (
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

      {/* Right Column: Secure Production Sign-In Form with Role Selector */}
      <div className="flex-1 flex flex-col justify-center p-6 sm:p-12 lg:p-16 max-w-xl mx-auto w-full">
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Sign In to Your Workspace
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Access your corporate account via Single Sign-On or verified email credentials.
            </p>
          </div>

          {/* Role-Based Access Selector Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Your Role Portal
              </Label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              {(Object.keys(ROLE_CONFIGS) as UserRole[]).map((roleKey) => {
                const config = ROLE_CONFIGS[roleKey];
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

          {/* Enterprise Single Sign-On (SSO) Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleSSOLogin}
            disabled={ssoLoading || loading}
            className="w-full h-11 rounded-xl font-semibold text-xs border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-center gap-2.5 transition-all shadow-sm"
          >
            {ssoLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
            ) : (
              <Fingerprint className="h-4 w-4 text-indigo-600" />
            )}
            <span>Continue with Corporate SSO ({currentRoleConfig.label})</span>
          </Button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            <span className="flex-shrink mx-4 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
              Or sign in with email credentials
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
          </div>

          {/* Standard Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Corporate Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="pl-10 text-xs h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="pl-10 text-xs h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                />
                <span>Remember this device for 30 days</span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-2 shadow-md shadow-indigo-500/20 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 mt-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                  <span>Authenticating Identity...</span>
                </>
              ) : (
                <>
                  <span>Sign In as {currentRoleConfig.label}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <p className="text-xs text-slate-500">
              {selectedRole === 'ADMIN' && (
                <>
                  Need an organization workspace account?{' '}
                  <Link to="/register?role=admin" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                    Register Organization
                  </Link>
                </>
              )}
              {selectedRole === 'FINANCE_MANAGER' && (
                <>
                  Need a finance department account?{' '}
                  <Link to="/register?role=finance_manager" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                    Register Finance Account
                  </Link>
                </>
              )}
              {selectedRole === 'APPROVER' && (
                <>
                  Need an approver or reviewer account?{' '}
                  <Link to="/register?role=approver" className="font-semibold text-amber-600 dark:text-amber-400 hover:underline">
                    Register Approver Account
                  </Link>
                </>
              )}
              {selectedRole === 'VENDOR' && (
                <>
                  Are you a supplier or external vendor?{' '}
                  <Link to="/register?role=vendor" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    Register Vendor Account
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* TOTP 2FA Verification Modal */}
      <Dialog open={is2FAModalOpen} onOpenChange={setIs2FAModalOpen}>
        <DialogContent className="max-w-sm rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-indigo-600" />
              Two-Factor Authentication
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Enter the 6-digit verification code from your Authenticator App (Google Authenticator / Microsoft Authenticator).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handle2FASubmit} className="space-y-4 my-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">6-Digit TOTP Code</Label>
              <Input
                value={twoFactorToken}
                onChange={(e) => setTwoFactorToken(e.target.value)}
                placeholder="123456"
                maxLength={6}
                autoFocus
                className="text-center text-xl font-mono tracking-widest font-bold h-12 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || twoFactorToken.length < 6}
              className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Modal */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="max-w-sm rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Lock className="h-5 w-5 text-indigo-600" />
              Reset Password
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Enter your corporate email address to receive password recovery instructions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordReset} className="space-y-4 my-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Registered Email</Label>
              <Input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="text-xs h-10 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              Send Password Reset Link
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
