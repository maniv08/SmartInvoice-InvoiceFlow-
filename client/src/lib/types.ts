export type UserRole = 'ADMIN' | 'FINANCE_MANAGER' | 'APPROVER' | 'VENDOR';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  organization?: Organization;
  vendor?: Vendor;
  twoFactorEnabled?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export interface Organization {
  _id: string;
  name: string;
  code: string;
  gstin?: string;
  email?: string;
  phone?: string;
  currency?: string;
  logo?: string;
}

export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export interface Vendor {
  _id: string;
  name: string;
  code: string;
  category: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  gstin: string;
  panNumber?: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branch?: string;
  };
  paymentTerms: string;
  status: VendorStatus;
  stats?: {
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
  };
}

export type InvoiceStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_VERIFICATION'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAYMENT_PROCESSING'
  | 'PAID'
  | 'OVERDUE';

export interface InvoiceItem {
  _id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  amount: number;
}

export interface InvoiceAttachment {
  _id?: string;
  filename: string;
  originalName: string;
  url: string;
  fileType: string;
  fileSize: number;
  uploadedAt?: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  vendor: Vendor;
  organization: string | Organization;
  poNumber?: string;
  description?: string;
  issueDate: string;
  dueDate: string;
  paymentTerms: string;
  currency: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  createdBy: User;
  approvedBy?: User;
  rejectedBy?: User;
  rejectionReason?: string;
  rejectedAt?: string;
  currentApprovalStep: number;
  requiredApprovalSteps: number;
  attachments: InvoiceAttachment[];
  remindersSent?: Array<{
    reminderType: string;
    sentAt: string;
    recipient: string;
  }>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Approval {
  _id: string;
  invoice: string;
  stepNumber: number;
  approver: User;
  delegatedFrom?: User;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments?: string;
  decisionDate?: string;
  createdAt: string;
}

export interface ApprovalDelegation {
  _id: string;
  fromUser: User;
  toUser: User;
  startDate: string;
  endDate: string;
  reason?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Payment {
  _id: string;
  paymentNumber: string;
  invoice: Invoice;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod: 'NEFT' | 'RTGS' | 'UPI' | 'IMPS' | 'CREDIT_CARD' | 'CHEQUE' | 'WIRE_TRANSFER';
  referenceId: string;
  status: 'NOT_DUE' | 'DUE_SOON' | 'DUE' | 'OVERDUE' | 'PROCESSING' | 'PAID' | 'FAILED';
  notes?: string;
  processedBy?: User;
  createdAt: string;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'APPROVAL_PENDING' | 'APPROVED' | 'REJECTED' | 'PAYMENT_DUE' | 'PAYMENT_OVERDUE' | 'PAYMENT_COMPLETED' | 'SYSTEM';
  link?: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  user?: User;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  createdAt: string;
}

export interface Setting {
  _id: string;
  approvalThresholds: {
    tier1Limit: number;
    tier2Limit: number;
  };
  reminderConfig: {
    preDueDays: number[];
    postDueDays: number[];
    emailNotificationsEnabled: boolean;
    inAppNotificationsEnabled: boolean;
    escalationRole: string;
  };
  companyProfile: {
    name: string;
    email: string;
    phone: string;
    taxId: string;
    website?: string;
  };
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  message?: string;
  matchedInvoices: Array<{
    id: string;
    invoiceNumber: string;
    vendorName?: string;
    totalAmount: number;
    issueDate: string;
    status: string;
    matchReasons: string[];
  }>;
}
