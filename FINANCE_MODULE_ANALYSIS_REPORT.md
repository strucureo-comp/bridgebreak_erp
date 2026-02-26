# 📊 Finance Module — Comprehensive Component Analysis Report
**Project:** BridgeBreak ERP  
**Path:** `app/(admin)/admin/finance/`  
**Report Generated:** 26 February 2026  
**Total Pages Analysed:** 13  

---

## 1. Module Map (Navigation Tree)

```
/admin/finance                     ← Finance Hub (Dashboard / Entry Point)
├── /ledger                        ← General Ledger
├── /banking                       ← Bank & Treasury
├── /receivables                   ← Accounts Receivable
├── /payables                      ← Accounts Payable
├── /inventory                     ← Inventory Accounting
├── /assets                        ← Fixed Assets
├── /taxes                         ← Tax Center
├── /intercompany                  ← Intercompany Accounting
├── /reports                       ← Financial Reporting
├── /multi-currency                ← Multi-Currency Management
├── /period-close                  ← Period Close & Governance
├── /approvals                     ← Approval Engine
└── /settings                      ← Redirect → /admin/settings
```

---

## 2. Hub Hub (`/admin/finance/page.tsx`)

### Role
Entry point. Acts as a navigation dashboard that loads live KPI data and renders module cards.

### Key Components / Elements

| Component | Type | Description |
|---|---|---|
| `DashboardShell` | Shared Layout | Wraps page; passes `requireAdmin` guard |
| `ModuleGuard` | Auth Guard | `module="finance"` permission check |
| `MiniKpi` | Local Component | Small KPI card with optional delta + alert states |
| Module Grid | UI | 12 module cards rendered from `MODULES` constant array |
| Hub Header | UI | Title, currency code badge, period label, period status badge |

### Data Flow
- `getFinanceHubSummary()` is called via `useEffect` on mount.
- Result is merged into `kpi` state (revenue, expenses, netIncome, cashPosition, receivables, payables, taxLiability, etc.).
- Loading skeleton shown while fetching (`animate-pulse`).

### KPI Strip
6 KPIs displayed: Revenue YTD, Expenses YTD, Net Income, Cash Position, Receivables, Payables.

### Hooks Used
- `useTenant()` → `getModuleLabel('finance')`
- `useCurrency()` → `format`, `currencyCode`

### Issues / Observations
- `MODULES` `stats` array is always `[]` — no per-module stats populate the hub cards.
- No error handling on `getFinanceHubSummary()` failure.
- `MiniKpi` supports `delta` and `positive` props — these are **never passed** from the hub page (improvement opportunity).

---

## 3. General Ledger (`/ledger/page.tsx`)

### Role
Accounting core — Chart of Accounts, Journal Entries, Trial Balance.

### Tabs
| Tab | Content |
|---|---|
| Chart of Accounts | Searchable table of 25 GL accounts |
| Journal Entries | List of 6 mock journals (posted + draft) |
| Trial Balance | Auto-computed from COA balances; balanced check |

### Local Components
| Component | Props | Description |
|---|---|---|
| `MiniKpi` | label, value, alert | KPI card with alert styling |
| `TypeBadge` | type | Color-coded account type pill (Asset/Liability/Equity/Revenue/Expense) |
| `StatusBadge` | status | posted/draft/void badge |
| `JournalTypeBadge` | type | Standard/Recurring/Reversal badge |

### Data
- **COA:** 25 accounts (mock constant), covering 1000s–7100s range.
- **Journals:** 6 entries (4 posted, 2 draft).
- **Trial Balance:** Derived from COA via map; Debit/Credit auto-split.

### Hooks Used
- `useCurrency()` → `format`
- `useMemo` for search filtering

### Issues / Observations
- COA "Add Account" button has **no dialog/form** — it's a stub.
- Journal "New Journal Entry" button is also a **stub** (no form).
- No backend API calls — all data is hardcoded mock constants.
- Trial Balance balance check works correctly (`trialDebit === trialCredit`).

---

## 4. Bank & Treasury (`/banking/page.tsx`)

### Role
Manage bank accounts and cash movements.

### Key Components
| Component | Type | Description |
|---|---|---|
| `AccountForm` | Local | Dialog form to add bank/cash/credit accounts |
| `TransactionForm` | Local | Dialog form to record deposit/withdrawal movements |
| KPI Cards | UI | Total Balance, Accounts count, Transactions count |

