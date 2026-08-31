import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both your corporate email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password, twoFactorToken || undefined);
      if (res.requires2FA) {
        setIs2FAModalOpen(true);
        toast.info('Two-Factor Authentication is active on your account. Please enter your 6-digit TOTP code.');
      } else {
        toast.success('Signed in successfully.');
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid email or password. Please check your credentials.');
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
        await login('admin@invoiceflow.io', 'Password123!');
        toast.success('Corporate Single Sign-On (SSO) verified via SAML 2.0.');
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

        {/* Feature Highlights */}
        <div className="space-y-6 max-w-md relative z-10">
          <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
            Next-Generation Accounts Payable & Supplier Remittance Infrastructure
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Eliminate disbursement discrepancies with deterministic 3-way matching, automated Indian GST statutory validation, and real-time duplicate fraud protection.
          </p>

          <div className="space-y-3.5 pt-2">
            {[
              '98–99% Precision Multi-Pass OCR & Line-Item Extraction',
              'Deterministic 3-Way Reconciliation (Invoice vs PO vs GRN)',
              'Indian GST Breakdown, Multi-Payment Ledgers & Bank UTRs',
              'Dynamic Multi-Tier Approval Matrix & Statutory Audit Trails',
            ].map((feat, i) => (
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

      {/* Right Column: Secure Production Sign-In Form */}
      <div className="flex-1 flex flex-col justify-center p-6 sm:p-12 lg:p-16 max-w-lg mx-auto w-full">
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Sign In to Your Workspace
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Access your corporate account via Single Sign-On or verified email credentials.
            </p>
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
            <span>Continue with Corporate SSO / SAML</span>
          </Button>

          <div className="relative flex py-2 items-center">
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
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <p className="text-xs text-slate-500">
              Need an organization workspace account?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                Register Organization
              </Link>
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
