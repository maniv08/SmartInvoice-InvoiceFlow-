import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Printer,
  Calendar,
  Filter,
  FileText,
  CreditCard,
  Building,
  Receipt,
  TrendingUp,
} from 'lucide-react';
import { formatINR, formatDate } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<string>('invoices');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/data', {
        params: {
          reportType,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        },
      });
      if (res.data.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [reportType, startDate, endDate, selectedStatus]);

  const handleExportCSV = () => {
    if (!reportData?.data) return;

    let headers: string[] = [];
    let rows: any[][] = [];

    if (reportType === 'invoices') {
      headers = ['Invoice #', 'Supplier', 'Issue Date', 'Due Date', 'Subtotal', 'Tax Amount', 'Total Amount', 'Status'];
      rows = reportData.data.map((i: any) => [
        i.invoiceNumber,
        `"${i.vendor?.name || ''}"`,
        formatDate(i.issueDate),
        formatDate(i.dueDate),
        i.subtotal,
        i.taxAmount,
        i.totalAmount,
        i.status,
      ]);
    } else if (reportType === 'payments') {
      headers = ['Payment #', 'Invoice #', 'Supplier', 'Channel', 'UTR Reference', 'Date', 'Amount', 'Status'];
      rows = reportData.data.map((p: any) => [
        p.paymentNumber,
        p.invoice?.invoiceNumber || '',
        `"${p.invoice?.vendor?.name || ''}"`,
        p.paymentMethod,
        p.referenceId,
        formatDate(p.paymentDate),
        p.amount,
        p.status,
      ]);
    } else if (reportType === 'vendors') {
      headers = ['Supplier Code', 'Supplier Name', 'GSTIN', 'Category', 'Total Invoices', 'Total Billed', 'Total Paid', 'Outstanding'];
      rows = reportData.data.map((v: any) => [
        v.vendorCode,
        `"${v.vendorName}"`,
        v.gstin,
        v.category,
        v.totalInvoices,
        v.totalBilled,
        v.totalPaid,
        v.outstanding,
      ]);
    } else if (reportType === 'tax') {
      headers = ['GST Tax Slab', 'Taxable Subtotal', 'GST Tax Amount', 'Gross Invoiced Total'];
      rows = reportData.data.map((t: any) => [
        t.taxSlab,
        t.taxableAmount,
        t.taxAmount,
        t.totalWithTax,
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `InvoiceFlow_${reportType.toUpperCase()}_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${reportType.toUpperCase()} report to CSV`);
  };

  const handleExportPDF = () => {
    if (!reportData?.data) return;

    const doc = new jsPDF();
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(`InvoiceFlow — ${reportType.toUpperCase()} Financial Report`, 14, 15);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 155, 15);

    if (reportType === 'invoices') {
      const rows = reportData.data.map((i: any, idx: number) => [
        idx + 1,
        i.invoiceNumber,
        i.vendor?.name || 'N/A',
        formatDate(i.issueDate),
        formatDate(i.dueDate),
        `INR ${i.totalAmount.toLocaleString('en-IN')}`,
        i.status,
      ]);
      autoTable(doc, {
        startY: 32,
        head: [['#', 'Invoice #', 'Supplier', 'Issue Date', 'Due Date', 'Total (INR)', 'Status']],
        body: rows,
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8 },
      });
    } else if (reportType === 'payments') {
      const rows = reportData.data.map((p: any, idx: number) => [
        idx + 1,
        p.paymentNumber,
        p.invoice?.invoiceNumber || 'N/A',
        p.invoice?.vendor?.name || 'N/A',
        p.paymentMethod,
        p.referenceId,
        `INR ${p.amount.toLocaleString('en-IN')}`,
        p.status,
      ]);
      autoTable(doc, {
        startY: 32,
        head: [['#', 'Payment #', 'Invoice #', 'Supplier', 'Method', 'UTR / Ref', 'Amount', 'Status']],
        body: rows,
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8 },
      });
    } else if (reportType === 'vendors') {
      const rows = reportData.data.map((v: any, idx: number) => [
        idx + 1,
        v.vendorName,
        v.gstin,
        v.totalInvoices,
        `INR ${v.totalBilled.toLocaleString('en-IN')}`,
        `INR ${v.totalPaid.toLocaleString('en-IN')}`,
        `INR ${v.outstanding.toLocaleString('en-IN')}`,
      ]);
      autoTable(doc, {
        startY: 32,
        head: [['#', 'Supplier Name', 'GSTIN', 'Invoices', 'Total Billed', 'Total Paid', 'Outstanding']],
        body: rows,
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8 },
      });
    } else if (reportType === 'tax') {
      const rows = reportData.data.map((t: any, idx: number) => [
        idx + 1,
        t.taxSlab,
        `INR ${t.taxableAmount.toLocaleString('en-IN')}`,
        `INR ${t.taxAmount.toLocaleString('en-IN')}`,
        `INR ${t.totalWithTax.toLocaleString('en-IN')}`,
      ]);
      autoTable(doc, {
        startY: 32,
        head: [['#', 'GST Slab', 'Taxable Amount', 'Tax Amount', 'Gross Total']],
        body: rows,
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8 },
      });
    }

    doc.save(`InvoiceFlow_${reportType}_Report.pdf`);
    toast.success('PDF report downloaded successfully');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Financial Reports & Statutory Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate executive GST tax filings, supplier spending concentrations, and remittance audit statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="text-xs rounded-xl font-semibold gap-1.5 border-slate-200 dark:border-slate-800"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={handleExportPDF}
            className="text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5 shadow-md shadow-indigo-500/20"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download PDF</span>
          </Button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <Tabs value={reportType} onValueChange={setReportType} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList className="grid w-full sm:w-auto grid-cols-4 rounded-xl">
            <TabsTrigger value="invoices" className="text-xs font-semibold">
              Invoices
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-xs font-semibold">
              Disbursements
            </TabsTrigger>
            <TabsTrigger value="vendors" className="text-xs font-semibold">
              Suppliers
            </TabsTrigger>
            <TabsTrigger value="tax" className="text-xs font-semibold">
              GST Tax
            </TabsTrigger>
          </TabsList>

          {/* Date Filter */}
          <div className="flex items-center gap-2 text-xs">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 w-36 text-xs rounded-xl"
            />
            <span className="text-slate-400">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 w-36 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Summary Card */}
        {reportData?.summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(reportData.summary).map(([key, val]: any) => (
              <Card key={key} className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {key.replace(/([A-Z])/g, ' $1')}
                </span>
                <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums font-mono mt-0.5">
                  {typeof val === 'number' && key.toLowerCase().includes('amount') || key.toLowerCase().includes('totalinvoiced') || key.toLowerCase().includes('totalpaid') || key.toLowerCase().includes('totalbilled') || key.toLowerCase().includes('totaltax') || key.toLowerCase().includes('totalgross') || key.toLowerCase().includes('totalsubtotal')
                    ? formatINR(val)
                    : val}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Report Content Table */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">
              Generating report computations...
            </div>
          ) : !reportData?.data || reportData.data.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">
              ✨ No records match your selected date criteria.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 uppercase font-semibold">
                {reportType === 'invoices' && (
                  <tr>
                    <th className="p-3 text-left">Invoice #</th>
                    <th className="p-3 text-left">Supplier</th>
                    <th className="p-3 text-left">Issue Date</th>
                    <th className="p-3 text-left">Due Date</th>
                    <th className="p-3 text-right">Subtotal</th>
                    <th className="p-3 text-right">Tax (₹)</th>
                    <th className="p-3 text-right">Total Amount</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                )}
                {reportType === 'payments' && (
                  <tr>
                    <th className="p-3 text-left">Payment #</th>
                    <th className="p-3 text-left">Invoice #</th>
                    <th className="p-3 text-left">Supplier</th>
                    <th className="p-3 text-left">Channel</th>
                    <th className="p-3 text-left">UTR / Ref</th>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                )}
                {reportType === 'vendors' && (
                  <tr>
                    <th className="p-3 text-left">Code</th>
                    <th className="p-3 text-left">Supplier Name</th>
                    <th className="p-3 text-left">GSTIN</th>
                    <th className="p-3 text-center">Invoices</th>
                    <th className="p-3 text-right">Total Billed</th>
                    <th className="p-3 text-right">Total Paid</th>
                    <th className="p-3 text-right">Outstanding</th>
                  </tr>
                )}
                {reportType === 'tax' && (
                  <tr>
                    <th className="p-3 text-left">GST Rate Slab</th>
                    <th className="p-3 text-right">Taxable Subtotal (₹)</th>
                    <th className="p-3 text-right">GST Collected (₹)</th>
                    <th className="p-3 text-right">Gross Total (₹)</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {reportType === 'invoices' &&
                  reportData.data.map((inv: any) => (
                    <tr key={inv._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">{inv.invoiceNumber}</td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{inv.vendor?.name}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 tabular-nums">{formatDate(inv.issueDate)}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 tabular-nums">{formatDate(inv.dueDate)}</td>
                      <td className="p-3 text-right tabular-nums font-mono">{formatINR(inv.subtotal)}</td>
                      <td className="p-3 text-right tabular-nums font-mono">{formatINR(inv.taxAmount)}</td>
                      <td className="p-3 text-right font-extrabold tabular-nums font-mono text-slate-900 dark:text-white">{formatINR(inv.totalAmount)}</td>
                      <td className="p-3 text-center"><StatusBadge status={inv.status} /></td>
                    </tr>
                  ))}
                {reportType === 'payments' &&
                  reportData.data.map((p: any) => (
                    <tr key={p._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">{p.paymentNumber}</td>
                      <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">{p.invoice?.invoiceNumber}</td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{p.invoice?.vendor?.name}</td>
                      <td className="p-3 font-bold text-slate-700 dark:text-slate-300">{p.paymentMethod}</td>
                      <td className="p-3 font-mono text-slate-500">{p.referenceId}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 tabular-nums">{formatDate(p.paymentDate)}</td>
                      <td className="p-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums font-mono">{formatINR(p.amount)}</td>
                      <td className="p-3 text-center"><StatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                {reportType === 'vendors' &&
                  reportData.data.map((v: any) => (
                    <tr key={v.vendorId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-slate-400">{v.vendorCode}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{v.vendorName}</td>
                      <td className="p-3 font-mono text-slate-500">{v.gstin}</td>
                      <td className="p-3 text-center tabular-nums font-semibold">{v.totalInvoices}</td>
                      <td className="p-3 text-right font-mono tabular-nums">{formatINR(v.totalBilled)}</td>
                      <td className="p-3 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">{formatINR(v.totalPaid)}</td>
                      <td className="p-3 text-right font-mono tabular-nums text-amber-600 dark:text-amber-400 font-bold">{formatINR(v.outstanding)}</td>
                    </tr>
                  ))}
                {reportType === 'tax' &&
                  reportData.data.map((t: any) => (
                    <tr key={t.taxSlab} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{t.taxSlab}</td>
                      <td className="p-3 text-right font-mono tabular-nums">{formatINR(t.taxableAmount)}</td>
                      <td className="p-3 text-right font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">{formatINR(t.taxAmount)}</td>
                      <td className="p-3 text-right font-mono tabular-nums font-extrabold text-slate-900 dark:text-white">{formatINR(t.totalWithTax)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </Tabs>
    </div>
  );
};
