import React, { useEffect, useState } from 'react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Users,
  CreditCard,
  BarChart3,
  History,
  Settings,
  Plus,
  Sun,
  Moon,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface CommandPaletteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onNewInvoice?: () => void;
  onRecordPayment?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  setOpen,
  onNewInvoice,
  onRecordPayment,
}) => {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const { logout, switchDemoRole } = useAuth();
  const [quickInvoices, setQuickInvoices] = useState<any[]>([]);
  const [quickVendors, setQuickVendors] = useState<any[]>([]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, setOpen]);

  useEffect(() => {
    if (open) {
      // Fetch top 5 invoices and vendors for quick navigation
      api.get('/invoices?limit=5').then((res) => {
        if (res.data.success) setQuickInvoices(res.data.invoices);
      });
      api.get('/vendors').then((res) => {
        if (res.data.success) setQuickVendors(res.data.vendors.slice(0, 5));
      });
    }
  }, [open]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search invoices, vendors, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="⚡ Quick Actions">
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                if (onNewInvoice) onNewInvoice();
                else navigate('/invoices?action=new');
              })
            }
          >
            <Plus className="mr-2 h-4 w-4 text-indigo-500" />
            <span>Create New Invoice</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                if (onRecordPayment) onRecordPayment();
                else navigate('/payments?action=record');
              })
            }
          >
            <CreditCard className="mr-2 h-4 w-4 text-emerald-500" />
            <span>Record Payment Remittance</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => navigate('/'))}>
            <LayoutDashboard className="mr-2 h-4 w-4 text-slate-500" />
            <span>Dashboard Overview</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/invoices'))}>
            <FileText className="mr-2 h-4 w-4 text-blue-500" />
            <span>Invoices Management</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/approvals'))}>
            <CheckSquare className="mr-2 h-4 w-4 text-amber-500" />
            <span>Approval Queue & Delegations</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/vendors'))}>
            <Users className="mr-2 h-4 w-4 text-purple-500" />
            <span>Vendors Directory</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/payments'))}>
            <CreditCard className="mr-2 h-4 w-4 text-emerald-500" />
            <span>Payments Ledger</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/reports'))}>
            <BarChart3 className="mr-2 h-4 w-4 text-indigo-500" />
            <span>Reports & Analytics</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/audit-logs'))}>
            <History className="mr-2 h-4 w-4 text-slate-500" />
            <span>Audit Logs & Compliance</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/settings'))}>
            <Settings className="mr-2 h-4 w-4 text-slate-500" />
            <span>Admin Settings & Rules</span>
          </CommandItem>
        </CommandGroup>

        {/* Recent Invoices */}
        {quickInvoices.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Invoices">
              {quickInvoices.map((inv) => (
                <CommandItem
                  key={inv._id}
                  onSelect={() => runCommand(() => navigate(`/invoices/${inv._id}`))}
                >
                  <FileText className="mr-2 h-4 w-4 text-slate-400" />
                  <span>
                    {inv.invoiceNumber} — {inv.vendor?.name} (₹{inv.totalAmount.toLocaleString('en-IN')})
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Switch Role Quick Shortcuts for Demonstration */}
        <CommandSeparator />
        <CommandGroup heading="🎭 Switch Demo Role">
          <CommandItem onSelect={() => runCommand(() => switchDemoRole('ADMIN'))}>
            <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
            <span>Switch to Admin (Arjun Mehta)</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => switchDemoRole('FINANCE_MANAGER'))}>
            <Sparkles className="mr-2 h-4 w-4 text-emerald-500" />
            <span>Switch to Finance Manager (Priya Sharma)</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => switchDemoRole('APPROVER'))}>
            <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
            <span>Switch to Approver (Vikram Joshi)</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => switchDemoRole('VENDOR'))}>
            <Sparkles className="mr-2 h-4 w-4 text-blue-500" />
            <span>Switch to Vendor (Tata Services)</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Preferences">
          <CommandItem onSelect={() => runCommand(() => toggleTheme())}>
            <Sun className="mr-2 h-4 w-4 dark:hidden" />
            <Moon className="mr-2 h-4 w-4 hidden dark:inline" />
            <span>Toggle Dark / Light Theme</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => logout())}>
            <LogOut className="mr-2 h-4 w-4 text-rose-500" />
            <span>Sign Out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
