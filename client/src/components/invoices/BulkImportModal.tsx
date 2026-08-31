import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';

interface BulkImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');

  const sampleCSV = `invoiceNumber,vendorName,poNumber,amount,taxRate,description,dueDate
INV-IMP-101,Tata Consultancy Services Ltd,PO-2026-901,45000,18,Q3 Software Maintenance,2026-09-30
INV-IMP-102,Infosys BPM Technologies,PO-2026-902,82000,18,Cloud Infrastructure Retainer,2026-10-15
INV-IMP-103,Zoho Corporation Private Ltd,PO-2026-903,15000,18,Workplace Licenses,2026-09-25`;

  const handleDownloadSample = () => {
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'InvoiceFlow_Bulk_Import_Sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        toast.error('CSV file has no data rows');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim());
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        rows.push(rowObj);
      }

      setParsedRows(rows);
      toast.success(`Parsed ${rows.length} rows from CSV`);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (parsedRows.length === 0) {
      toast.error('No invoice rows to import');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/invoices/bulk-import', { invoices: parsedRows });
      if (res.data.success) {
        toast.success(res.data.message);
        onOpenChange(false);
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
            Bulk CSV / Excel Invoice Import
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Upload a structured CSV file to batch-create invoices with automatic duplicate checking and threshold evaluation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Action Row */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-600 dark:text-slate-400">
              Need the template format?
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadSample}
              className="text-xs gap-1 h-8 rounded-lg"
            >
              <Download className="h-3.5 w-3.5" />
              Download Sample CSV
            </Button>
          </div>

          {/* Upload Drop Area */}
          <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-6 text-center hover:border-indigo-500 transition-colors">
            <input
              type="file"
              id="csv-file-input"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <FileSpreadsheet className="h-10 w-10 mx-auto text-slate-400 mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {fileName || 'Drop CSV file here or click to browse'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports CSV with standard comma delimiter
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('csv-file-input')?.click()}
              className="mt-3 text-xs rounded-xl"
            >
              Select CSV File
            </Button>
          </div>

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Preview ({parsedRows.length} Invoices Found):
              </span>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 uppercase">
                    <tr>
                      <th className="p-2 text-left">Invoice #</th>
                      <th className="p-2 text-left">Vendor Name</th>
                      <th className="p-2 text-right">Amount (₹)</th>
                      <th className="p-2 text-left">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedRows.map((r, i) => (
                      <tr key={i}>
                        <td className="p-2 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {r.invoiceNumber}
                        </td>
                        <td className="p-2 text-slate-600 dark:text-slate-400">{r.vendorName}</td>
                        <td className="p-2 text-right font-mono font-semibold tabular-nums">
                          {formatINR(Number(r.amount))}
                        </td>
                        <td className="p-2 text-slate-500">{r.dueDate || 'Standard Net 30'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || parsedRows.length === 0}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
          >
            {loading ? 'Importing Invoices...' : `Import ${parsedRows.length} Invoices`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
