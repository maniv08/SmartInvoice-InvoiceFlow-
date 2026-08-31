import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from './Navbar';
import { CommandPalette } from './CommandPalette';
import { ProfileModal } from '@/components/profile/ProfileModal';
import { InvoiceFormModal } from '@/components/invoices/InvoiceFormModal';
import { RecordPaymentModal } from '@/components/payments/RecordPaymentModal';

export const AppLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [commandOpen, setCommandOpen] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState<boolean>(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 animate-pulse" />
          <span className="text-xs font-semibold text-slate-500">Loading InvoiceFlow...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Floating Pill Navigation */}
      <Navbar
        onOpenCommand={() => setCommandOpen(true)}
        onNewInvoice={() => setInvoiceModalOpen(true)}
        onRecordPayment={() => setPaymentModalOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 pt-6 pb-12">
        <Outlet />
      </main>

      {/* Global ⌘K Command Palette */}
      <CommandPalette
        open={commandOpen}
        setOpen={setCommandOpen}
        onNewInvoice={() => setInvoiceModalOpen(true)}
        onRecordPayment={() => setPaymentModalOpen(true)}
      />

      {/* Profile & 2FA Modal */}
      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />

      {/* Global Quick Invoice Form Modal */}
      <InvoiceFormModal
        open={invoiceModalOpen}
        onOpenChange={setInvoiceModalOpen}
        onSuccess={() => {
          // Trigger page reload or refresh
          window.location.reload();
        }}
      />

      {/* Global Quick Payment Modal */}
      <RecordPaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
};
