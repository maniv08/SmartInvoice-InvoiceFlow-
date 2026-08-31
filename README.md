# 🚀 InvoiceFlow — Smart Invoice & Vendor Payment Management System

> **A production-grade, full-stack Enterprise SaaS platform built with React, TypeScript, Node.js, Express.js, PostgreSQL 16, Redis 7, REST API, Docker Compose, and Git/GitHub for multi-tier invoice approvals, automated duplicate detection, Indian GST statutory compliance, and electronic vendor remittances.**

Designed to the visual caliber of Stripe, Linear, and Ramp with containerized layouts, top floating pill navigation, dark/light modes, Tremor-style financial KPI analytics, and time-bounded approval delegations.

---

## 📸 Overview & Key Capabilities

- **⚡ Enterprise Hybrid Architecture (PostgreSQL 16 + Redis 7 + MongoDB)**: 
  - **PostgreSQL 16**: Relational data store, DDL migrations, strict foreign key constraints, and transactional compliance ledger.
  - **Redis 7**: Accelerated in-memory caching middleware (`X-Cache: HIT/MISS`), instant key-value cache invalidation, and rate limiting.
  - **Zero-Friction Fallback**: Intelligent automatic in-memory fallback mechanisms for PostgreSQL, Redis, and MongoDB so the platform runs flawlessly anywhere with zero setup hassle.
- **🛡️ Dynamic Multi-Tier Approval Engine**: Automatic tier-based approval matrix calculation:
  - **Tier 1 (< ₹10,000)**: 1 approval level (Verification & Line-Item Review).
  - **Tier 2 (₹10,000 – ₹1,00,000)**: 2 approval levels (Line-item review + Department Manager authorization).
  - **Tier 3 (> ₹1,00,000)**: 3 approval levels (Executive Finance Board sign-off).
- **⚠️ Real-Time Inline Duplicate Detection**: Non-blocking advisory warning banner evaluating compound indexes (`{ vendor, invoiceNumber }`, amount, issue date) as the user types.
- **💳 Multi-Channel Electronic Settlement Ledger**: Remittance tracking (`NEFT`, `RTGS`, `UPI`, `IMPS`, `Credit Card`, `Cheque`, `Wire Transfer`) with UTR numbers that automatically transition approved invoices to `PAID`.
- **⏰ Automated Background Scheduler & Reminders**: `node-cron` engine dispatching pre-due (7d, 3d, 1d) alerts, post-due (1d, 7d, 15d) managerial escalations, and recurring template auto-generation with a manual instant trigger test button.
- **📊 Statutory Reports & PDF Generator**: Multi-tab analytics for Invoices, Disbursements, Vendor 360, and GST Tax Schedules with client-side downloadable CSV and high-resolution PDF statements (`jsPDF` + `autoTable`).
- **📜 Immutable Audit Log Register**: Append-only compliance log with expandable side-by-side JSON state diff comparison.
- **🔐 Enterprise Auth & TOTP 2FA**: JWT authentication, Speakeasy TOTP Two-Factor QR code setup, and 1-click evaluator demo role login cards.

---

## 🔑 Demo Evaluator Credentials

The database comes pre-seeded with 54 realistic invoices, 20 Indian B2B vendors (TCS, Infosys, Reliance, Wipro, HCL, L&T, Airtel, Zoho, Freshworks, Razorpay), 11 users, approval delegations, payments, and audit logs.

| Role | Email | Password | Access Privileges |
|---|---|---|---|
| **Admin** | `admin@invoiceflow.io` | `Password123!` | Full system administration, threshold editor, user RBAC, invoices, approvals, payments, reports |
| **Finance Manager** | `finance@invoiceflow.io` | `Password123!` | Financial disbursements, payment ledger, report exports, invoice approvals |
| **Approver** | `approver@invoiceflow.io` | `Password123!` | Managerial review queue, step approvals, authority delegations |
| **Vendor** | `vendor@tata.com` | `Password123!` | Self-service vendor portal, invoice submission, payment tracking |

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Radix UI Primitives, jsPDF, Sonner |
| **Backend** | Node.js, Express.js, TypeScript, REST API, Zod Validation, Multer, Helmet, Node-Cron, Nodemailer |
| **Relational Database** | PostgreSQL 16 Alpine, Relational DDL Migrations, Foreign Key Integrity |
| **High-Speed Caching** | Redis 7 Alpine, `ioredis`, In-Memory Key-Value LRU Cache Fallback |
| **API Documentation** | OpenAPI 3.0 / Swagger UI (`/api/docs`), Health Monitor (`/api/health`) |
| **DevOps & Containers** | Docker, Docker Compose (Multi-Service: Postgres, Redis, Mongo, Express API, Nginx React) |
| **Version Control** | Git / GitHub CI/CD Ready |

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+ (or 20+)
- npm or yarn
- *(Optional)* Docker & Docker Compose

