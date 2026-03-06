# Module 5: Sales & CRM

## Overview
Customer relationship management including leads, opportunities, customers, and sales orders.

## Frontend Pages
- **Location**: `app/(admin)/admin/sales/`
- **Sub-modules**:
  - `leads/` - Lead management
  - `opportunities/` - Opportunity pipeline
  - `customers/` - Customer management
  - `enquiries/` - Customer enquiries
  - `partners/` - Partner management
  - `activities/` - Activity tracking
  - `sales-orders/` - Sales order management

## Backend Routes
- **Location**: `backend/routes/crm.js`
- **Endpoints**:
  - `GET /api/crm/leads` - List leads
  - `POST /api/crm/leads` - Create lead
  - `PUT /api/crm/leads/:id` - Update lead
  - `DELETE /api/crm/leads/:id` - Delete lead
  - `GET /api/crm/opportunities` - List opportunities
  - `POST /api/crm/opportunities` - Create opportunity
  - `PUT /api/crm/opportunities/:id` - Update opportunity
  - `DELETE /api/crm/opportunities/:id` - Delete opportunity
  - `GET /api/crm/customers` - List customers
  - `POST /api/crm/customers` - Create customer
  - `PUT /api/crm/customers/:id` - Update customer
  - `DELETE /api/crm/customers/:id` - Delete customer
  - `GET /api/crm/activities` - List activities
  - `POST /api/crm/activities` - Create activity
  - `GET /api/crm/sales-orders` - List sales orders
  - `POST /api/crm/sales-orders` - Create sales order

## Data Models

### Lead
```javascript
Lead {
  lead_id: String (unique)
  name: String
  email: String
  phone: String
  company: String
  industry: String
  status: 'new' | 'contacted' | 'qualified' | 'lost' | 'converted'
  source: 'website' | 'referral' | 'cold_call' | 'event' | 'other'
  assigned_to: String (user email)
  value: Number (estimated deal value)
  notes: String
  createdAt, updatedAt: Date
}
```

### Opportunity
```javascript
Opportunity {
  opportunity_id: String (unique)
  lead_id: ObjectId → Lead
  name: String
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  probability: Number (0-100)
  value: Number (deal value)
  expected_close_date: Date
  assigned_to: String (user email)
  notes: String
  createdAt, updatedAt: Date
}
```

### Customer
```javascript
Customer {
  customer_id: String (unique)
  name: String
  email: String
  phone: String
  billing_address: String
  shipping_address: String
  credit_limit: Number
  payment_terms: String
  status: 'active' | 'inactive' | 'suspended'
  customer_type: 'individual' | 'business'
  tax_id: String
  createdAt, updatedAt: Date
}
```

### Activity
```javascript
Activity {
  activity_id: String (unique)
  type: 'call' | 'email' | 'meeting' | 'task' | 'note'
  entity_type: 'lead' | 'opportunity' | 'customer'
  entity_id: ObjectId
  subject: String
  description: String
  due_date: Date
  assigned_to: String
  status: 'pending' | 'completed' | 'cancelled'
  createdAt, updatedAt: Date
}
```

### SalesOrder
```javascript
SalesOrder {
  order_number: String (unique)
  customer_id: ObjectId → Customer
  status: 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  items: [{sku, quantity, unit_price, tax_rate, amount}]
  subtotal: Number
  tax_amount: Number
  total: Number
  delivery_date: Date
  notes: String
  createdAt, updatedAt: Date
}
```

## API Functions (lib/api.ts)
```typescript
// Leads
getLeads() → Lead[]
createLead(data) → Lead | null
updateLead(id, data) → boolean
deleteLead(id) → boolean

// Opportunities
getOpportunities() → Opportunity[]
createOpportunity(data) → Opportunity | null
updateOpportunity(id, data) → boolean
deleteOpportunity(id) → boolean
getOpportunity(id) → Opportunity | null

// Customers
getCustomers() → Customer[]
createCustomer(data) → Customer | null
updateCustomer(id, data) → boolean
deleteCustomer(id) → boolean

// Activities
getActivities() → Activity[]
createActivity(data) → Activity | null
getActivitiesByEntity(type, id) → Activity[]

// Sales Orders
getSalesOrders() → SalesOrder[]
createSalesOrder(data) → SalesOrder | null

// Quotations
getQuotations() → Quotation[]
createQuotation(data) → Quotation | null
updateQuotation(id, data) → boolean
deleteQuotation(id) → boolean
getQuotation(id) → Quotation | null
```

## Connections to Other Modules

### ↔ Finance Module
- **Trigger**: Sales order confirmation
- **Action**: Creates invoice and AR record
- **Data Flow**:
  - Sales order confirmed
  - Invoice generated
  - AR account updated
  - Revenue recognized
  - Customer payment tracked

### ↔ Inventory Module
- **Trigger**: Sales order fulfillment
- **Action**: Issues goods to customer
- **Data Flow**:
  - Sales order created
  - Stock allocated
  - Goods issued (stock balance decremented)
  - COGS recognized in Finance
  - Revenue recognized

### ↔ Receivables Module
- **Trigger**: Invoice creation from sales order
- **Action**: Tracks customer payments
- **Data Flow**:
  - Sales order → Invoice
  - Invoice posted to AR
  - Customer payment recorded
  - AR reconciliation

### ↔ Projects Module
- **Trigger**: Project-based sales
- **Action**: Links sales to project
- **Data Flow**:
  - Sales order linked to project
  - Revenue tracked per project
  - Project profitability calculated

## Key Workflows

### Lead Management
1. Lead created (new prospect)
2. Assigned to sales representative
3. Contact attempts recorded
4. Lead qualified or lost
5. Converted to opportunity or archived

### Opportunity Pipeline
1. Lead converted to opportunity
2. Moved through sales stages
3. Probability and value updated
4. Expected close date tracked
5. Won or lost
6. Won opportunities converted to customer

### Customer Onboarding
1. Opportunity won
2. Customer record created
3. Credit limit set
4. Payment terms configured
5. Billing/shipping addresses stored
6. Customer activated

### Sales Order Processing
1. Customer places order
2. Sales order created
3. Items and quantities specified
4. Pricing and tax calculated
5. Order confirmed
6. Inventory allocated
7. Goods shipped
8. Invoice generated
9. Payment tracked

### Activity Tracking
1. Activities logged (calls, emails, meetings)
2. Linked to leads/opportunities/customers
3. Due dates set
4. Assigned to team members
5. Status tracked
6. Completed or cancelled

## Module Access
- **Default**: Enabled for all business types
- **Role**: Sales Manager, Sales Representative
- **Setup**: Customer master setup recommended

## Real-time Features
- Lead scoring
- Opportunity pipeline tracking
- Activity management
- Customer communication history
- Sales forecasting
- Activity reminders

## Integration Points
- Finance for invoice generation
- Inventory for stock allocation
- Receivables for payment tracking
- Projects for project-based sales
- Operations for resource allocation
