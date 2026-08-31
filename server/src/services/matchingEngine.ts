/**
 * Deterministic 3-Way & 2-Way Invoice Matching Engine
 * Reconciles Invoice vs Purchase Order (PO) vs Goods Receipt Note (GRN) with line-item precision.
 */

export interface MatchLineItemResult {
  itemIndex: number;
  description: string;
  invoiceQuantity: number;
  poQuantity?: number;
  grnQuantity?: number;
  invoiceUnitPrice: number;
  poUnitPrice?: number;
  invoiceAmount: number;
  poAmount?: number;
  quantityVariance: number;
  priceVariance: number;
  amountVariance: number;
  status: 'MATCHED' | 'PRICE_VARIANCE' | 'QTY_VARIANCE' | 'UNEXPECTED_ITEM';
  notes?: string;
}

export interface ThreeWayMatchResult {
  matchStatus: 'PERFECT_MATCH' | 'TOLERANCE_ACCEPTED' | 'DISCREPANCY_FLAGGED' | 'NO_PO_FOUND';
  matchScore: number; // 0 to 100%
  hasPO: boolean;
  hasGRN: boolean;
  poNumber?: string;
  grnNumber?: string;
  totalInvoiceAmount: number;
  totalPOAmount?: number;
  totalGRNAmount?: number;
  totalVariance: number;
  variancePercentage: number;
  lineItemResults: MatchLineItemResult[];
  discrepancies: string[];
  recommendation: 'APPROVE_AUTOMATICALLY' | 'MANUAL_REVIEW_REQUIRED' | 'REJECT_OR_REQUEST_CREDIT_NOTE';
}

export interface MatchOptions {
  priceTolerancePercentage?: number; // e.g. 0.5 for 0.5%
  maxPriceToleranceAmount?: number; // e.g. ₹500 max tolerance
  allowQuantityTolerance?: boolean;
}

/**
 * Performs a deterministic 3-Way match comparing Invoice vs PO vs GRN.
 */