### Data Flow
- `getBankAccounts()` → sets `accounts` state
- `getBankTransactions()` → sets `transactions` state
- Both fetched in parallel via `Promise.all`.
- Auth guard: only fetches if `user?.role === 'admin'`.

### Hooks Used
- `useAuth()` → `user`
- `useCurrency()` → `format`
- `useMemo` for search filtering

### Forms
**AccountForm:** name, bank_name, account_number, type (bank/cash/credit), opening_balance  
**TransactionForm:** account selector, direction toggle (In/Out), amount, description

### Issues / Observations
- Missing `Link` back-nav to `/admin/finance` hub (unlike all other sub-pages).
- Header style inconsistency — uses a different layout from all other finance pages.
- `isMounted` guard returns null before hydration (SSR safety pattern).
- No backend-linked error state displayed to user on fetch failure.

---

## 5. Accounts Receivable (`/receivables/page.tsx`)

### Role
Customer-side money management — outstanding invoices, aging, credit notes.

### Tabs
| Tab | Content |
|---|---|
| Customer Ledger | 5 mock customers with credit limits, balances, overdue, risk rating |
| Open Invoices | 7 invoices (draft, sent, partial, overdue, paid) |
| Credit Notes | 2 applied credit notes |
| Aging Report | Visual bar chart across 5 buckets |

### Local Components
| Component | Props | Description |
|---|---|---|
| `SmallKpi` | label, value, alert, warn | KPI card |
| `RiskBadge` | risk (low/medium/high) | Color-coded risk pill |
| `InvStatusBadge` | status | paid/sent/draft/overdue/partial badge |

### Data
All data is **hardcoded mock** (no API calls).  
5 customers: Al Futtaim, Dubai Holdings, Emaar, ADNOC, Etisalat  
Aging buckets: Current, 1-30, 31-60, 61-90, 90+

### Issues / Observations
- No CRUD — cannot add/edit customers or invoices.
- Aging visual chart uses relative bar heights (% of total receivable) — good UX choice.
- 2 overdue invoices totalling AED 75,200 are flagged correctly.

---

## 6. Accounts Payable (`/payables/page.tsx`)

### Role
Vendor-side money tracking — bills, approvals, payment runs.

### Tabs
| Tab | Content |
|---|---|
| Vendor Ledger | 5 mock vendors with balances, terms, risk |
| Bills & Approvals | 6 bills with approval progress (0/2, 1/2, 2/2) |
| Aging Report | Visual bar chart across 5 buckets |
| Payment Runs | Stub — "Start Payment Run" placeholder button |

### Local Components
| Component | Props | Description |
|---|---|---|
| `Kpi` | label, value, alert, warn | KPI card |

### Data
All data is **hardcoded mock** (no API calls).  
5 vendors: Al Ghurair, XYZ Logistics, AWS, Dubai Municipality, ABC Legal

### Issues / Observations
- Payment Runs tab is **not implemented** — stub card with no functionality.
- Approval progress display (0/2, 1/2, 2/2 pattern) is a good visual pattern.
- 2 overdue bills, 1 pending approval flagged correctly.
- No CRUD — cannot add vendors or bills.

---

## 7. Inventory Accounting (`/inventory/page.tsx`)

### Role
Financial side of inventory — valuation, COGS recognition, stock adjustments.

### Tabs
| Tab | Content |
|---|---|
| Valuation | 6 SKUs with quantity, unit cost, total value, costing method |
| COGS | 4 COGS entries linked to sales orders |
| Adjustments | 3 stock adjustments (Damage, Count, Transfer) |

### Local Components
| Component | Props | Description |
|---|---|---|
| `Kpi` | label, value | Simple KPI card |

### Data
All data is **hardcoded mock** (no API calls).  
Items: Steel plates, pipes, flanges, electrodes, H-beams, prefab panels.  
Costing methods: FIFO, WAC, Standard Cost.

### Issues / Observations
- No backend integration — entirely static mock data.
- Total inventory value: AED 399,350 across 6 SKUs.
- COGS total (period): AED 47,050.

---

## 8. Fixed Assets (`/assets/page.tsx`)

### Role
Asset register, depreciation schedules, disposal tracking.

### Tabs
| Tab | Content |
|---|---|
| Asset Register | 7 assets (6 active, 1 disposed) with cost/accumulated dep/NBV |
| Depreciation Schedule | Monthly schedule by category for Q1 2026 |
| Disposals | Disposed assets with gain/loss |

