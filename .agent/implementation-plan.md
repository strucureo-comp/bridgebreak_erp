# BridgeBreak ERP - Full Restructure Implementation Plan

## Current State Analysis

### What Already Exists (Well):
- **Prisma Schema**: ~1950 lines covering User, Project, Invoice, HR (Employee, Attendance, Leave, Payroll, SalaryStructure), CRM (Lead, CustomerAccount, Opportunity, Contact, Activity), SCM (Product, Warehouse, Inventory), Finance (Account/COA, JournalEntry, Budget, BudgetControl, ApprovalWorkflow), Sales (Quote, SalesOrder, PriceList), Manufacturing (BOM, ProductionOrder), Purchase (PurchaseRequest, PurchaseOrder, GRN, VendorBill), Banking, Credit/Debit Notes, Stock Journal, Fixed Assets
- **Finance Hub**: 14 sub-modules implemented as tabs (cash-flow, receivables, payables, credit-notes, debit-notes, banking, assets, stock-journal, controls, reconciliation, GL, reports, budgeting, tax-center)
- **HR Module**: Employee management with attendance, leave, payroll
- **Sales Module**: Leads, customers, opportunities, quotes, orders
- **API Routes**: Extensive API layer under /api/admin/
- **Dashboard**: Admin command center with KPIs and quick access grid

### What Needs to Be Built/Restructured:

## Phase 1: Subscription & Tenant Setup (SaaS Core)
1. **Prisma Schema Additions**:
   - `Tenant` model (company details, business type, industry, country, currency, tax regime)
   - `SubscriptionPlan` model (trial/monthly/yearly, feature access)
   - `Subscription` model (tenant-plan link, status, billing dates)
   - Add `tenant_id` to User model
   
2. **Company Setup Pages**:
   - `/admin/company` - Company profile page (name, type, industry, country, currency)
   - Setup wizard flow (onboarding)

## Phase 2: Navigation Restructure (Match Spec Menu)
Reorganize sidebar to match the 9-module structure:
1. Dashboard
2. Company  
3. Users & Roles
4. Finance
5. Sales
6. Operations
7. HR
8. Reports
9. Settings

## Phase 3: Module Dependency Logic
- Subscription check → Company setup check → Finance setup check → Role creation → Module access
- Middleware/guards for module access

## Phase 4: Missing Sub-modules
- Sales Returns
- Delivery management
- Service business operations (tasks, timesheet, expenses, service completion)
- Comprehensive reporting/CEO dashboard

---

## IMPLEMENTATION ORDER (This Session):
1. ✅ Navigation restructure → 9-module menu (Dashboard, Company, Users & Roles, Finance, Sales, Operations, HR, Reports, Settings) with section headers
2. ✅ Company setup page → Profile, branches, financial year, tax structure, approval hierarchy (tabs)
3. ✅ Users & Roles page → User list with search/filter, 6 role definitions, granular permission matrix
4. ✅ CEO Dashboard → Top KPIs (Revenue/Profit/Expenses/Cash), secondary metrics, department tabs (Finance/Sales/Operations/HR)
5. ✅ Operations module → Service flow + Trading/Manufacturing flow, projects, tasks, procurement, inventory, vendors
6. ✅ Reports module → Financial, Sales, Operations, HR reports with CEO dashboard banner
7. ✅ Fixed client dashboard missing 'use client' directive (pre-existing bug)
8. ✅ Sales hub rebuild → Overview (activities + top deal + quick links), Pipeline (stage breakdown + deals), Invoices tab (KPIs + list links), Quotes & Orders. Links to /admin/invoices, /admin/quotations, /admin/sales/leads, /admin/sales/customers
9. ✅ Operations deep-linking → Projects, Procurement, Inventory tabs now link to full pages (/admin/projects, /admin/purchases, /admin/inventory, /admin/manufacturing). No legacy pages orphaned.
10. ✅ Finance Hub UI refresh → Consistent header (icon + title), compact tab design with icons for key tabs, cleaner pill layout matching new module system
11. ✅ HR module UI refresh → Updated header with icon badge, tab styling changed from indigo-600 to primary color for design consistency
12. ✅ Settings page full rebuild → 5 functional tabs: General (company info, preferences, localization), Notifications (email toggles, SMTP config), Security (auth settings, audit log), Integrations (6 third-party cards), System (architecture, health, maintenance)

## Next Steps (Future Sessions):
- Prisma schema additions (Tenant, SubscriptionPlan, Subscription models)
- Module dependency logic (subscription → company → finance → roles → module access)
- Sales Returns & Delivery management sub-modules
- Service completion workflow
- Integration of real data into Company/Users pages (currently using mock data)
- Permission middleware/guards for role-based module access
- Backend integration for Settings page (save to database)