export function performThreeWayMatch(params: {
  invoice: {
    invoiceNumber: string;
    poNumber?: string;
    totalAmount: number;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }>;
  };
  po?: {
    poNumber: string;
    totalAmount: number;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }>;
  } | null;
  grn?: {
    grnNumber: string;
    items: Array<{
      description: string;
      receivedQuantity: number;
      acceptedQuantity: number;
    }>;
  } | null;
  options?: MatchOptions;
}): ThreeWayMatchResult {
  const { invoice, po, grn, options = {} } = params;
  const {
    priceTolerancePercentage = 0.5,
    maxPriceToleranceAmount = 500,
    allowQuantityTolerance = false,
  } = options;

  const discrepancies: string[] = [];

  if (!po) {
    return {
      matchStatus: 'NO_PO_FOUND',
      matchScore: 60,
      hasPO: false,
      hasGRN: false,
      poNumber: invoice.poNumber,
      totalInvoiceAmount: invoice.totalAmount,
      totalVariance: invoice.totalAmount,
      variancePercentage: 100,
      lineItemResults: invoice.items.map((item, idx) => ({
        itemIndex: idx,
        description: item.description,
        invoiceQuantity: item.quantity,
        invoiceUnitPrice: item.unitPrice,
        invoiceAmount: item.amount,
        quantityVariance: 0,
        priceVariance: 0,
        amountVariance: 0,
        status: 'UNEXPECTED_ITEM',
        notes: 'Non-PO Invoice (direct expense billing)',
      })),
      discrepancies: ['No referenced Purchase Order (PO) found in system for 3-way matching.'],
      recommendation: 'MANUAL_REVIEW_REQUIRED',
    };
  }

  const lineItemResults: MatchLineItemResult[] = [];
  let totalPoAmount = po.totalAmount;
  let totalGrnAmount = 0;
  let matchScoresSum = 0;

  invoice.items.forEach((invItem, idx) => {
    // Match line item by text similarity or index
    const matchingPoItem =
      po.items.find((p) => isSimilarDescription(p.description, invItem.description)) ||
      po.items[idx];

    const matchingGrnItem = grn?.items.find((g) =>
      isSimilarDescription(g.description, invItem.description)
    );

    const poQty = matchingPoItem ? matchingPoItem.quantity : undefined;
    const poPrice = matchingPoItem ? matchingPoItem.unitPrice : undefined;
    const poAmt = matchingPoItem ? matchingPoItem.amount : undefined;
    const grnQty = matchingGrnItem ? matchingGrnItem.acceptedQuantity : undefined;

    const qtyVar = poQty !== undefined ? invItem.quantity - poQty : 0;
    const priceVar = poPrice !== undefined ? invItem.unitPrice - poPrice : 0;
    const amtVar = poAmt !== undefined ? invItem.amount - poAmt : 0;

    let itemStatus: MatchLineItemResult['status'] = 'MATCHED';
    const notes: string[] = [];

    // 1. Quantity Check (Invoice Qty vs PO Qty & GRN Qty)
    if (poQty !== undefined && invItem.quantity > poQty) {
      itemStatus = 'QTY_VARIANCE';
      notes.push(`Billed quantity (${invItem.quantity}) exceeds PO quantity (${poQty}).`);
      discrepancies.push(`Line ${idx + 1} (${invItem.description}): Billed ${invItem.quantity} units vs PO ${poQty} units.`);
    }

    if (grnQty !== undefined && invItem.quantity > grnQty) {
      itemStatus = 'QTY_VARIANCE';
      notes.push(`Billed quantity (${invItem.quantity}) exceeds goods received GRN quantity (${grnQty}).`);
      discrepancies.push(`Line ${idx + 1}: Goods received (${grnQty}) is less than invoiced quantity (${invItem.quantity}).`);
    }

    // 2. Price Variance Check
    if (poPrice !== undefined && Math.abs(priceVar) > 0.01) {
      const pctPriceDiff = Math.abs((priceVar / poPrice) * 100);
      if (pctPriceDiff > priceTolerancePercentage && Math.abs(amtVar) > maxPriceToleranceAmount) {
        itemStatus = 'PRICE_VARIANCE';
        notes.push(`Unit rate ₹${invItem.unitPrice} differs from contracted PO rate ₹${poPrice} (+${pctPriceDiff.toFixed(1)}%).`);
        discrepancies.push(`Line ${idx + 1} rate mismatch: Invoiced at ₹${invItem.unitPrice}/unit vs PO rate ₹${poPrice}/unit.`);
      }
    }

    // Line item score
    let lineScore = 100;
    if (itemStatus === 'PRICE_VARIANCE') lineScore -= 30;
    if (itemStatus === 'QTY_VARIANCE') lineScore -= 40;
    if (!matchingPoItem) lineScore -= 50;
    matchScoresSum += Math.max(0, lineScore);

    lineItemResults.push({
      itemIndex: idx + 1,
      description: invItem.description,
      invoiceQuantity: invItem.quantity,
      poQuantity: poQty,
      grnQuantity: grnQty,
      invoiceUnitPrice: invItem.unitPrice,
      poUnitPrice: poPrice,
      invoiceAmount: invItem.amount,
      poAmount: poAmt,
      quantityVariance: qtyVar,
      priceVariance: priceVar,
      amountVariance: amtVar,
      status: itemStatus,
      notes: notes.join(' | ') || 'Line item perfectly matched with PO & GRN',
    });
  });

  const totalVariance = invoice.totalAmount - totalPoAmount;
  const variancePercentage = totalPoAmount > 0 ? (totalVariance / totalPoAmount) * 100 : 0;
  const avgMatchScore = lineItemResults.length > 0 ? Math.round(matchScoresSum / lineItemResults.length) : 100;

  let matchStatus: ThreeWayMatchResult['matchStatus'] = 'PERFECT_MATCH';
  let recommendation: ThreeWayMatchResult['recommendation'] = 'APPROVE_AUTOMATICALLY';

  if (discrepancies.length === 0 && Math.abs(totalVariance) < 1) {
    matchStatus = 'PERFECT_MATCH';
    recommendation = 'APPROVE_AUTOMATICALLY';
  } else if (
    discrepancies.length === 0 &&
    Math.abs(variancePercentage) <= priceTolerancePercentage &&
    Math.abs(totalVariance) <= maxPriceToleranceAmount
  ) {
    matchStatus = 'TOLERANCE_ACCEPTED';
    recommendation = 'APPROVE_AUTOMATICALLY';
  } else {
    matchStatus = 'DISCREPANCY_FLAGGED';
    recommendation = Math.abs(variancePercentage) > 5 ? 'REJECT_OR_REQUEST_CREDIT_NOTE' : 'MANUAL_REVIEW_REQUIRED';
  }

  return {
    matchStatus,
    matchScore: avgMatchScore,
    hasPO: true,
    hasGRN: Boolean(grn),
    poNumber: po.poNumber,
    grnNumber: grn?.grnNumber,
    totalInvoiceAmount: invoice.totalAmount,
    totalPOAmount: totalPoAmount,
    totalGRNAmount: grn ? totalPoAmount : undefined,
    totalVariance,
    variancePercentage,
    lineItemResults,
    discrepancies,
    recommendation,
  };
}

/**
 * Basic fuzzy token overlap to match item descriptions across enterprise systems.
 */
function isSimilarDescription(desc1: string, desc2: string): boolean {
  if (!desc1 || !desc2) return false;
  const clean1 = desc1.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  const clean2 = desc2.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();

  if (clean1 === clean2) return true;
  const words1 = clean1.split(/\s+/);
  const words2 = clean2.split(/\s+/);

  const commonWords = words1.filter((w) => w.length > 2 && words2.includes(w));
  return commonWords.length >= Math.min(2, Math.max(words1.length, words2.length));
}