### Local Components
| Component | Props | Description |
|---|---|---|
| `Kpi` | label, value | Simple KPI card |

### Data
All data is **hardcoded mock** (no API calls).  
Assets: CNC laser, Overhead crane, Warehouse, Truck, Furniture, IT Server, Old Welder (disposed).  
Depreciation methods: Straight Line (SL), Reducing Balance (RB).

### KPI Summary
- Gross Cost: AED 2,320,000
- Accumulated Depreciation: AED 402,000
- Net Book Value: AED 1,918,000
- Monthly Depreciation: AED 14,208

### Issues / Observations
- Monthly dep schedule shows only 3 months (Jan–Mar 2026) — not a full year.
- "Run Depreciation" button has no action wired.
- Gain/Loss on disposals is hardcoded to `fmt(0)` — not computed.

---

## 9. Tax Center (`/taxes/page.tsx`) ← **Most Complex Module**

### Role
Full tax lifecycle — jurisdictions, tax codes, filing periods, adjustments, compliance controls.

### Tabs (6)
| Tab | Content |
|---|---|
| Jurisdictions | CRUD cards per country (VAT/GST/Sales Tax) |
| Tax Codes | Filterable table — rate, GL mapping, recoverability, dates |
| Filing Periods | Period list with payable/receivable/net; file/lock workflow |
| Adjustments | Correction/Credit Note/Bad Debt/Reclassification journal |
| Filing Controls | 3 lock switches: post-filing lock, VAT freeze, adjustment-only mode |
| JE Logic | Reference journal entry examples for VAT scenarios |

### Local Components
| Component | Props | Description |
|---|---|---|
| `Kpi` | label, value, alert, warn | KPI card |
| `TaxTypeBadge` | type | output/input/reverse_charge/withholding/zero_rated/exempt badge |
| `FilingBadge` | status | open/filed/locked badge with lock icon |

### Dialogs (4)
| Dialog | Fields |
|---|---|
| Add/Edit Jurisdiction | Country, Tax System, TRN, Reporting Period, Filing Method, Authority |
| Add/Edit Tax Code | Code, Description, Jurisdiction, Type, Rate, GL Payable, GL Receivable, Recoverable%, Effective Date, Expiry, Auto-Self-Account toggle |
| Add Filing Period | Jurisdiction, Period Name, Start/End/Due dates, Output/Input tax amounts |
| Add Adjustment | Date, Type, Period, Description, Amount, JE Reference |

### API Integration
**Full CRUD via backend API:**
- `getTaxJurisdictions`, `createTaxJurisdiction`, `updateTaxJurisdiction`, `deleteTaxJurisdiction`
- `getTaxCodes`, `createTaxCode`, `updateTaxCode`, `deleteTaxCode`
- `getFilingPeriods`, `createFilingPeriod`, `toggleFilingPeriodStatus`
- `getTaxAdjustments`, `createTaxAdjustment`, `postTaxAdjustment`, `deleteTaxAdjustment`

### Supported Countries (15)
AE, SA, US, GB, IN, DE, FR, SG, AU, CA, KW, QA, BH, OM, EG

### Issues / Observations
- Tax lock switches (line 85-87) are local state only — **not persisted to backend**.
- `normalize()` function (maps `_id` → `id`): good defensive pattern for MongoDB.
- Filing period status workflow: open → filed → locked (one-way via toggle).
- JE Logic tab is read-only reference material — excellent for onboarding.
- Most complete module with real API integration (10 API functions).

---

## 10. Intercompany (`/intercompany/page.tsx`)

### Role
Multi-entity accounting — intercompany balances, settlement, and consolidation eliminations.

### Tabs
| Tab | Content |
|---|---|
| Entities | 3 entity cards (Parent + 2 Subsidiaries) |
| IC Balances | 3 IC transactions across UAE/KSA/India |
| Eliminations | 3 elimination entries (2 applied, 1 pending) |

### Local Components
| Component | Props | Description |
|---|---|---|
| `Kpi` | label, value, alert | Simple KPI card |

### Data
All data is **hardcoded mock** (no API calls).  
Entities: System Steel UAE (Parent), KSA, India (Subsidiaries).

### Issues / Observations
- No CRUD — cannot create IC transactions or new eliminations.
- 2 unsettled IC balances (AED 185K, SAR 28K) flagged via header badge.
- Pending elimination entry ELIM-003 (AED 320K) not actioned — needs workflow.

---

## 11. Financial Reporting (`/reports/page.tsx`)

