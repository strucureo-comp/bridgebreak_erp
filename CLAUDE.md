# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive ERP (Enterprise Resource Planning) system built with Next.js, featuring modules for CRM, Finance, SCM/Inventory, HR, Project Management, Sales, and Manufacturing. It follows a Dynamics 365-inspired architecture with double-entry accounting, approval workflows, and budget controls.

## Commands

```bash
# Development
npm run dev          # Start Next.js dev server on port 3000
npm run build        # Build for production (ignores ESLint/TypeScript errors per next.config.js)
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking (tsc --noEmit)

# Database
npx prisma generate  # Generate Prisma client (outputs to prisma/generated/client)
npx prisma db push   # Push schema changes to database
npx prisma studio    # Open Prisma Studio

# Tax Data Setup
# 1. Copy .env.example.tax to .env and add APILAYER_API_KEY
# 2. POST http://localhost:3000/api/admin/tax-management?action=run-job
# 3. Verify: GET http://localhost:3000/api/settings/tax-data
```

## Architecture

### Tech Stack
- **Framework**: Next.js 13.5.1 with App Router (RSC)
- **Database**: PostgreSQL with Prisma ORM + Accelerate extension
- **Authentication**: JWT-based custom auth (lib/auth/session.ts)
- **Styling**: Tailwind CSS + shadcn/ui components
- **UI Components**: Radix UI primitives via shadcn/ui
- **Charts**: Recharts
- **PDF Generation**: html2canvas + jspdf

### Directory Structure

```
app/
  (auth)/           # Auth routes (login, register) - no layout
  (admin)/admin/    # Admin dashboard routes
  (client)/         # Client portal routes
  api/              # API routes organized by domain
    auth/           # Login, register, logout, me
    admin/          # Admin-only endpoints
      finance/      # Accounting, journals, reports, budgets
      scm/          # Products, warehouses, inventory
      hr/           # Employees, payroll, attendance
      sales/        # Quotes, orders, pricelists
      projects/     # Timesheets, expenses, scheduling
      manufacturing/# BOMs, production orders
    crm/            # Leads, customers, opportunities
    purchases/      # Purchase requests, orders, GRNs, bills
    banking/        # Bank accounts, transactions
components/
  ui/               # shadcn/ui base components
  admin/            # Admin-specific components
  finance/          # Finance module components
  hr/               # HR module components
  sales/            # Sales module components
  projects/         # Project module components
  manufacturing/    # Manufacturing components
  layout/           # Layout components (sidebar, header, nav)
lib/
  prisma.ts         # Prisma client singleton with Accelerate
  auth/session.ts   # JWT session management
  api.ts            # Frontend API client functions
  db/types.ts       # TypeScript types matching Prisma schema
  accounting-engines/  # Multi-engine accounting (Dynamics 365, Tally, Zoho)
  finance/          # Finance-specific utilities
  services/         # Background services (tax collection, email)
prisma/
  schema.prisma     # Database schema
  generated/client  # Generated Prisma client (custom output path)
```

### Route Groups
- `(auth)` - Routes without layout (login/register pages)
- `(admin)` - Admin dashboard with full navigation
- `(client)` - Client portal with limited navigation

### Key Architectural Patterns

**Authentication**: JWT tokens stored in HTTP-only cookies (`token`). Session retrieved via `getServerSession()` in lib/auth/session.ts. Role-based access (admin/client) via `UserRole` enum.

**Database Access**: Always use the singleton `prisma` from lib/prisma.ts. Uses Prisma Accelerate for connection pooling. Generated client is at `prisma/generated/client` (not `@prisma/client`).

**API Pattern**: API routes follow consistent structure:
- GET /api/{domain} - List with optional filters
- POST /api/{domain} - Create
- GET /api/{domain}/[id] - Get single
- PATCH /api/{domain}/[id] - Update
- DELETE /api/{domain}/[id] - Delete

**Frontend Data Fetching**: Use functions from lib/api.ts for all API calls. These handle credentials, error parsing, and type safety.

**Accounting Engine**: Multi-engine architecture in lib/accounting-engines/ supports:
- Dynamics 365 Finance (primary)
- Tally (via adapter)
- Zoho Books
Engines implement common interface for GL entries, depreciation, and reporting.

**Module Integration**: Projects serve as the central hub connecting to CRM, Inventory, HR, and Finance via JSON node-based data (labour_data, inventory_data, etc.) and relational data.

## Critical Implementation Details

**Prisma Schema**: Uses custom output path `prisma/generated/client`. Must run `npx prisma generate` after schema changes. Uses `@prisma/extension-accelerate` for edge compatibility.

**Posting Status**: Financial documents (invoices, bills, journal entries) have a `posting_status` (draft/posted/voided). Only posted documents affect GL balances.

**Approval Workflows**: Configurable in `approval_workflows` table. Triggers for invoices, bills, journal entries, and purchase orders based on amount thresholds.

