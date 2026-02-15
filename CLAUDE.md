# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive, admin-only ERP (Enterprise Resource Planning) system built with Next.js. It features integrated modules for CRM, Finance, SCM/Inventory, HR, Project Management, Sales, and Manufacturing, all organized into a professional logical hub architecture.

## Commands

```bash
# Development
npm run dev          # Start Next.js dev server on port 3000
npm run build        # Build for production
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking (tsc --noEmit)

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema changes to database
npx prisma studio    # Open Prisma Studio
```

## Architecture

### Tech Stack
- **Framework**: Next.js 13.5.1 with App Router (RSC)
- **Database**: PostgreSQL with Prisma ORM + Accelerate
- **Authentication**: JWT-based custom auth (lib/auth/session.ts)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Charts**: Recharts

### Logical Organization (Hubs)

The system is organized into 4 primary logical areas in the sidebar:

1.  **CORE**: Dashboard & **Master Data Hub** (Centralized brain for Products, Vendors, Customers).
2.  **OPERATIONS**: Sales Hub (Lead-to-Cash), Operations Hub (Projects), Procurement (Purchases), HR & Teams.
3.  **FINANCE**: Consolidated Finance Hub (Entries, Banking, AR/AP, Compliance).
4.  **SYSTEM**: Unified System Hub (Company Profile, Identity/Roles, Health).

### Directory Structure

```
app/
  (auth)/           # Auth routes (login, register) - no layout
  (admin)/admin/    # Admin logical hubs
    masters/        # Master Data Hub (brain of system)
    sales/          # Reorganized sales lifecycle
    operations/     # Project & Manufacturing hub
    finance/        # Consolidated Finance hub
    settings/       # Unified System Hub (Company, Identity, Health)
    purchases/      # Procurement hub
    hr/             # HR & Payroll hub
  api/              # Domain-organized API routes
components/
  finance/          # Finance module sub-components
  sales/            # Sales lifecycle components
  layout/           # Sidebar, Nav, Shell
  ui/               # shadcn base components
```

## Module Implementation Status

| Module | Status | Key Features |
|--------|--------|--------------|
| **Purchase Orders** | 100% | PO creation, line items, status workflow, listing & detail pages |
| **Purchase Bills** | 100% | Bill creation from PO, line items, status workflow |
| **GRN** | 100% | Goods receipt, Inventory integration, PO link |
| **Vendor Payments** | 100% | Payment recording, Bill status update, GL Transaction |
| **Sales Lifecycle** | 100% | Leads -> Opps -> Quotes -> Orders -> Invoices workflow |
| **Operations Hub** | 100% | Projects -> Procurement -> Inventory -> Manufacturing flow |
| **Finance Hub** | 100% | Grouped logical clusters (Daily, Revenue, Expenses, Compliance) |
| **System Hub** | 100% | Unified Company, Identity, and Master Data control |

### Recently Fixed (2026-02-15)

1. **Client Portal Removal** - Eliminated all client-facing routes (`app/(client)`) and filtered API logic, converting the platform into a purely administrative enterprise suite.
2. **System & Organization Cleanup** - Final professional structure implemented:
   - **Unified System Hub**: Merged Company, Users & Roles, and Settings into a single Control Center (`/admin/settings`).
   - **Master Data Hub**: Created a centralized dashboard for core business records (Products, Vendors, Customers, Staff) at `/admin/masters`.
   - **Sidebar Reorganization**: Grouped navigation into logical categories (CORE, OPERATIONS, FINANCE, SYSTEM).
3. **Global Hub Reorganization** - Logical workflows implemented across all major modules:
   - **Sales Hub**: Implemented Lead-to-Cash flow (Leads -> Opps -> Quotes -> Orders -> Invoices).
   - **Operations Hub**: Implemented Project Lifecycle flow (Planning -> Procurement -> Inventory -> Manufacturing -> Execution).
   - **Finance Hub**: Grouped 14 flat tabs into logical clusters with sub-tabs.
4. **Strategic Control Center** - Implemented a dynamic, high-density Project Workspace that adapts to the company's business type (Manufacturing, Service, Trading) with professional visual telemetry.
5. **Procure-to-Pay Workflow** - Fully implemented and connected: Request -> Order -> Receipt (GRN) -> Bill -> Payment.
