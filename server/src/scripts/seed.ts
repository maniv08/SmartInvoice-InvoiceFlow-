import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db';
import {
  Organization,
  User,
  Vendor,
  Invoice,
  Approval,
  ApprovalDelegation,
  Payment,
  Notification,
  AuditLog,
  Setting,
  RecurringTemplate,
  PurchaseOrder,
} from '../models';

export const seedDatabase = async () => {
  console.log('🌱 Starting idempotent database seeding for InvoiceFlow...');

  // 1. Clear existing collections
  await Organization.deleteMany({});
  await User.deleteMany({});
  await Vendor.deleteMany({});
  await Invoice.deleteMany({});
  await Approval.deleteMany({});
  await ApprovalDelegation.deleteMany({});
  await Payment.deleteMany({});
  await Notification.deleteMany({});
  await AuditLog.deleteMany({});
  await Setting.deleteMany({});
  await RecurringTemplate.deleteMany({});
  await PurchaseOrder.deleteMany({});

  console.log('🧹 Cleaned up existing collections.');

  // 2. Create Organization
  const org = await Organization.create({
    name: 'DBS World Pvt Ltd',
    code: 'DBS_WLD',
    gstin: '29AABCA1234F1Z5',
    email: 'contact@dbsworld.com',
    phone: '+91 80 4567 8900',
    address: {
      street: 'Tower 4, Embassy TechVillage, Outer Ring Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560103',
      country: 'India',
    },
    currency: 'INR',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
  });
  console.log(`🏢 Created Organization: ${org.name}`);

  // 3. Create 20+ Realistic Indian B2B Vendors
  const vendorData = [
    {
      name: 'Tata Consultancy Services Ltd',
      code: 'VEND-TCS-001',
      category: 'IT Services & Consulting',
      contactPerson: 'Rajesh Gopinathan',
      email: 'enterprise.billing@tcs.com',
      phone: '+91 22 6778 9999',
      address: { street: 'TCS House, Raveline Street, Fort', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001', country: 'India' },
      gstin: '27AAACT2879P1ZU',
      panNumber: 'AAACT2879P',
      bankDetails: { accountName: 'Tata Consultancy Services Ltd', accountNumber: '000405001234', ifscCode: 'HDFC0000004', bankName: 'HDFC Bank Ltd', branch: 'Fort, Mumbai' },
      paymentTerms: 'Net 30',
      status: 'ACTIVE',
    },
    {
      name: 'Infosys BPM Technologies',
      code: 'VEND-INFY-002',
      category: 'Software & Cloud Services',
      contactPerson: 'Salil Parekh',
      email: 'finance.services@infosys.com',
      phone: '+91 80 2852 0261',
      address: { street: 'Electronics City, Hosur Road', city: 'Bengaluru', state: 'Karnataka', postalCode: '560100', country: 'India' },
      gstin: '29AABCI1234A1ZV',
      panNumber: 'AABCI1234A',
      bankDetails: { accountName: 'Infosys Limited', accountNumber: '000201005678', ifscCode: 'ICIC0000002', bankName: 'ICICI Bank Ltd', branch: 'Electronics City, Bengaluru' },
      paymentTerms: 'Net 45',
      status: 'ACTIVE',
    },
    {
      name: 'Reliance Digital Enterprises',
      code: 'VEND-RELI-003',
      category: 'Hardware & Infrastructure',
      contactPerson: 'Mukesh Ambani',
      email: 'corporate.solutions@reliancedigital.in',
      phone: '+91 22 4477 0000',
      address: { street: 'Maker Chambers IV, 222 Nariman Point', city: 'Mumbai', state: 'Maharashtra', postalCode: '400021', country: 'India' },
      gstin: '27AAACR5055K1ZX',
      panNumber: 'AAACR5055K',
      bankDetails: { accountName: 'Reliance Retail Ltd', accountNumber: '001105009876', ifscCode: 'SBIN0000300', bankName: 'State Bank of India', branch: 'Nariman Point' },
      paymentTerms: 'Net 30',
      status: 'ACTIVE',
    },
    {
      name: 'Wipro Infrastructure Engineering',
      code: 'VEND-WIPR-004',
      category: 'Engineering & Facilities',
      contactPerson: 'Rishad Premji',
      email: 'procurement@wipro.com',
      phone: '+91 80 2844 0011',
      address: { street: 'Doddakannelli, Sarjapur Road', city: 'Bengaluru', state: 'Karnataka', postalCode: '560035', country: 'India' },
      gstin: '29AAACW1234B1ZW',
      panNumber: 'AAACW1234B',
      bankDetails: { accountName: 'Wipro Limited', accountNumber: '004405002233', ifscCode: 'KKBK0000100', bankName: 'Kotak Mahindra Bank', branch: 'Sarjapur' },
      paymentTerms: 'Net 30',
      status: 'ACTIVE',
    },
    {
      name: 'HCL Technologies Enterprise',
      code: 'VEND-HCLT-005',
      category: 'IT Support & Security',
      contactPerson: 'Roshni Nadar',
      email: 'b2b.invoicing@hcl.com',
      phone: '+91 120 430 6000',
      address: { street: 'Sector 126', city: 'Noida', state: 'Uttar Pradesh', postalCode: '201304', country: 'India' },
      gstin: '09AAACH1234C1ZX',
      panNumber: 'AAACH1234C',
      bankDetails: { accountName: 'HCL Technologies Ltd', accountNumber: '003305004455', ifscCode: 'AXIS0000050', bankName: 'Axis Bank Ltd', branch: 'Sector 18, Noida' },
      paymentTerms: 'Net 60',
      status: 'ACTIVE',
    },
    {
      name: 'Larsen & Toubro Electrical & Automation',
      code: 'VEND-LT-006',
      category: 'Machinery & Electrical',
      contactPerson: 'S. N. Subrahmanyan',
      email: 'commercial@larsentoubro.com',
      phone: '+91 22 6752 5656',
      address: { street: 'L&T House, Ballard Estate', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001', country: 'India' },
      gstin: '27AAACL0123D1ZY',
      panNumber: 'AAACL0123D',
      bankDetails: { accountName: 'Larsen and Toubro Ltd', accountNumber: '005505006677', ifscCode: 'PUNB0000010', bankName: 'Punjab National Bank', branch: 'Ballard Estate' },
      paymentTerms: 'Net 45',
      status: 'ACTIVE',
    },
    {
      name: 'Bharti Airtel Enterprise Solutions',
      code: 'VEND-AIRT-007',
      category: 'Telecom & ISP',
      contactPerson: 'Gopal Vittal',
      email: 'corporate.billing@airtel.com',
      phone: '+91 124 422 2222',
      address: { street: 'Airtel Center, Plot 16, Udyog Vihar Phase IV', city: 'Gurugram', state: 'Haryana', postalCode: '122015', country: 'India' },
      gstin: '06AAACB1234E1ZZ',
      panNumber: 'AAACB1234E',
      bankDetails: { accountName: 'Bharti Airtel Limited', accountNumber: '007705008899', ifscCode: 'CITI0000003', bankName: 'Citibank N.A.', branch: 'Cyber City, Gurugram' },
      paymentTerms: 'Net 15',
      status: 'ACTIVE',
    },
    {
      name: 'Mahindra Logistics Supply Chain',
      code: 'VEND-MAHI-008',
      category: 'Logistics & Freight',
      contactPerson: 'Rampraveen Swaminathan',
      email: 'invoicing@mahindralogistics.com',
      phone: '+91 22 2841 5500',
      address: { street: 'Mahindra Towers, P. K. Kurne Chowk, Worli', city: 'Mumbai', state: 'Maharashtra', postalCode: '400018', country: 'India' },
      gstin: '27AAACM1234F1Z1',
      panNumber: 'AAACM1234F',
      bankDetails: { accountName: 'Mahindra Logistics Ltd', accountNumber: '008805001122', ifscCode: 'BARB0WORLI', bankName: 'Bank of Baroda', branch: 'Worli' },
      paymentTerms: 'Net 30',
      status: 'ACTIVE',
    },
    {
      name: 'Zoho Corporation Private Ltd',
      code: 'VEND-ZOHO-009',
      category: 'SaaS & Enterprise Tools',
      contactPerson: 'Sridhar Vembu',
      email: 'billing-india@zohocorp.com',
      phone: '+91 44 6744 7070',
      address: { street: 'Estancia IT Park, Vallancheri', city: 'Chengalpattu', state: 'Tamil Nadu', postalCode: '603202', country: 'India' },
      gstin: '33AAACZ1234G1Z2',
      panNumber: 'AAACZ1234G',
      bankDetails: { accountName: 'Zoho Corporation Pvt Ltd', accountNumber: '009905003344', ifscCode: 'HDFC0000124', bankName: 'HDFC Bank Ltd', branch: 'Guduvanchery' },
      paymentTerms: 'Net 15',
      status: 'ACTIVE',
    },
    {
      name: 'Freshworks India Software',
      code: 'VEND-FRSH-010',
      category: 'CRM & Helpdesk SaaS',
      contactPerson: 'Dennis Woodside',
      email: 'accounts-in@freshworks.com',
      phone: '+91 44 6667 8000',
      address: { street: 'Global Infocity Park, Perungudi', city: 'Chennai', state: 'Tamil Nadu', postalCode: '600096', country: 'India' },
      gstin: '33AAACF1234H1Z3',
      panNumber: 'AAACF1234H',
      bankDetails: { accountName: 'Freshworks Technologies India', accountNumber: '001105005566', ifscCode: 'ICIC0000055', bankName: 'ICICI Bank Ltd', branch: 'Perungudi' },
      paymentTerms: 'Net 30',
      status: 'ACTIVE',
    },
    {
      name: 'Razorpay Software Private Ltd',
      code: 'VEND-RAZR-011',
      category: 'Fintech & Payment Gateway',
      contactPerson: 'Harshil Mathur',
      email: 'enterprise-invoices@razorpay.com',
      phone: '+91 80 4666 9555',
      address: { street: '1st Floor, SJR Cyber, Hosur Road, Koramangala', city: 'Bengaluru', state: 'Karnataka', postalCode: '560095', country: 'India' },
      gstin: '29AAACR9988J1Z4',
      panNumber: 'AAACR9988J',
      bankDetails: { accountName: 'Razorpay Software Pvt Ltd', accountNumber: '002205007788', ifscCode: 'YESB0000001', bankName: 'Yes Bank Ltd', branch: 'Koramangala' },
      paymentTerms: 'Immediate',
      status: 'ACTIVE',
    },
    {
      name: 'Delhivery Express Logistics',
      code: 'VEND-DLHV-012',
      category: 'Courier & Warehousing',
      contactPerson: 'Sahil Barua',
      email: 'billing.support@delhivery.com',
      phone: '+91 124 671 9500',
      address: { street: 'Plot 5, Sector 44', city: 'Gurugram', state: 'Haryana', postalCode: '122003', country: 'India' },
      gstin: '06AAACD1122K1Z5',
      panNumber: 'AAACD1122K',
      bankDetails: { accountName: 'Delhivery Limited', accountNumber: '003305009900', ifscCode: 'IDFB0040101', bankName: 'IDFC FIRST Bank', branch: 'Sector 44' },
      paymentTerms: 'Net 15',
      status: 'ACTIVE',
    },
    {
      name: 'Blue Dart Express Couriers',
      code: 'VEND-BLUD-013',
      category: 'Express Air Shipping',
      contactPerson: 'Balfour Manuel',
      email: 'corporate.sales@bluedart.com',
      phone: '+91 22 2839 6444',
      address: { street: 'Blue Dart Centre, Sahar Airport Road, Andheri East', city: 'Mumbai', state: 'Maharashtra', postalCode: '400099', country: 'India' },
      gstin: '27AAACB3344L1Z6',
      panNumber: 'AAACB3344L',
      bankDetails: { accountName: 'Blue Dart Express Ltd', accountNumber: '004405001133', ifscCode: 'SCBL0036001', bankName: 'Standard Chartered Bank', branch: 'Andheri East' },
      paymentTerms: 'Net 30',
      status: 'ACTIVE',
    },
    {
      name: 'Godrej Interio Workspaces',
      code: 'VEND-GDRJ-014',
      category: 'Office Furniture & Interiors',
      contactPerson: 'Jamshyd Godrej',
      email: 'institutional.sales@godrej.com',
      phone: '+91 22 6796 5656',
      address: { street: 'Pirojshanagar, Vikhroli', city: 'Mumbai', state: 'Maharashtra', postalCode: '400079', country: 'India' },
      gstin: '27AAACG5566M1Z7',
      panNumber: 'AAACG5566M',
      bankDetails: { accountName: 'Godrej & Boyce Mfg Co Ltd', accountNumber: '005505003355', ifscCode: 'UTIB0000004', bankName: 'Axis Bank Ltd', branch: 'Vikhroli' },
      paymentTerms: 'Net 45',
      status: 'ACTIVE',
    },
    {
      name: 'Asian Paints Industrial Coatings',
      code: 'VEND-ASNP-015',
      category: 'Paints & Building Maintenance',
      contactPerson: 'Amit Syngle',
      email: 'b2b-orders@asianpaints.com',
      phone: '+91 22 6218 1000',
      address: { street: '6A Shantinagar, Santacruz East', city: 'Mumbai', state: 'Maharashtra', postalCode: '400055', country: 'India' },
      gstin: '27AAACA7788N1Z8',
      panNumber: 'AAACA7788N',
      bankDetails: { accountName: 'Asian Paints Ltd', accountNumber: '006605005577', ifscCode: 'HDFC0000060', bankName: 'HDFC Bank Ltd', branch: 'Santacruz' },
      paymentTerms: 'Net 30',
      status: 'ACTIVE',
    },
    {
      name: 'Crompton Electrical Systems',
      code: 'VEND-CRMP-016',
      category: 'Lighting & HVAC Appliances',
      contactPerson: 'Mathew Job',
      email: 'commercial.enquiry@crompton.co.in',
      phone: '+91 22 6167 8499',
      address: { street: 'Tower 3, Equinox Business Park, LBS Marg, Kurla', city: 'Mumbai', state: 'Maharashtra', postalCode: '400070', country: 'India' },
      gstin: '27AAACC9900P1Z9',
      panNumber: 'AAACC9900P',
      bankDetails: { accountName: 'Crompton Greaves Consumer Electricals', accountNumber: '007705007799', ifscCode: 'ICIC0000011', bankName: 'ICICI Bank Ltd', branch: 'Kurla' },
      paymentTerms: 'Net 30',
      status: 'ACTIVE',
    },
    {
      name: 'Havells India Commercial Appliances',
      code: 'VEND-HAVL-017',
      category: 'Industrial Switchgear & Cables',
      contactPerson: 'Anil Rai Gupta',
      email: 'corporate.sales@havells.com',
      phone: '+91 120 333 1000',
      address: { street: 'QRG Towers, 2D Expressway, Sector 126', city: 'Noida', state: 'Uttar Pradesh', postalCode: '201304', country: 'India' },
      gstin: '09AAACH3322Q1ZA',
      panNumber: 'AAACH3322Q',
      bankDetails: { accountName: 'Havells India Ltd', accountNumber: '008805009911', ifscCode: 'PUNB0123400', bankName: 'Punjab National Bank', branch: 'Noida' },
      paymentTerms: 'Net 30',
      status: 'ACTIVE',
    },
    {
      name: 'Titan Corporate Gifting & Workwear',
      code: 'VEND-TITN-018',
      category: 'Corporate Merchandise',
      contactPerson: 'CK Venkataraman',
      email: 'corporate.sales@titan.co.in',
      phone: '+91 80 6704 7000',
      address: { street: 'Integrity, 132/133 Divyasree Technopolis, Yamalur', city: 'Bengaluru', state: 'Karnataka', postalCode: '560037', country: 'India' },
      gstin: '29AAACT5544R1ZB',
      panNumber: 'AAACT5544R',
      bankDetails: { accountName: 'Titan Company Ltd', accountNumber: '009905001133', ifscCode: 'SBIN0009077', bankName: 'State Bank of India', branch: 'HAL Bangalore' },
      paymentTerms: 'Net 15',
      status: 'ACTIVE',
    },
    {
      name: 'Swiggy Corporate Meal Solutions',
      code: 'VEND-SWIG-019',
      category: 'Cafeteria & Pantry Services',
      contactPerson: 'Sriharsha Majety',
      email: 'corporate-meals@swiggy.in',
      phone: '+91 80 6000 6600',
      address: { street: 'Devarabisanahalli, Bellandur', city: 'Bengaluru', state: 'Karnataka', postalCode: '560103', country: 'India' },
      gstin: '29AABCS7766S1ZC',
      panNumber: 'AABCS7766S',
      bankDetails: { accountName: 'Bundl Technologies Pvt Ltd', accountNumber: '001105003355', ifscCode: 'HDFC0000542', bankName: 'HDFC Bank Ltd', branch: 'Bellandur' },
      paymentTerms: 'Net 15',
      status: 'ACTIVE',
    },
    {
      name: 'Zomato Corporate Dining Services',
      code: 'VEND-ZOMT-020',
      category: 'Catering & Event Dining',
      contactPerson: 'Deepinder Goyal',
      email: 'b2b-events@zomato.com',
      phone: '+91 124 415 6600',
      address: { street: 'Ground Floor, 12A, 94 Meghdoot, Nehru Place', city: 'New Delhi', state: 'Delhi', postalCode: '110019', country: 'India' },
      gstin: '07AAACZ8877T1ZD',
      panNumber: 'AAACZ8877T',
      bankDetails: { accountName: 'Zomato Limited', accountNumber: '002205005577', ifscCode: 'YESB0000015', bankName: 'Yes Bank Ltd', branch: 'Nehru Place' },
      paymentTerms: 'Net 15',
      status: 'ACTIVE',
    },
  ];

  const createdVendors = await Vendor.insertMany(
    vendorData.map((v) => ({ ...v, organization: org._id }))
  );
  console.log(`🏭 Created ${createdVendors.length} Vendors.`);

  // 4. Create 10+ Users across 4 roles
  const defaultHashedPassword = await bcrypt.hash('Password123!', 10);
  const usersData = [
    {
      name: 'V. Manikandan',
      email: 'vmanikandan9841@dbsworld.com',
      password: defaultHashedPassword,
      role: 'ADMIN',
      organization: org._id,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      twoFactorEnabled: false,
    },
    {
      name: 'Karthik',
      email: 'offxkarthik07@dbsworld.com',
      password: defaultHashedPassword,
      role: 'FINANCE_MANAGER',
      organization: org._id,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
      twoFactorEnabled: false,
    },
    {
      name: 'Rohan Gupta',
      email: 'finance2@dbsworld.com',
      password: defaultHashedPassword,
      role: 'FINANCE_MANAGER',
      organization: org._id,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      twoFactorEnabled: false,
    },
    {
      name: 'V. Manikandan',
      email: 'vmanikandan7200@dbsworld.com',
      password: defaultHashedPassword,
      role: 'APPROVER',
      organization: org._id,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      twoFactorEnabled: false,
    },
    {
      name: 'Ananya Deshmukh',
      email: 'ananya.deshmukh@dbsworld.com',
      password: defaultHashedPassword,
      role: 'APPROVER',
      organization: org._id,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
      twoFactorEnabled: false,
    },
    {
      name: 'Rahul Verma',
      email: 'rahul.verma@dbsworld.com',
      password: defaultHashedPassword,
      role: 'APPROVER',
      organization: org._id,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
      twoFactorEnabled: false,
    },
    {
      name: 'Deepak Nair',
      email: 'deepak.nair@dbsworld.com',
      password: defaultHashedPassword,
      role: 'APPROVER',
      organization: org._id,
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80',
      twoFactorEnabled: false,
    },
    {
      name: 'Kishore',
      email: 'kishore983@dbsworld.com',
      password: defaultHashedPassword,
      role: 'VENDOR',
      organization: org._id,
      vendor: createdVendors[0]._id,
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&auto=format&fit=crop&q=80',
      twoFactorEnabled: false,
    },
    {
      name: 'Salil Parekh (Infosys)',
      email: 'billing@infosys.com',
      password: defaultHashedPassword,
      role: 'VENDOR',
      organization: org._id,
      vendor: createdVendors[1]._id,
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80',
      twoFactorEnabled: false,
    },
    {
      name: 'Harshil Mathur (Razorpay)',
      email: 'accounts@razorpay.com',
      password: defaultHashedPassword,
      role: 'VENDOR',
      organization: org._id,
      vendor: createdVendors[10]._id,
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80',
      twoFactorEnabled: false,
    },
    {
      name: 'Sridhar Vembu (Zoho)',
      email: 'invoices@zoho.com',
      password: defaultHashedPassword,
      role: 'VENDOR',
      organization: org._id,
      vendor: createdVendors[8]._id,
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
      twoFactorEnabled: false,
    },
  ];

  const createdUsers = await User.insertMany(usersData);
  console.log(`👥 Created ${createdUsers.length} Users with roles ADMIN, FINANCE_MANAGER, APPROVER, VENDOR.`);

  const adminUser = createdUsers.find((u) => u.email === 'vmanikandan9841@dbsworld.com') || createdUsers.find((u) => u.role === 'ADMIN')!;
  const financeUser = createdUsers.find((u) => u.email === 'offxkarthik07@dbsworld.com') || createdUsers.find((u) => u.role === 'FINANCE_MANAGER')!;
  const approver1 = createdUsers.find((u) => u.email === 'vmanikandan7200@dbsworld.com') || createdUsers.find((u) => u.role === 'APPROVER')!;
  const approver2 = createdUsers.find((u) => u.email === 'ananya.deshmukh@dbsworld.com') || createdUsers.filter((u) => u.role === 'APPROVER')[1] || approver1;
  const approver3 = createdUsers.find((u) => u.email === 'rahul.verma@dbsworld.com') || approver1;

  // 5. Create System Settings
  const settings = await Setting.create({
    organization: org._id,
    approvalThresholds: {
      tier1Limit: 10000,
      tier2Limit: 100000,
    },
    reminderConfig: {
      preDueDays: [7, 3, 1],
      postDueDays: [1, 7, 15],
      emailNotificationsEnabled: true,
      inAppNotificationsEnabled: true,
      escalationRole: 'FINANCE_MANAGER',
    },
    companyProfile: {
      name: 'DBS World Pvt Ltd',
      email: 'contact@dbsworld.com',
      phone: '+91 80 4567 8900',
      taxId: '29AABCA1234F1Z5',
      website: 'https://dbsworld.com',
    },
  });
  console.log('⚙️ Created Organization Settings & Approval Thresholds.');

  // 6. Create Approval Delegation (Example: Vikram Joshi delegating to Ananya Deshmukh)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 8);

  const delegation = await ApprovalDelegation.create({
    organization: org._id,
    fromUser: approver1._id,
    toUser: approver2._id,
    startDate: tomorrow,
    endDate: nextWeek,
    reason: 'Annual Leave Coverage - Approvals delegated during absence',
    isActive: true,
  });
  console.log(`📋 Created Approval Delegation from ${approver1.name} to ${approver2.name}.`);

  // 7. Generate 50+ Realistic Diverse Invoices across all 8 Statuses
  const statuses: Array<'DRAFT' | 'SUBMITTED' | 'UNDER_VERIFICATION' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PAYMENT_PROCESSING' | 'PAID' | 'OVERDUE'> = [
    'DRAFT',
    'SUBMITTED',
    'UNDER_VERIFICATION',
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'PAYMENT_PROCESSING',
    'PAID',
    'OVERDUE',
  ];

  const invoiceItemsPool = [
    { description: 'Cloud Infrastructure Dedicated Nodes (AWS Mumbai)', unitPrice: 24000, taxRate: 18 },
    { description: 'Enterprise Cybersecurity Managed SOC Support', unitPrice: 45000, taxRate: 18 },
    { description: 'Custom ERP Software Development & Enhancements', unitPrice: 75000, taxRate: 18 },
    { description: 'High-Speed Dedicated Leased Line 1Gbps', unitPrice: 18500, taxRate: 18 },
    { description: 'Ergonomic Executive Mesh Chairs (Pack of 10)', unitPrice: 55000, taxRate: 18 },
    { description: 'Industrial Power Distribution & UPS Maintenance', unitPrice: 32000, taxRate: 18 },
    { description: 'Express Surface Freight Delivery & Fulfillment', unitPrice: 8400, taxRate: 18 },
    { description: 'Zoho One Enterprise 50 User Annual Subscriptions', unitPrice: 90000, taxRate: 18 },
    { description: 'Freshdesk Enterprise Omnichannel Support Licenses', unitPrice: 65000, taxRate: 18 },
    { description: 'Razorpay Payment Gateway API Integration & Processing', unitPrice: 12500, taxRate: 18 },
    { description: 'Corporate Cafeteria Weekly Meal Passes & Beverages', unitPrice: 6200, taxRate: 5 },
    { description: 'Executive Corporate Dining & Client Gala Catering', unitPrice: 16800, taxRate: 5 },
    { description: 'Office Annual Facility Painting & Coating Maintenance', unitPrice: 42000, taxRate: 18 },
    { description: 'LED High-Bay Industrial Fixtures & Panel Lighting', unitPrice: 28000, taxRate: 18 },
    { description: 'Corporate Annual Leadership Milestone Watches (25 Units)', unitPrice: 125000, taxRate: 28 },
    { description: 'Air Express Urgent Document Courier Consignments', unitPrice: 3400, taxRate: 18 },
  ];

  const invoicesToInsert: any[] = [];
  const approvalsToInsert: any[] = [];
  const paymentsToInsert: any[] = [];
  const auditLogsToInsert: any[] = [];
  const notificationsToInsert: any[] = [];

  // Deterministic generator for 54 realistic invoices
  for (let i = 1; i <= 54; i++) {
    const vendorIndex = (i - 1) % createdVendors.length;
    const vendor = createdVendors[vendorIndex];
    const status = statuses[(i - 1) % statuses.length];

    // Pick 1 to 3 items
    const itemCount = (i % 3) + 1;
    const items = [];
    let subtotal = 0;
    let totalTax = 0;

    for (let k = 0; k < itemCount; k++) {
      const poolItem = invoiceItemsPool[(i + k * 3) % invoiceItemsPool.length];
      const qty = (k + 1) * (i % 2 === 0 ? 1 : 2);
      const lineSubtotal = poolItem.unitPrice * qty;
      const lineTax = (lineSubtotal * poolItem.taxRate) / 100;
      const lineTotal = lineSubtotal + lineTax;

      items.push({
        description: `${poolItem.description} [Period: Q${(i % 4) + 1}]`,
        quantity: qty,
        unitPrice: poolItem.unitPrice,
        taxRate: poolItem.taxRate,
        taxAmount: lineTax,
        amount: lineTotal,
      });

      subtotal += lineSubtotal;
      totalTax += lineTax;
    }

    const discountAmount = i % 5 === 0 ? Math.round(subtotal * 0.05) : 0;
    const totalAmount = subtotal + totalTax - discountAmount;

    // Determine required approval steps
    let requiredApprovalSteps = 1;
    if (totalAmount > 100000) {
      requiredApprovalSteps = 3;
    } else if (totalAmount >= 10000) {
      requiredApprovalSteps = 2;
    }

    // Dates
    const issueDate = new Date();
    issueDate.setDate(issueDate.getDate() - (55 - i));

    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 30);

    // Overdue invoices have past due date
    if (status === 'OVERDUE') {
      dueDate.setDate(dueDate.getDate() - 45);
    }

    const invoiceNumber = `INV-2026-${String(1000 + i).padStart(4, '0')}`;
    const poNumber = `PO-2026-${String(8000 + i).padStart(4, '0')}`;

    const invoiceId = new mongoose.Types.ObjectId();

    let currentApprovalStep = 1;
    let approvedBy = undefined;
    let rejectedBy = undefined;
    let rejectionReason = undefined;
    let rejectedAt = undefined;

    if (status === 'APPROVED' || status === 'PAYMENT_PROCESSING' || status === 'PAID') {
      currentApprovalStep = requiredApprovalSteps;
      approvedBy = requiredApprovalSteps >= 2 ? financeUser._id : approver1._id;
    } else if (status === 'REJECTED') {
      rejectedBy = approver1._id;
      rejectionReason = 'GSTIN discrepancy on line item breakdown; vendor rate mismatch against agreed PO pricing.';
      rejectedAt = new Date();
    } else if (status === 'PENDING_APPROVAL') {
      currentApprovalStep = Math.min(2, requiredApprovalSteps);
    }

    const newInvoiceDoc = {
      _id: invoiceId,
      invoiceNumber,
      vendor: vendor._id,
      organization: org._id,
      poNumber,
      description: `B2B Procurement & Vendor Services invoice for ${vendor.category}`,
      issueDate,
      dueDate,
      paymentTerms: vendor.paymentTerms || 'Net 30',
      currency: 'INR',
      items,
      subtotal,
      taxRate: 18,
      taxAmount: totalTax,
      discountAmount,
      totalAmount,
      status,
      createdBy: i % 4 === 0 ? adminUser._id : financeUser._id,
      approvedBy,
      rejectionReason,
      rejectedBy,
      rejectedAt,
      currentApprovalStep,
      requiredApprovalSteps,
      attachments: [
        {
          filename: `invoice_${invoiceNumber.toLowerCase()}.pdf`,
          originalName: `${invoiceNumber}_Verified_Invoice.pdf`,
          url: `/uploads/samples/${invoiceNumber.toLowerCase()}.pdf`,
          fileType: 'application/pdf',
          fileSize: 1024 * (120 + (i % 80)),
          uploadedBy: financeUser._id,
          uploadedAt: issueDate,
        },
      ],
      remindersSent: status === 'OVERDUE' ? [{ reminderType: 'POST_DUE_15D', sentAt: new Date(), recipient: vendor.email }] : [],
      notes: `Procured under standard corporate billing master agreement 2026-IND.`,
      createdAt: issueDate,
      updatedAt: new Date(),
    };

    invoicesToInsert.push(newInvoiceDoc);

    // Create Approvals for the invoice
    if (status === 'PENDING_APPROVAL' || status === 'APPROVED' || status === 'PAYMENT_PROCESSING' || status === 'PAID' || status === 'REJECTED') {
      // Step 1 approval
      approvalsToInsert.push({
        invoice: invoiceId,
        organization: org._id,
        stepNumber: 1,
        approver: approver1._id,
        status: status === 'REJECTED' ? 'REJECTED' : 'APPROVED',
        comments: status === 'REJECTED' ? 'Incorrect tax schedule applied' : 'Initial line items verified against PO.',
        decisionDate: issueDate,
        createdAt: issueDate,
        updatedAt: issueDate,
      });

      if (requiredApprovalSteps >= 2 && status !== 'REJECTED') {
        approvalsToInsert.push({
          invoice: invoiceId,
          organization: org._id,
          stepNumber: 2,
          approver: approver2._id,
          status: status === 'APPROVED' || status === 'PAYMENT_PROCESSING' || status === 'PAID' ? 'APPROVED' : 'PENDING',
          comments: status === 'APPROVED' || status === 'PAYMENT_PROCESSING' || status === 'PAID' ? 'Manager review cleared within budget.' : undefined,
          decisionDate: status === 'APPROVED' || status === 'PAYMENT_PROCESSING' || status === 'PAID' ? new Date() : undefined,
          createdAt: issueDate,
          updatedAt: new Date(),
        });
      }

      if (requiredApprovalSteps === 3 && (status === 'APPROVED' || status === 'PAYMENT_PROCESSING' || status === 'PAID')) {
        approvalsToInsert.push({
          invoice: invoiceId,
          organization: org._id,
          stepNumber: 3,
          approver: financeUser._id,
          status: 'APPROVED',
          comments: 'Finance Executive threshold approval granted.',
          decisionDate: new Date(),
          createdAt: issueDate,
          updatedAt: new Date(),
        });
      }
    }

    // Create Payment if status is PAID or PAYMENT_PROCESSING
    if (status === 'PAID' || status === 'PAYMENT_PROCESSING') {
      const paymentDate = new Date(issueDate);
      paymentDate.setDate(paymentDate.getDate() + 14);

      const paymentNumber = `PAY-2026-${String(9000 + i).padStart(4, '0')}`;
      const paymentMethods: Array<'NEFT' | 'RTGS' | 'UPI' | 'IMPS'> = ['NEFT', 'RTGS', 'UPI', 'IMPS'];
      const method = paymentMethods[i % paymentMethods.length];

      paymentsToInsert.push({
        paymentNumber,
        invoice: invoiceId,
        organization: org._id,
        amount: totalAmount,
        currency: 'INR',
        paymentDate,
        paymentMethod: method,
        referenceId: `UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        status: status === 'PAID' ? 'PAID' : 'PROCESSING',
        notes: `Electronic fund transfer remittance via ${vendor.bankDetails.bankName} Account ${vendor.bankDetails.accountNumber.slice(-4)}`,
        processedBy: financeUser._id,
        createdAt: paymentDate,
        updatedAt: paymentDate,
      });
    }

    // Create Audit Log for invoice creation and status mutations
    auditLogsToInsert.push({
      user: financeUser._id,
      userName: financeUser.name,
      action: 'INVOICE_CREATE',
      entityType: 'Invoice',
      entityId: invoiceId.toString(),
      entityName: invoiceNumber,
      previousValue: null,
      newValue: {
        invoiceNumber,
        vendor: vendor.name,
        totalAmount,
        status: 'SUBMITTED',
      },
      ipAddress: '192.168.1.42',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      organization: org._id,
      createdAt: issueDate,
    });

    if (status === 'APPROVED' || status === 'PAID') {
      auditLogsToInsert.push({
        user: approvedBy || financeUser._id,
        userName: approvedBy ? (approvedBy.equals(financeUser._id) ? financeUser.name : approver1.name) : financeUser.name,
        action: 'INVOICE_APPROVE',
        entityType: 'Invoice',
        entityId: invoiceId.toString(),
        entityName: invoiceNumber,
        previousValue: { status: 'PENDING_APPROVAL' },
        newValue: { status: 'APPROVED' },
        ipAddress: '192.168.1.45',
        organization: org._id,
        createdAt: new Date(),
      });
    }

    // Notifications
    if (status === 'PENDING_APPROVAL') {
      notificationsToInsert.push({
        user: approver1._id,
        organization: org._id,
        title: 'Invoice Awaiting Your Approval',
        message: `Invoice ${invoiceNumber} from ${vendor.name} for ₹${totalAmount.toLocaleString('en-IN')} requires your review.`,
        type: 'APPROVAL_PENDING',
        link: `/invoices/${invoiceId}`,
        isRead: false,
        metadata: { invoiceId, totalAmount, vendorName: vendor.name },
        createdAt: new Date(),
      });
    } else if (status === 'OVERDUE') {
      notificationsToInsert.push({
        user: financeUser._id,
        organization: org._id,
        title: 'Overdue Vendor Payment Alert',
        message: `Payment for Invoice ${invoiceNumber} (${vendor.name}) is overdue. Total: ₹${totalAmount.toLocaleString('en-IN')}`,
        type: 'PAYMENT_OVERDUE',
        link: `/invoices/${invoiceId}`,
        isRead: false,
        metadata: { invoiceId, totalAmount, vendorName: vendor.name },
        createdAt: new Date(),
      });
    }
  }

  await Invoice.insertMany(invoicesToInsert);
  console.log(`📄 Created ${invoicesToInsert.length} Invoices.`);

  await Approval.insertMany(approvalsToInsert);
  console.log(`✅ Created ${approvalsToInsert.length} Approval step records.`);

  await Payment.insertMany(paymentsToInsert);
  console.log(`💳 Created ${paymentsToInsert.length} Payment records.`);

  await AuditLog.insertMany(auditLogsToInsert);
  console.log(`📜 Created ${auditLogsToInsert.length} Audit Log events.`);

  await Notification.insertMany(notificationsToInsert);
  console.log(`🔔 Created ${notificationsToInsert.length} In-App Notifications.`);

  // 8. Create Recurring Invoice Templates
  const recurringTemplates = [
    {
      title: 'Monthly Cloud Infrastructure Retainer',
      vendor: createdVendors[0]._id,
      organization: org._id,
      frequency: 'MONTHLY',
      items: [
        {
          description: 'Managed Cloud Infrastructure Hosting & Disaster Recovery',
          quantity: 1,
          unitPrice: 85000,
          taxRate: 18,
          taxAmount: 15300,
          amount: 100300,
        },
      ],
      subtotal: 85000,
      taxRate: 18,
      taxAmount: 15300,
      totalAmount: 100300,
      paymentTerms: 'Net 30',
      nextRunDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      isActive: true,
      notes: 'Auto-billed on the 1st of every calendar month.',
    },
    {
      title: 'Zoho One Enterprise Workplace Licenses',
      vendor: createdVendors[8]._id,
      organization: org._id,
      frequency: 'MONTHLY',
      items: [
        {
          description: 'Zoho One 50 Seat License Subscription',
          quantity: 50,
          unitPrice: 1800,
          taxRate: 18,
          taxAmount: 16200,
          amount: 106200,
        },
      ],
      subtotal: 90000,
      taxRate: 18,
      taxAmount: 16200,
      totalAmount: 106200,
      paymentTerms: 'Net 15',
      nextRunDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      isActive: true,
      notes: 'Monthly enterprise SaaS subscription.',
    },
    {
      title: 'Facility Painting & HVAC Quarterly Maintenance',
      vendor: createdVendors[14]._id,
      organization: org._id,
      frequency: 'QUARTERLY',
      items: [
        {
          description: 'Quarterly Commercial Facility Inspection & Filter Replacement',
          quantity: 1,
          unitPrice: 45000,
          taxRate: 18,
          taxAmount: 8100,
          amount: 53100,
        },
      ],
      subtotal: 45000,
      taxRate: 18,
      taxAmount: 8100,
      totalAmount: 53100,
      paymentTerms: 'Net 30',
      nextRunDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      isActive: true,
      notes: 'Quarterly facility preventative maintenance.',
    },
  ];

  await RecurringTemplate.insertMany(recurringTemplates);
  console.log(`🔄 Created ${recurringTemplates.length} Recurring Invoice Templates.`);

  // 12. Create Purchase Orders with GRN data for 3-Way Matching
  const purchaseOrders = [
    {
      poNumber: 'PO-2026-001',
      organization: org._id,
      vendor: createdVendors[0]._id,
      orderDate: new Date(Date.now() - 30 * 86400000),
      deliveryDate: new Date(Date.now() - 15 * 86400000),
      status: 'COMPLETED',
      items: [
        {
          description: 'Cloud Infrastructure Dedicated Nodes (AWS Mumbai) [Period: Q1]',
          hsnCode: '998313',
          quantity: 2,
          unitPrice: 24000,
          taxRate: 18,
          taxAmount: 8640,
          amount: 56640,
        },
      ],
      subtotal: 48000,
      taxAmount: 8640,
      totalAmount: 56640,
      grnRecords: [
        {
          grnNumber: 'GRN-2026-0881',
          receivedDate: new Date(Date.now() - 14 * 86400000),
          receivedBy: 'Warehouse Manager - Ramesh K',
          items: [
            {
              description: 'Cloud Infrastructure Dedicated Nodes (AWS Mumbai) [Period: Q1]',
              receivedQuantity: 2,
              acceptedQuantity: 2,
              rejectedQuantity: 0,
            },
          ],
        },
      ],
      notes: 'Standard approved corporate PO for IT cloud infrastructure.',
    },
    {
      poNumber: 'PO-2026-002',
      organization: org._id,
      vendor: createdVendors[1]._id,
      orderDate: new Date(Date.now() - 25 * 86400000),
      deliveryDate: new Date(Date.now() - 10 * 86400000),
      status: 'OPEN',
      items: [
        {
          description: 'Enterprise Cybersecurity Managed SOC Support [Period: Q2]',
          hsnCode: '998313',
          quantity: 1,
          unitPrice: 45000,
          taxRate: 18,
          taxAmount: 8100,
          amount: 53100,
        },
      ],
      subtotal: 45000,
      taxAmount: 8100,
      totalAmount: 53100,
      grnRecords: [
        {
          grnNumber: 'GRN-2026-0892',
          receivedDate: new Date(Date.now() - 9 * 86400000),
          receivedBy: 'Security Operations Lead',
          items: [
            {
              description: 'Enterprise Cybersecurity Managed SOC Support [Period: Q2]',
              receivedQuantity: 1,
              acceptedQuantity: 1,
              rejectedQuantity: 0,
            },
          ],
        },
      ],
      notes: 'Annual cybersecurity retainer contract PO.',
    },
    {
      poNumber: 'PO-2026-003',
      organization: org._id,
      vendor: createdVendors[2]._id,
      orderDate: new Date(Date.now() - 20 * 86400000),
      deliveryDate: new Date(Date.now() - 5 * 86400000),
      status: 'PARTIALLY_FULFILLED',
      items: [
        {
          description: 'Custom ERP Software Development & Enhancements [Period: Q3]',
          hsnCode: '998313',
          quantity: 3,
          unitPrice: 75000,
          taxRate: 18,
          taxAmount: 40500,
          amount: 265500,
        },
      ],
      subtotal: 225000,
      taxAmount: 40500,
      totalAmount: 265500,
      grnRecords: [
        {
          grnNumber: 'GRN-2026-0905',
          receivedDate: new Date(Date.now() - 4 * 86400000),
          receivedBy: 'Engineering VP',
          items: [
            {
              description: 'Custom ERP Software Development & Enhancements [Period: Q3]',
              receivedQuantity: 3,
              acceptedQuantity: 3,
              rejectedQuantity: 0,
            },
          ],
        },
      ],
      notes: 'Custom ERP feature build milestone 1.',
    },
  ];

  await PurchaseOrder.insertMany(purchaseOrders);
  console.log(`📦 Created ${purchaseOrders.length} Purchase Orders with verified GRN receipts.`);

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('--------------------------------------------------');
  console.log('Demo Credentials:');
  console.log('• Admin:           vmanikandan9841@dbsworld.com  / Password123!');
  console.log('• Finance Manager: offxkarthik07@dbsworld.com    / Password123!');
  console.log('• Approver:        vmanikandan7200@dbsworld.com  / Password123!');
  console.log('• Vendor:          kishore983@dbsworld.com       / Password123!');
  console.log('--------------------------------------------------\n');
};

// If run directly via CLI
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('❌ Seeding failed with error:', err);
      process.exit(1);
    }
  })();
}