### Role
Structured financial statements — Balance Sheet, P&L, Cash Flow, Budget vs Actual.

### Tabs
| Tab | Report | Period |
|---|---|---|
| Balance Sheet | Assets / Liabilities / Equity | As at 28 Feb 2026 |
| Income Statement | Revenue / Direct Costs / OPEX / Net Income | YTD |
| Cash Flow | Operating / Investing / Financing | YTD |
| Budget vs Actual | By department with utilization bar | YTD |

### Local Components
| Component | Props | Description |
|---|---|---|
| `SectionHeader` | title | Section divider row |
| `LineItem` | name, value, negative | Individual line item row |
| `TotalLine` | label, value, highlight | Subtotal/total row with optional red highlight |

### Key Numbers (Mock)
- Total Revenue: AED 2,828,000
- Net Income: AED 1,877,500 (calculated from IS data)
- Total Assets: AED 3,767,000
- Total Balance: Liabilities + Equity = AED 3,767,000 ✓ (balances correctly)

### Issues / Observations
- All data is **hardcoded mock** (no API calls).
- "Export PDF" button has **no action** wired.
- No date range picker — reports are fixed to a single hardcoded period.
- Budget vs Actual shows Sales & Marketing over budget by AED 25,000.

---

## 12. Multi-Currency (`/multi-currency/page.tsx`)

### Role
FX rate display, currency exposure tracking, revaluation journal log.

### Tabs
| Tab | Content |
|---|---|
| Exchange Rates | Live rate table for 6 tracked currencies vs base |
| Currency Exposure | Per-currency receivable, payable, net exposure |
| FX Revaluation | Log of posted revaluation entries |

### Local Components
| Component | Props | Description |
|---|---|---|
| `Kpi` | label, value, alert | KPI card |

### Data
- Static `TRACKED_CURRENCIES`: AED, USD, EUR, GBP, SAR, INR
- `MOCK_FX_RATES` imported from `@/lib/currency`
- Historical FX, Exposure, Revaluation entries: hardcoded constants

### Hooks Used
- `useCurrency()` → `format`, `currencyCode` (base currency)

### Issues / Observations
- "Refresh Rates" button fires `toast.success('FX rates refreshed')` but does **not actually refresh** rates.
- Rates displayed as "Live" badge — these are mock rates only.
- Base currency drives the "Rate vs {baseCurrency}" column dynamically — good.
- Total Exposure: AED 283,500. Net FX Impact YTD: AED 3,650.

---

## 13. Period Close & Governance (`/period-close/page.tsx`)

### Role
Month-end close checklist, fiscal period status management, audit log.

### Tabs
| Tab | Content |
|---|---|
| Month-End Checklist | 12 tasks with done/pending state; category and assignee |
| Fiscal Periods | 5 periods (P07–P11) with status: open/closed/locked |
| Audit Log | 7 system/user actions with timestamp, action, detail, module |

### KPI Strip
Current Period, Checklist Progress (progress bar), Open Items count, Audit Event count.

### Data
All data is **hardcoded mock** (no API calls).  
Checklist completion: 7/12 (58%) — 5 tasks still pending.  
Current period: P11 (Feb 2026) — Open.

### Issues / Observations
- Checklist items are **not interactive** — cannot check/uncheck them.
- "Close Period" button fires `toast.info('Complete all checklist items before closing')` — **no actual close logic**.
- Audit log shows good variety of modules (GL, AR, AP, FX, FA, Period).

---

## 14. Approval Engine (`/approvals/page.tsx`)

### Role
Document-level approval workflow builder with role-based conditions and Segregation of Duties.

### Tabs
| Tab | Content |
|---|---|
| Workflows | CRUD workflows per document type; conditions + staged approvals |
| Roles & Permissions | Functional roles table (7 roles with scope and level) |
| Segregation of Duties | SoD rules with risk level + enforce toggle |
| Condition Fields | Reference table of 10 available condition dimensions |

### Local Components
| Component | Props | Description |
|---|---|---|
| `Kpi` | label, value, alert | KPI card |
| `LevelBadge` | level | operational/specialist/control/executive pill |

### Dialogs
| Dialog | Fields |
|---|---|
| Add/Edit Workflow | Name, Document Type, Conditions (IF rules), Approval Stages (THEN), Auto-Reject toggle |
| Add SoD Rule | Rule description, Applies To, Risk Level |