### 1. Installation
Clone the repository and install dependencies:
```bash
# Install root, backend, and frontend dependencies
npm run install:all
```

### 2. Running Locally (Concurrent Mode)
```bash
# Start backend (Port 5000) and frontend (Port 5173) concurrently
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Interactive Swagger Documentation**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **Health Check Endpoint**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🐳 Docker Deployment

To launch the complete containerized stack (MongoDB 7.0 + Node.js API + Nginx Frontend):

```bash
docker-compose up --build
```

---

## 🧪 Running Automated Tests

The test suite runs with Vitest and validates all core workflows (Auth, Dynamic Threshold Engine, Duplicate Detection, Multi-Step Approvals, Payment Auto-Sync, Reports, and Scheduler):

```bash
# Run server tests
cd server
npm test
```

---

## 📂 Project Structure

```
SmartInvoice/
├── client/                     # React + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── approvals/      # ApprovalQueue, ApprovalActionDialog, DelegationManager
│   │   │   ├── dashboard/      # KpiCard, WalletCards, AreaChartCard, DonutChartCard, BarChartCard
│   │   │   ├── invoices/       # InvoiceList, InvoiceFormModal, InvoiceDetailModal, StepperTimeline, DuplicateAlertBanner, BulkImportModal, RecurringTemplateModal
│   │   │   ├── layout/         # Navbar, CommandPalette, NotificationDropdown, AppLayout
│   │   │   ├── payments/       # RecordPaymentModal, PaymentLedger
│   │   │   ├── profile/        # ProfileModal (TOTP 2FA setup)
│   │   │   ├── ui/             # Radix UI primitives & theme controls
│   │   │   └── vendors/        # VendorModal, VendorProfile360
│   │   ├── context/            # AuthContext (with role switching), ThemeContext
│   │   ├── pages/              # DashboardPage, InvoicesPage, ApprovalsPage, VendorsPage, PaymentsPage, ReportsPage, AuditLogsPage, SettingsPage, LoginPage, RegisterPage
│   │   ├── lib/                # api client, types, formatters
│   │   ├── App.tsx             # React Router routing configuration
│   │   └── main.tsx
│   └── vite.config.ts
├── server/                     # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/             # Database connection with Memory Server fallback
│   │   ├── controllers/        # Auth, Invoices, Vendors, Approvals, Payments, Reports, AuditLogs, Settings
│   │   ├── middleware/         # JWT Auth, RBAC, Zod Validate, AuditLogger, Multer Upload, ErrorHandler
│   │   ├── models/             # Organization, User, Vendor, Invoice, Approval, ApprovalDelegation, Payment, Notification, AuditLog, Setting, RecurringTemplate
│   │   ├── routes/             # Modular REST routers
│   │   ├── schemas/            # Zod request validation schemas
│   │   ├── scripts/            # Seed script (54 invoices, 20 vendors, 11 users)
│   │   ├── services/           # DuplicateDetector, ApprovalEngine, EmailService, ReminderScheduler
│   │   ├── swagger/            # OpenAPI 3.0 spec definition
│   │   ├── tests/              # Vitest comprehensive integration test suite
│   │   ├── app.ts              # Express application setup
│   │   └── server.ts           # Server bootstrap & cron initializer
├── docker-compose.yml          # Multi-container orchestration
└── package.json                # Root concurrent scripts
```

---

## 📜 License & Acknowledgements

Developed as a modern Full-Stack Development (FSD) project demonstrating state-of-the-art enterprise B2B SaaS architecture, multi-tier financial governance, and fintech user experience design.
