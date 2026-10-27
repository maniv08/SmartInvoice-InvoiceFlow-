import React, { useState, useEffect, useRef } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ShieldCheck,
  User,
  Camera,
  Upload,
  Sparkles,
  Check,
  Loader2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Curated enterprise avatars
const PRESET_AVATARS = [
  {
    label: 'Modern Blue Suit',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  },
  {
    label: 'Corporate Executive',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  },
  {
    label: 'Finance Leader',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  },
  {
    label: 'Operations Specialist',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
  },
  {
    label: 'Tech Director',
    url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
  },
  {
    label: 'Senior Auditor',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
  },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ open, onOpenChange }) => {
  const { user, refetchUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2FA Setup State
  const [twoFactorData, setTwoFactorData] = useState<{ qrCode: string; secret: string } | null>(null);
  const [verifyToken, setVerifyToken] = useState<string>('');
  const [loading2FA, setLoading2FA] = useState<boolean>(false);

  // Profile Form State
  const [name, setName] = useState<string>(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatar || '');
  const [previewAvatar, setPreviewAvatar] = useState<string>(user?.avatar || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatarUrl(user.avatar || '');
      setPreviewAvatar(user.avatar || '');
    }
  }, [user, open]);

  // Handle local image upload via File reader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewAvatar(reader.result);
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url: string) => {
    setPreviewAvatar(url);
    setAvatarUrl(url);
  };

  const handleRemovePhoto = () => {
    setPreviewAvatar('');
    setAvatarUrl('');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.put('/auth/profile', {
        name,
        avatar: avatarUrl,
      });

      if (res.data.success) {
        toast.success('Profile and photo updated successfully!');
        if (refetchUser) {
          await refetchUser();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

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
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <User className="h-4 w-4" />
            </div>
            Profile & Account Settings
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Customize your avatar photo, display name, and enterprise 2FA security.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-2 space-y-4">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-slate-100 dark:bg-slate-900 p-1">
            <TabsTrigger value="profile" className="text-xs font-semibold rounded-xl">
              Profile & Photo
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs font-semibold rounded-xl">
              Security & 2FA
            </TabsTrigger>
          </TabsList>

          {/* Profile & Photo Tab */}
          <TabsContent value="profile" className="space-y-5 pt-1 text-xs">
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Photo Upload & Preview Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <Avatar className="h-20 w-20 ring-4 ring-indigo-500/20 shadow-md">
                      <AvatarImage src={previewAvatar} alt={name} />
                      <AvatarFallback className="bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xl">
                        {name ? name.slice(0, 2).toUpperCase() : 'DW'}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-slate-950/50 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer"
                      title="Upload new photo"
                    >
                      <Camera className="h-5 w-5" />
                      <span className="text-[10px] font-semibold mt-0.5">Upload</span>
                    </button>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        Profile Photo
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Upload your photo, paste an image link, or select a preset avatar.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 text-xs rounded-xl font-medium border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Upload className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                        Upload Device Photo
                      </Button>

                      {previewAvatar && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={handleRemovePhoto}
                          className="h-8 text-xs rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preset Avatars */}
                <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      Or Choose a Professional Avatar:
                    </Label>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_AVATARS.map((preset, idx) => {
                      const isSelected = previewAvatar === preset.url;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectPreset(preset.url)}
                          className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all p-0.5 cursor-pointer hover:scale-105 ${
                            isSelected
                              ? 'border-indigo-600 ring-2 ring-indigo-500/30'
                              : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                          title={preset.label}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-indigo-600/40 flex items-center justify-center rounded-lg">
                              <Check className="h-4 w-4 text-white stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Image URL Input */}
                <div className="space-y-1 pt-1">
                  <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Direct Image URL (Optional)
                  </Label>
                  <Input
                    value={avatarUrl.startsWith('data:') ? '(Uploaded local image)' : avatarUrl}
                    onChange={(e) => {
                      setAvatarUrl(e.target.value);
                      setPreviewAvatar(e.target.value);
                    }}
                    placeholder="https://example.com/avatar.jpg"
                    className="text-xs h-9 rounded-xl bg-white dark:bg-slate-950 font-mono"
                  />
                </div>
              </div>

              {/* User details */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Display Name
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Your Name"
                    className="text-xs h-9 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </Label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="text-xs h-9 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Role & Permissions
                  </Label>
                  <Input
                    value={user?.role?.replace('_', ' ') || ''}
                    disabled
                    className="text-xs h-9 rounded-xl font-mono font-bold bg-slate-100 dark:bg-slate-900 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 px-5 shadow-md shadow-indigo-500/20"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    'Save Profile'
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
