/**
 * Advanced Multi-Factor Fuzzy Duplicate & Fraud Detection Engine
 * Detects:
 * 1. Exact & Normalized Invoice Number Duplicates
 * 2. High-Similarity Levenshtein String Variations (e.g. INV/2026/01 vs INV-2026-01)
 * 3. Exact Vendor + Same Amount + Date Proximity Cluster Duplication
 * 4. Split-Billing Threshold Evasion Fraud Anomaly Detection
 */

import { Invoice } from '../models';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  message?: string;
  confidenceScore: number; // 0 to 100
  matchedInvoices: Array<{
    id: string;
    invoiceNumber: string;
    vendorName?: string;
    totalAmount: number;
    issueDate: Date;
    status: string;
    matchReasons: string[];
    similarityScore: number;
  }>;
  fraudAlerts?: string[];
}

/**
 * Normalizes an invoice number by removing punctuation, spaces, and leading zeros.
 */
export function normalizeInvoiceNumber(invNum: string): string {
  if (!invNum) return '';
  return invNum
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/^0+/, '');
}

/**
 * Computes the Levenshtein distance between two strings.
 */
export function getLevenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];
  for (let i = 0; i <= bn; ++i) matrix[i] = [i];
  for (let i = 0; i <= an; ++i) matrix[0][i] = i;

  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

/**
 * Calculates string similarity ratio between 0 and 1.
 */
export function calculateStringSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1.0;
  const distance = getLevenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Performs comprehensive multi-factor duplicate & fraud detection.
 */
export const checkDuplicateInvoice = async (params: {
  organizationId: string;
  vendorId: string;
  invoiceNumber: string;
  amount?: number;
  issueDate?: string | Date;
  excludeId?: string;
}): Promise<DuplicateCheckResult> => {
  const { organizationId, vendorId, invoiceNumber, amount, issueDate, excludeId } = params;

  if (!invoiceNumber) {
    return { isDuplicate: false, severity: 'NONE', confidenceScore: 100, matchedInvoices: [] };
  }

  const rawNormalized = invoiceNumber.trim().toUpperCase();
  const strippedNumber = normalizeInvoiceNumber(rawNormalized);

  const matchedInvoices: DuplicateCheckResult['matchedInvoices'] = [];
  const fraudAlerts: string[] = [];

  // 1. Fetch active invoices for the same organization
  const orgInvoices = await Invoice.find({
    organization: organizationId,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).populate('vendor', 'name code gstin');

  for (const inv of orgInvoices) {
    const existingRaw = (inv.invoiceNumber || '').trim().toUpperCase();
    const existingStripped = normalizeInvoiceNumber(existingRaw);
    const isSameVendor = inv.vendor?._id?.toString() === vendorId || (inv.vendor as any)?.toString() === vendorId;

    const similarity = calculateStringSimilarity(strippedNumber, existingStripped);
    const reasons: string[] = [];

    // Exact Match
    if (existingRaw === rawNormalized) {
      reasons.push(isSameVendor ? 'Exact Invoice # & Same Vendor' : 'Identical Invoice # (Different Vendor)');
    } else if (existingStripped === strippedNumber && strippedNumber.length >= 3) {
      reasons.push('Normalized Format Equivalent (Punctuation difference)');
    } else if (similarity >= 0.85 && isSameVendor && strippedNumber.length >= 4) {
      reasons.push(`High String Similarity (${Math.round(similarity * 100)}% match)`);
    }

    // Exact Amount + Vendor + Date Proximity match
    if (isSameVendor && amount && Math.abs(inv.totalAmount - amount) < 1) {
      if (issueDate && inv.issueDate) {
        const d1 = new Date(issueDate).getTime();
        const d2 = new Date(inv.issueDate).getTime();
        const daysDiff = Math.abs(d1 - d2) / (1000 * 3600 * 24);
        if (daysDiff <= 3) {
          reasons.push(`Exact Amount (₹${amount}) within ${Math.round(daysDiff)} days`);
        }
      }
    }

    if (reasons.length > 0) {
      matchedInvoices.push({
        id: inv._id.toString(),
        invoiceNumber: inv.invoiceNumber,
        vendorName: (inv.vendor as any)?.name,
        totalAmount: inv.totalAmount,
        issueDate: inv.issueDate,
        status: inv.status,
        matchReasons: reasons,
        similarityScore: Math.round(similarity * 100),
      });
    }
  }

  // 2. Split-Billing Threshold Evasion Fraud Detection
  // Check if same vendor has multiple invoices submitted in the last 7 days totaling near an approval tier threshold
  if (vendorId && amount) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const recentVendorInvoices = orgInvoices.filter(
      (inv) =>
        (inv.vendor?._id?.toString() === vendorId || (inv.vendor as any)?.toString() === vendorId) &&
        new Date(inv.createdAt) >= sevenDaysAgo
    );

    if (recentVendorInvoices.length >= 2) {
      const recentTotal = recentVendorInvoices.reduce((acc, i) => acc + i.totalAmount, 0) + amount;
      if (recentTotal >= 100000 && amount < 100000) {
        fraudAlerts.push(
          `Split-Billing Anomaly: Vendor has ${recentVendorInvoices.length + 1} invoices in 7 days totaling ₹${recentTotal.toLocaleString('en-IN')}, which exceeds the single-invoice threshold limit.`
        );
      }
    }
  }

  // Determine Severity and Message
  const hasExactSameVendorMatch = matchedInvoices.some((m) =>
    m.matchReasons.some((r) => r.includes('Exact Invoice # & Same Vendor') || r.includes('Normalized Format'))
  );

  const isDuplicate = matchedInvoices.length > 0;
  let severity: DuplicateCheckResult['severity'] = 'NONE';
  let message = 'No duplicate records found.';

  if (hasExactSameVendorMatch) {
    severity = 'HIGH';
    message = `Critical Duplicate Detected: Invoice '${rawNormalized}' has already been submitted for this vendor.`;
  } else if (isDuplicate) {
    severity = 'MEDIUM';
    message = `Potential Duplicate Warning: Found ${matchedInvoices.length} matching invoice records with similar reference numbers or amount patterns.`;
  } else if (fraudAlerts.length > 0) {
    severity = 'LOW';
    message = fraudAlerts[0];
  }

  return {
    isDuplicate,
    severity,
    message,
    confidenceScore: hasExactSameVendorMatch ? 99 : isDuplicate ? 92 : 100,
    matchedInvoices,
    fraudAlerts: fraudAlerts.length > 0 ? fraudAlerts : undefined,
  };
};
