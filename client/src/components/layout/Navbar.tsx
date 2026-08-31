import React, { useState, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationDropdown } from './NotificationDropdown';
import {
  Search,
  Sun,
  Moon,
  Plus,
  CreditCard,
  Building,
  ShieldCheck,
  UserCheck,
  Briefcase,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Command as CommandIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/lib/types';

interface NavbarProps {
  onOpenCommand: () => void;
  onNewInvoice?: () => void;
  onRecordPayment?: () => void;
  onOpenProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCommand,
  onNewInvoice,
  onRecordPayment,
  onOpenProfile,
}) => {
  const navRef = useRef<HTMLDivElement>(null);
  const { user, logout, switchDemoRole, isVendor, isAdmin, isFinance } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { label: 'Overview', path: '/', roles: ['ADMIN', 'FINANCE_MANAGER', 'APPROVER', 'VENDOR'] },
    { label: 'Invoices', path: '/invoices', roles: ['ADMIN', 'FINANCE_MANAGER', 'APPROVER', 'VENDOR'] },
    { label: 'Approvals', path: '/approvals', roles: ['ADMIN', 'FINANCE_MANAGER', 'APPROVER'] },
    { label: 'Vendors', path: '/vendors', roles: ['ADMIN', 'FINANCE_MANAGER', 'APPROVER'] },
    { label: 'Payments', path: '/payments', roles: ['ADMIN', 'FINANCE_MANAGER', 'APPROVER', 'VENDOR'] },
    { label: 'Reports', path: '/reports', roles: ['ADMIN', 'FINANCE_MANAGER'] },
    { label: 'Audit Logs', path: '/audit-logs', roles: ['ADMIN', 'FINANCE_MANAGER'] },
    { label: 'Settings', path: '/settings', roles: ['ADMIN'] },
  ];

  const filteredLinks = navLinks.filter(
    (link) => !user?.role || link.roles.includes(user.role)
  );

  const getRoleBadgeColor = (role?: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'FINANCE_MANAGER':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'APPROVER':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'VENDOR':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-2.5 transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 sm:gap-6">
        {/* Brand & Organization */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-extrabold text-lg tracking-tighter">IF</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                InvoiceFlow
              </span>
              <span className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                Smart Enterprise SaaS
              </span>
            </div>
          </div>

          {/* Org Selector Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-inner">
            <Building className="h-3.5 w-3.5 text-indigo-500" />
            <span className="truncate max-w-[130px]">Acme Enterprises</span>
          </div>
        </div>

        {/* Center Pill Navigation */}
        <nav className="hidden md:flex items-center gap-0.5 rounded-full bg-slate-100/90 dark:bg-slate-900/90 p-1 border border-slate-200/80 dark:border-slate-800 shadow-inner overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filteredLinks.map((link) => {
            const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={cn(
                  'rounded-full px-3.5 py-1 text-xs font-semibold transition-all whitespace-nowrap shrink-0',
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-950'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Right Tools: ⌘K Search, Notification, Theme, User Avatar Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick ⌘K Search Button - Expanded with high affordance & accessible labels */}
          <button
            type="button"
            onClick={onOpenCommand}
            aria-label="Search invoices, vendors, and commands (Press ⌘K)"
            className="flex items-center justify-between w-40 sm:w-56 h-9 px-3 rounded-xl bg-slate-100/90 dark:bg-slate-900/90 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 text-xs font-medium transition-all shadow-inner focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden="true" />
              <span className="hidden sm:inline truncate">Search invoices...</span>
              <span className="sm:hidden">Search</span>
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 shadow-sm shrink-0">
              ⌘K
            </kbd>
          </button>

          {/* Notifications Dropdown */}
          <NotificationDropdown />

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-800 shadow-inner"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* User Profile & Demo Role Switcher Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-indigo-600 text-white font-bold text-xs">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'IF'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden xl:block text-left">
                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {user?.name || 'User'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                    {user?.role?.replace('_', ' ')}
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden xl:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl shadow-2xl p-1.5">
              <DropdownMenuLabel className="font-normal p-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none text-slate-900 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs leading-none text-slate-500 dark:text-slate-400 truncate">
                    {user?.email}
                  </p>
                  <div className="pt-1">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                        getRoleBadgeColor(user?.role)
                      )}
                    >
                      <ShieldCheck className="h-3 w-3" />
                      {user?.role?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => navigate('/settings')}
                className="cursor-pointer text-xs"
              >
                <Building className="mr-2 h-3.5 w-3.5 text-slate-500" />
                <span>Organization Profile</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => (onOpenProfile ? onOpenProfile() : navigate('/settings'))}
                className="cursor-pointer text-xs"
              >
                <UserCheck className="mr-2 h-3.5 w-3.5 text-slate-500" />
                <span>Security & 2FA Settings</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('/audit-logs')}
                className="cursor-pointer text-xs"
              >
                <ShieldCheck className="mr-2 h-3.5 w-3.5 text-slate-500" />
                <span>Compliance Audit Logs</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-xs text-rose-600 dark:text-rose-400 font-semibold focus:bg-rose-50 dark:focus:bg-rose-950/50"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex md:hidden items-center gap-1 overflow-x-auto py-1 mt-1 border-t border-slate-100 dark:border-slate-800">
        {filteredLinks.map((link) => {
          const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                  : 'text-slate-600 dark:text-slate-400'
              )}
            >
              {link.label}
            </NavLink>
          );
        })}
      </div>
    </header>
  );
};