**Budget Controls**: Account-period combinations can have spending limits with warn/block actions.

**Tax Data**: APILayer integration for global VAT rates. Background job runs automatically if `TAX_AUTO_COLLECT_STARTUP=true`.

**Invoice Generation**: Uses html2canvas + jspdf for PDF generation with QR codes for payment.

## Environment Variables

```bash
DATABASE_URL=postgresql://...  # Prisma connection string
JWT_SECRET=...                 # For token signing
APILAYER_API_KEY=...           # Tax data API
TAX_AUTO_COLLECT_STARTUP=true  # Auto-run tax collection
TAX_COLLECTION_INTERVAL_DAYS=10
CRON_SECRET=...                # For external cron triggers
```

## shadcn/ui Configuration

Components use the default style with CSS variables. Aliases configured in components.json:
- `@/components` → components
- `@/components/ui` → shadcn components
- `@/lib` → lib
- `@/hooks` → hooks

Add new shadcn components with: `npx shadcn add <component-name>`

## Module Implementation Status

| Module | Status | Key Features | API Routes | UI Components |
|--------|--------|--------------|------------|---------------|
| **Purchase Orders** | 100% | PO creation, line items, status workflow, listing & detail pages | `/api/purchases/orders/*` | `app/(admin)/admin/purchases/page.tsx`, `orders/[id]/page.tsx`, `new/page.tsx` |
| **Purchase Bills (Payables)** | 100% | Bill creation, line items, PO link, status workflow | `/api/purchases/bills/*` | `purchases/page.tsx`, `bills/new/page.tsx` |
| **GRN** | 100% | Goods receipt, Inventory integration, PO link | `/api/purchases/grns/*` | `grns/new/page.tsx`, `purchases/page.tsx` |
| **Vendor Payments** | 100% | Payment recording, Bill status update, GL Transaction | `/api/purchases/payments/*` | `payments/new/page.tsx`, `purchases/page.tsx` |
| **Vendor Payments** | 60% | Basic payment recording | `/api/purchases/payments/*` | Needs UI integration |
| **Credit Notes** | 95% | Customer returns, GL posting, invoice application | `/api/admin/finance/credit-notes/*` | `credit-notes-content.tsx` |
| **Debit Notes** | 95% | Vendor returns/chargebacks, GL posting, bill application | `/api/admin/finance/debit-notes/*` | `debit-notes-content.tsx` |
| **Stock Journal** | 90% | Inventory adjustments with GL posting, cost tracking | `/api/admin/scm/stock-journal/*` | `stock-journal-content.tsx` |
| **Banking** | 85% | Accounts, transactions, GL categorization | `/api/banking/*` | `banking-content.tsx` |
| **Journal Entries** | 90% | Full GL with budget checks, balance validation | `/api/admin/finance/journals/*` | `journal-content.tsx` |
| **Receivables** | 90% | Invoicing with tax, GL posting | `/api/admin/finance/receivables/*` | `receivables-content.tsx` |
| **Fixed Assets** | 80% | Assets, depreciation schedules, posting | `/api/admin/finance/assets/*` | `assets-content.tsx` |
| **Budget & Approvals** | 80% | Budget controls, approval workflows | `/api/admin/finance/*` | Integrated in forms |

### Recently Fixed (2026-02-15)

1. **Global Hub Reorganization** - Logical workflows implemented across all major modules:
   - **Sales Hub**: Implemented Lead-to-Cash flow (Leads -> Opps -> Quotes -> Orders -> Invoices).
   - **Operations Hub**: Implemented Project Lifecycle flow (Planning -> Procurement -> Inventory -> Manufacturing -> Execution).
   - **Finance Hub**: Grouped 14 flat tabs into logical clusters (Daily, Revenue, Expenses, Assets, Compliance) with sub-tabs.
   - **System Hub**: Consolidated Settings, Company, and Master Data into a unified Control Center.

2. **Procurement Workflow Logic** - Fully connected:
   - Reordered `purchases/page.tsx` tabs to match lifecycle (Request -> Order -> Receipt -> Bill -> Payment).
   - Created `bills/new/page.tsx` for converting POs to Bills.
   - Added "Create PO", "Create Bill", and "Pay Bill" action buttons to respective lists.

2. **Vendor Payments & Bills** - Fully implemented:
   - Created `app/(admin)/admin/purchases/payments/new/page.tsx` for recording payments.
   - Updated `app/api/purchases/bills/route.ts` to support line items and PO status updates.
   - Updated `app/api/purchases/payments/route.ts` to handle bill status updates (paid/partial) and GL transactions.
   - Added "Bills" and "Payments" tabs to the main Purchases dashboard.

2. **GRN Module (Inventory Receipt)** - Fully implemented:
   - Created `app/(admin)/admin/purchases/grns/new/page.tsx` for receiving goods against a PO.
   - Updated `app/api/purchases/grns/route.ts` to handle inventory transactions (stock increase) and PO status updates.
   - Added "Receipts" tab to `purchases/page.tsx`.
   - Linked "Mark as Received" in PO detail to the new GRN workflow.