### API Integration
**Full CRUD via backend API:**
- `getApprovalWorkflowsV2`, `createApprovalWorkflowV2`, `updateApprovalWorkflowV2`, `toggleApprovalWorkflowV2`, `deleteApprovalWorkflowV2`
- `getSodRules`, `createSodRule`, `toggleSodRule`, `deleteSodRule`

### Document Types (9)
Vendor Bill, Payment Run, Journal Entry, Credit Note, Customer Refund, Asset Disposal, IC Journal, Expense Claim, Tax Adjustment

### Role Options (13)
AP/AR Accountant, Tax Officer, Treasury Officer, Cost Accountant, Financial Controller, CFO, various Approver levels

### Workflow Builder Logic
- Supports multi-condition filtering (IF field operator value)
- Supports multi-stage approvals (THEN: role, sequential/parallel, escalation hours)
- Auto-reject N days feature

### Issues / Observations
- Well-architected — condition + stage model supports sophisticated routing.
- Roles tab shows system roles only (non-editable) — good design.
- Condition fields tab is reference-only, well-documented.

---

## 15. Finance Settings (`/settings/page.tsx`)

This page is a **redirect-only shim** — it immediately redirects to `/admin/settings`. All fiscal/tax settings are managed in the global Settings page under "Tax & Fiscal".

---

## 16. Cross-Cutting Patterns

### Shared UI Patterns (consistent across all pages)
| Pattern | Description |
|---|---|
| `DashboardShell` | Wraps all pages, handles admin auth |
| `useCurrency()` | `format` + `currencyCode` used uniformly |
| KPI strip cards | All pages have 4–6 KPI cards at top |
| Tabbed layout | `Tabs/TabsList/TabsTrigger/TabsContent` from shadcn |
| Table header row | `grid grid-cols-12` with `bg-muted/50 text-[10px]` header |
| Hover rows | `hover:bg-muted/30 transition-colors` on all table rows |
| Back button | `ChevronLeft` ghost button linking back to hub |
| Module icon | `h-9 w-9 rounded-lg bg-red-50 text-red-600` icon wrapper |
| Red accent | `bg-red-600 hover:bg-red-700` primary action buttons |
| `toast` (sonner) | All success/error notifications via sonner |

### Local Helper Component Pattern
Every page defines its own `Kpi`/`MiniKpi`/`SmallKpi` component inline at the bottom. These are **functionally identical across pages** — a prime candidate for a shared component.

### Inline `normalize()` Pattern
Both `taxes/page.tsx` and `approvals/page.tsx` define the same `normalize` function:
```ts
const normalize = (item: any): any => ({ ...item, id: item._id || item.id });
```
This should be extracted to a shared lib utility.

---

## 17. API Integration Summary

| Module | API Connected | CRUD Level |
|---|---|---|
| Finance Hub | ✅ `getFinanceHubSummary` | Read only |
| General Ledger | ❌ Mock constants | None |
| Banking | ✅ CRUD | Full (Create + Read) |
| Receivables | ❌ Mock constants | None |
| Payables | ❌ Mock constants | None |
| Inventory | ❌ Mock constants | None |
| Fixed Assets | ❌ Mock constants | None |
| **Tax Center** | ✅ Full CRUD | **10 API functions** |
| Intercompany | ❌ Mock constants | None |
| Financial Reporting | ❌ Mock constants | None |
| Multi-Currency | ❌ Mock constants + lib | Read only (mock) |
| Period Close | ❌ Mock constants | None |
| **Approval Engine** | ✅ Full CRUD | **8 API functions** |

---

## 18. Identified Issues & Improvement Opportunities

### 🔴 Critical / Functional Gaps

| # | Page | Issue |
|---|---|---|
| 1 | `period-close` | Checklist items not interactive — cannot mark tasks complete |
| 2 | `period-close` | "Close Period" button has no actual close logic |
| 3 | `ledger` | "Add Account" and "New Journal Entry" are stubs (no forms) |
| 4 | `multi-currency` | "Refresh Rates" does not actually refresh — just shows toast |
| 5 | `reports` | "Export PDF" button has no action |
| 6 | `payables` | Payment Runs tab is entirely a placeholder |

### 🟡 Design / Architecture Improvements

