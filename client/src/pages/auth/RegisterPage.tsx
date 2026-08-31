import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [orgName, setOrgName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        password,
        organizationName: orgName,
      });

      if (res.data.success) {
        toast.success('Organization and Admin account registered successfully!');
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
      <div className="flex-1 flex flex-col justify-center p-6 sm:p-12 max-w-lg mx-auto w-full">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 shadow-md">
              <span className="text-white font-extrabold text-lg">IF</span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Create Organization Workspace
              </h2>
              <p className="text-xs text-slate-500">
                Setup your Smart Invoice & Vendor Payment enterprise instance
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Company / Organization Name *</Label>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Apex Global Solutions Pvt Ltd"
                  required
                  className="pl-9 text-xs h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Administrator Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Arjun Mehta"
                  required
                  className="pl-9 text-xs h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Administrator Corporate Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@apexsolutions.com"
                  required
                  className="pl-9 text-xs h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters with letter & number"
                  required
                  minLength={8}
                  className="pl-9 text-xs h-10 rounded-xl"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-2 shadow-md shadow-indigo-500/20"
            >
              {loading ? 'Creating Instance...' : 'Complete Workspace Setup'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500">
            Already have an active account?{' '}
            <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