2. **Purchase Orders Module** - Fully implemented:
   - Updated `app/(admin)/admin/purchases/page.tsx` with full listing for Orders, Vendors, and Requests.
   - Implemented `app/(admin)/admin/purchases/orders/[id]/page.tsx` for PO details with line items.
   - Implemented `app/(admin)/admin/purchases/new/page.tsx` with a dynamic form for PO creation.
   - Updated `app/api/purchases/orders/route.ts` to support atomic creation of PO and lines using Prisma transactions.
   - Added `app/api/purchases/orders/[id]/route.ts` for individual PO management (GET, PATCH, DELETE).
   - Added `getPurchaseOrder` helper to `lib/api.ts`.

### Recently Fixed (2026-02-10)

1. **Credit Notes Module** - Fully implemented:
   - Database schema with `CreditNote`, `CreditNoteLine`, `CreditNoteApplication` models
   - Complete API: list, create, update, delete, post to GL, apply to invoices
   - GL posting reduces AR and Revenue
   - Frontend API functions added to `lib/api.ts`

2. **Debit Notes Module** - Fully implemented:
   - Database schema with `DebitNote`, `DebitNoteLine`, `DebitNoteApplication` models
   - Complete API: list, create, update, delete, post to GL, apply to vendor bills
   - GL posting reduces AP and Expense
   - Frontend API functions added to `lib/api.ts`

3. **Stock Journal Module** - Implemented:
   - Database schema with `StockJournal`, `StockJournalLine`, `StockJournalGLEntry` models
   - Supports adjustment, transfer, count, damage, obsolete, revaluation types
   - FIFO, LIFO, Weighted Average, Standard Cost valuation methods
   - GL posting for inventory value changes
   - Frontend API functions added to `lib/api.ts`

4. **Purchase Order Lines** - Schema updated:
   - Added `PurchaseOrderLine` model for line-item level details
   - Supports tax, quantities, unit prices

5. **Vendor API** - Fixed field naming:
   - Updated to use `country_code`, `tax_id`, `tax_exempt` fields
   - Removed deprecated `vat_no` field usage

6. **UI Components Created** (2026-02-10):
   - `credit-notes-content.tsx` - Full credit note management with line items, posting, and invoice application
   - `debit-notes-content.tsx` - Full debit note management with line items, posting, and bill application
   - `stock-journal-content.tsx` - Inventory journal with 6 types (adjustment, transfer, count, damage, obsolete, revaluation) and 4 valuation methods
   - All components integrated into Finance Hub with tabs

## Finance Hub Component Analysis (2026-02-10)

### All 14 Finance Components - VERIFIED NEEDED

| Component | Purpose | Distinct Value |
|-----------|---------|----------------|
| **Cash Flow** | Overview dashboard with charts, profit score | High-level financial health |
| **Receivables** | Customer invoices with line items, tax | AR management, customer billing |
| **Payables** | Vendor bills with line items, tax | AP management, vendor payments |
| **Credit Notes** | Customer refunds/returns | Reduces AR, applies to invoices |
| **Debit Notes** | Vendor chargebacks | Reduces AP, applies to bills |
| **Banking** | Bank accounts, transaction recording | Cash management, bank feeds |
| **Fixed Assets** | Asset register, depreciation | Asset lifecycle, book value |
| **Stock Journal** | Inventory GL adjustments | Cost tracking, valuation methods |
| **Controls** | Approval workflows + spending limits | Enforcement (warn/block) |
| **Reconciliation** | Bank-to-system matching | Verify bank vs ledger |
| **General Ledger** | Chart of accounts, manual journals | Core accounting, COA management |
| **Reports** | P&L, Balance Sheet, Trial Balance | Financial statements |
| **Budgeting** | Budget setting, variance tracking | Planning vs actuals |
| **Tax Center** | Global tax calculator (150+ countries) | Multi-jurisdiction compliance |

### Clarifications on "Duplicates"

**Budgeting vs Controls** - NOT duplicates:
- Budgeting = Planning tool (set targets, track variance)
- Controls = Enforcement tool (spending limits with warn/block actions)

**Cash Flow vs Reconciliation** - Different purposes:
- Cash Flow = Income/expense tracking for P&L
- Reconciliation = Matching bank transactions to ledger

### Cleanup Completed

- [x] Removed debug "Test API" button from `cash-flow-content.tsx`
- [x] Verified all 14 components serve distinct purposes
- [x] No unneeded components to remove

### Next Steps

- Purchase Order listing and detail pages with line items
- GRN management UI with three-way matching (PO-GRN-Bill reconciliation)
- Vendor Payments UI integration
- Purchase Request workflow integration
- Apply database schema changes: `npx prisma db push`