| # | Issue | Recommendation |
|---|---|---|
| 7 | Duplicate `Kpi` component | Extract to `@/components/finance/KpiCard` |
| 8 | Duplicate `normalize()` | Move to `@/lib/utils.ts` |
| 9 | Banking page missing back nav | Add `Link href="/admin/finance"` back button |
| 10 | Mock data in most pages | Integrate remaining 7 pages with backend APIs |
| 11 | Tax lock switches not persisted | Wire to settings API or tax config endpoint |
| 12 | `MODULES` stats always `[]` | Populate from `getFinanceHubSummary` response |
| 13 | No error states | Add `try/catch` + error UI for all API-connected pages |
| 14 | Fixed report dates | Add date range picker to Financial Reporting page |
| 15 | Fixed depreciation schedule (3 months) | Calculate dynamically or load from API |

### 🟢 Well-Implemented

| # | What's Good |
|---|---|
| 1 | Tax Center — most complete, full CRUD with 10 API endpoints |
| 2 | Approval Engine — sophisticated workflow builder with conditions + stages |
| 3 | Consistent visual language across all 13 pages |
| 4 | Multi-currency base currency awareness throughout |
| 5 | Loading states in banking page (`Loader2` spinner) |
| 6 | Trial Balance balance check (Debit = Credit validation) |
| 7 | Tax JE Logic reference tab — excellent educational content |
| 8 | Aging chart with visual bar proportionality |
| 9 | Period status workflow (open → filed → locked) is enforced |
| 10 | SoD risk rating (critical/high/medium) with color coding |

---

## 19. Component Inventory (Inline Local Components)

| Component | Pages Defined In | Function |
|---|---|---|
| `MiniKpi` | `finance/page.tsx`, `ledger/page.tsx` | KPI display card |
| `Kpi` | `taxes/`, `approvals/`, `payables/`, `inventory/`, `assets/`, `intercompany/`, `multi-currency/` | KPI display card |
| `SmallKpi` | `receivables/` | KPI display card |
| `TypeBadge` | `ledger/` | Account type color pill |
| `StatusBadge` | `ledger/` | Posted/draft/void badge |
| `JournalTypeBadge` | `ledger/` | Standard/Recurring/Reversal badge |
| `TaxTypeBadge` | `taxes/` | Tax type color pill |
| `FilingBadge` | `taxes/` | Filing status badge |
| `RiskBadge` | `receivables/` | Low/medium/high risk pill |
| `InvStatusBadge` | `receivables/` | Invoice status badge |
| `LevelBadge` | `approvals/` | Role level badge |
| `SectionHeader` | `reports/` | Report section divider |
| `LineItem` | `reports/` | Report line item row |
| `TotalLine` | `reports/` | Report total/subtotal row |
| `AccountForm` | `banking/` | Bank account create form |
| `TransactionForm` | `banking/` | Bank transaction create form |

---

## 20. File Sizes & Complexity Reference

| File | Lines | Bytes | Complexity |
|---|---|---|---|
| `taxes/page.tsx` | 673 | 48,157 | ⭐⭐⭐⭐⭐ Highest |
| `approvals/page.tsx` | 585 | 42,708 | ⭐⭐⭐⭐⭐ |
| `banking/page.tsx` | 381 | 17,958 | ⭐⭐⭐ |
| `reports/page.tsx` | 226 | 15,639 | ⭐⭐ |
| `finance/page.tsx` (hub) | 225 | 11,428 | ⭐⭐ |
| `receivables/page.tsx` | 204 | 15,179 | ⭐⭐ |
| `period-close/page.tsx` | 192 | 14,175 | ⭐⭐ |
| `ledger/page.tsx` | 272 | 22,537 | ⭐⭐⭐ |
| `inventory/page.tsx` | 161 | 12,458 | ⭐⭐ |
| `assets/page.tsx` | 154 | 12,516 | ⭐⭐ |
| `multi-currency/page.tsx` | 161 | 12,280 | ⭐⭐ |
| `payables/page.tsx` | 172 | 12,983 | ⭐⭐ |
| `intercompany/page.tsx` | 141 | 10,084 | ⭐⭐ |
| `settings/page.tsx` | 20 | 510 | ⭐ Redirect only |

**Total:** ~3,571 lines of TSX across 14 files

---

*Report generated by full static analysis of all finance module source files.*
✅ Admin Finance Assets Page Refactored
- Redesigned Fixed Assets module to meet IFRS/GAAP standards. Added comprehensive `Asset` type definition including core accounting tracking (salvage, cap date, GL codes) and operational tracking (location, custodian). Enhanced UI features separated into tabs for Asset Master, Depreciation Engine, Disposal Workflow, and Audit Log, utilizing custom sub-components. Built a robust mock depreciation engine that considers salvage limits and methods.
