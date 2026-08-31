import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ShieldCheck, KeyRound, User, Lock, CheckCircle2, QrCode } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ open, onOpenChange }) => {
  const { user, refetchUser } = useAuth();

  // 2FA Setup State
  const [twoFactorData, setTwoFactorData] = useState<{ qrCode: string; secret: string } | null>(null);
  const [verifyToken, setVerifyToken] = useState<string>('');
  const [loading2FA, setLoading2FA] = useState<boolean>(false);

  // Profile Form
  const [name, setName] = useState<string>(user?.name || '');
  const [phone, setPhone] = useState<string>(user?.phone || '');

  // Password Form
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleStart2FASetup = async () => {
    setLoading2FA(true);
    try {
      const res = await api.post('/auth/2fa/setup');
      if (res.data.success) {
        setTwoFactorData(res.data);
      }
    } catch (err: any) {
      toast.error('Failed to initiate 2FA setup');
    } finally {
      setLoading2FA(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyToken || verifyToken.length < 6) return;

    try {
      const res = await api.post('/auth/2fa/verify', { token: verifyToken });
      if (res.data.success) {
        toast.success('Two-Factor Authentication successfully enabled!');
        setTwoFactorData(null);
        setVerifyToken('');
        if (refetchUser) refetchUser();
      }
    } catch (err: any) {
      toast.error('Invalid 2FA token');
    }
  };

  const handleDisable2FA = async () => {
    const token = prompt('Please enter your current 6-digit TOTP code to disable 2FA:');
    if (!token) return;

    try {
      const res = await api.post('/auth/2fa/disable', { token });
      if (res.data.success) {
        toast.success('2FA disabled');
        if (refetchUser) refetchUser();
      }
    } catch (err: any) {
      toast.error('Failed to disable 2FA');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-600" />
            User Profile & Security
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Manage your account credentials, contact information, and TOTP Two-Factor Authentication.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="security" className="mt-2 space-y-4">
          <TabsList className="grid w-full grid-cols-2 rounded-xl">
            <TabsTrigger value="security" className="text-xs font-semibold">
              Security & 2FA
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-xs font-semibold">
              Account Details
            </TabsTrigger>
          </TabsList>

          {/* Security & 2FA Tab */}
          <TabsContent value="security" className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                    Two-Factor Authentication (TOTP)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Protect your enterprise approvals with Google Authenticator, Authy, or 1Password.
                  </p>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    user?.twoFactorEnabled
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              {user?.twoFactorEnabled ? (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-600 dark:text-slate-400">
                    2FA is active on your account.
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDisable2FA}
                    className="h-8 text-xs rounded-xl text-rose-600 border-rose-200"
                  >
                    Disable 2FA
                  </Button>
                </div>
              ) : (
                <div>
                  {!twoFactorData ? (
                    <Button
                      size="sm"
                      onClick={handleStart2FASetup}
                      disabled={loading2FA}
                      className="mt-2 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                    >
                      {loading2FA ? 'Generating Secret...' : 'Setup Authenticator App'}
                    </Button>
                  ) : (
                    <form onSubmit={handleVerify2FA} className="mt-3 space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <img
                          src={twoFactorData.qrCode}
                          alt="2FA QR Code"
                          className="h-32 w-32 rounded-xl border border-slate-200 p-1 bg-white"
                        />
                        <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            1. Scan this QR code in your authenticator app
                          </p>
                          <p>Manual secret code:</p>
                          <code className="block p-1.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold select-all">
                            {twoFactorData.secret}
                          </code>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2">
                        <Label className="text-xs font-semibold">2. Enter 6-digit code from app</Label>
                        <div className="flex gap-2">
                          <Input
                            value={verifyToken}
                            onChange={(e) => setVerifyToken(e.target.value)}
                            placeholder="123456"
                            maxLength={6}
                            className="font-mono text-center font-bold text-sm h-9 rounded-xl max-w-[140px]"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                          >
                            Verify & Activate
                          </Button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Account Details Tab */}
          <TabsContent value="profile" className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Full Name</Label>
              <Input value={name} disabled className="text-xs bg-slate-50 dark:bg-slate-900" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Email Address</Label>
              <Input value={user?.email} disabled className="text-xs bg-slate-50 dark:bg-slate-900" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Assigned Role Authority</Label>
              <Input
                value={user?.role?.replace('_', ' ')}
                disabled
                className="text-xs font-bold font-mono bg-slate-50 dark:bg-slate-900"
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
