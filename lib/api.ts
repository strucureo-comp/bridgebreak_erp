import { Project, Invoice, User, SupportRequest, MeetingRequest, Quotation, Enquiry, Lead, PlanningNote, Transaction, SystemSettings, TeamMember, CustomerAccount, Opportunity, Activity } from '@/lib/db/types';

// Helper to fetch from API
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { signal, ...rest } = options;
  const method = (rest.method || 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (method === 'GET') {
    headers['Cache-Control'] = 'no-cache';
    headers.Pragma = 'no-cache';
  }

  const res = await fetch(`/api${endpoint}`, {
    ...rest,
    cache: rest.cache ?? (method === 'GET' ? 'no-store' : undefined),
    signal,
    credentials: 'include',
    headers,
  });
  if (!res.ok) {
    let errorMessage = `API Request Failed: ${res.status}`;
    try {
      const error = await res.json();
      if (error && error.error) {
        errorMessage = error.error;
      }
    } catch (e) {
      // If parsing fails, use status text
      if (res.statusText) errorMessage += ` ${res.statusText}`;
    }
    console.error('[API Error]', errorMessage);
    throw new Error(errorMessage);
  }
  return res.json();
}

// --- Projects ---
export async function getProjects(options?: RequestInit): Promise<Project[]> {
  return fetchApi<Project[]>('/projects', options);
}

export async function getProject(id: string, options?: RequestInit): Promise<Project | null> {
  try {
    return await fetchApi<Project>(`/projects/${id}`, options);
  } catch {
    return null;
  }
}

export async function createProject(data: any, options?: RequestInit): Promise<string> {
  const res = await fetchApi<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
  return res.id;
}

export async function updateProject(id: string, data: any, options?: RequestInit): Promise<boolean> {
  await fetchApi(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    ...options
  });
  return true;
}

// --- Users ---
export async function getUsers(options?: RequestInit): Promise<User[]> {
  return fetchApi<User[]>('/users', options);
}

export async function getUser(id: string, options?: RequestInit): Promise<User | null> {
  // We don't have a specific /users/:id route yet, but /users returns all for admin.
  // Or we can assume getUsers has loaded it.
  // For now return null or implement if needed.
  return null;
}

// --- Invoices ---
export async function getInvoices(options?: RequestInit): Promise<Invoice[]> {
  return fetchApi<Invoice[]>('/invoices', options);
}

export async function getInvoice(id: string, options?: RequestInit): Promise<Invoice | null> {
  try {
    return await fetchApi<Invoice>(`/invoices/${id}`, options);
  } catch {
    return null;
  }
}

export async function createInvoice(data: any, options?: RequestInit): Promise<string> {
  const res = await fetchApi<Invoice>('/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
  return res.id;
}

export async function updateInvoice(id: string, data: any, options?: RequestInit): Promise<boolean> {
  await fetchApi(`/invoices/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    ...options
  });
  return true;
}

export async function deleteInvoice(id: string, options?: RequestInit): Promise<boolean> {
  await fetchApi(`/invoices/${id}`, { method: 'DELETE', ...options });
  return true;
}

// --- Support ---
export async function getSupportRequests(options?: RequestInit): Promise<SupportRequest[]> {
  return fetchApi<SupportRequest[]>('/support', options);
}

export async function getSupportRequest(id: string, options?: RequestInit): Promise<SupportRequest | null> {
  try {
    return await fetchApi<SupportRequest>(`/support/${id}`, options);
  } catch {
    return null;
  }
}

export async function createSupportRequest(data: any, options?: RequestInit): Promise<string> {
  const res = await fetchApi<SupportRequest>('/support', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
  return res.id;
}

export async function updateSupportRequest(id: string, data: any, options?: RequestInit): Promise<boolean> {
  await fetchApi(`/support/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    ...options
  });
  return true;
}

// --- Meetings ---
export async function getMeetings(options?: RequestInit): Promise<MeetingRequest[]> {
  return fetchApi<MeetingRequest[]>('/meetings', options);
}

export async function getMeeting(id: string, options?: RequestInit): Promise<MeetingRequest | null> {
  try {
    return await fetchApi<MeetingRequest>(`/meetings/${id}`, options);
  } catch {
    return null;
  }
}

export async function createMeetingRequest(data: any, options?: RequestInit): Promise<string> {
  const res = await fetchApi<MeetingRequest>('/meetings', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
  return res.id;
}

export async function updateMeeting(id: string, data: any, options?: RequestInit): Promise<boolean> {
  await fetchApi(`/meetings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    ...options
  });
  return true;
}

// --- Team ---
export async function getTeamMembers(options?: RequestInit): Promise<TeamMember[]> { return []; }

// --- HR ---
import { Employee, Attendance, LabourAllocation, Payroll } from '@/lib/db/types';

export async function getEmployees(options?: RequestInit): Promise<Employee[]> {
  return fetchApi<Employee[]>('/hr/employees', options);
}

export async function createEmployee(data: any, options?: RequestInit): Promise<Employee> {
  return fetchApi<Employee>('/hr/employees', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function getAttendance(date?: string, options?: RequestInit): Promise<Attendance[]> {
  const query = date ? `?date=${date}` : '';
  return fetchApi<Attendance[]>(`/hr/attendance${query}`, options);
}

export async function markAttendance(data: any, options?: RequestInit): Promise<Attendance> {
  return fetchApi<Attendance>('/hr/attendance', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function getPayrolls(options?: RequestInit): Promise<Payroll[]> {
  return fetchApi<Payroll[]>('/hr/payroll', options);
}

export async function generatePayroll(month: string, options?: RequestInit): Promise<Payroll> {
  return fetchApi<Payroll>('/hr/payroll', {
    method: 'POST',
    body: JSON.stringify({ month }),
    ...options
  });
}

export async function getLabourAllocations(options?: RequestInit): Promise<LabourAllocation[]> {
  return fetchApi<LabourAllocation[]>('/hr/allocation', options);
}

export async function allocateLabour(data: any, options?: RequestInit): Promise<LabourAllocation> {
  return fetchApi<LabourAllocation>('/hr/allocation', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

// --- Inventory ---
// --- SCM: Products & Inventory ---
import { Product, Warehouse, InventoryTransaction, Location } from '@/lib/db/types';

export async function getProducts(search?: string, options?: RequestInit): Promise<Product[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return fetchApi<Product[]>(`/admin/scm/products${query}`, options);
}

export async function createProduct(data: any, options?: RequestInit): Promise<Product> {
  return fetchApi<Product>('/admin/scm/products', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function getWarehouses(options?: RequestInit): Promise<Warehouse[]> {
  return fetchApi<Warehouse[]>('/admin/scm/warehouses', options);
}

export async function createWarehouse(data: any, options?: RequestInit): Promise<Warehouse> {
  return fetchApi<Warehouse>('/admin/scm/warehouses', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function getInventoryTransactions(variantId?: string, locationId?: string, options?: RequestInit): Promise<InventoryTransaction[]> {
  const params = new URLSearchParams();
  if (variantId) params.append('variant_id', variantId);
  if (locationId) params.append('location_id', locationId);

  return fetchApi<InventoryTransaction[]>(`/admin/scm/inventory?${params.toString()}`, options);
}

export async function createInventoryTransaction(data: any, options?: RequestInit): Promise<InventoryTransaction> {
  return fetchApi<InventoryTransaction>('/admin/scm/inventory', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

// --- Banking ---
import { BankAccount, BankTransaction } from '@/lib/db/types';

export async function getBankAccounts(options?: RequestInit): Promise<BankAccount[]> {
  return fetchApi<BankAccount[]>('/banking/accounts', options);
}

export async function createBankAccount(data: any, options?: RequestInit): Promise<BankAccount> {
  return fetchApi<BankAccount>('/banking/accounts', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function getBankTransactions(options?: RequestInit): Promise<BankTransaction[]> {
  return fetchApi<BankTransaction[]>('/banking/transactions', options);
}

export async function createBankTransaction(data: any, options?: RequestInit): Promise<BankTransaction> {
  return fetchApi<BankTransaction>('/banking/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

// --- Finance ---
export async function getTransactions(options?: RequestInit): Promise<Transaction[]> {
  return fetchApi<Transaction[]>('/transactions', options);
}

export async function createTransaction(data: any, options?: RequestInit): Promise<string> {
  const res = await fetchApi<Transaction>('/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
  return res.id;
}

export async function deleteTransaction(id: string, options?: RequestInit): Promise<boolean> {
  await fetchApi(`/transactions/${id}`, { method: 'DELETE', ...options });
  return true;
}

// --- Dynamics 365 Finance ---
export async function getAccounts(options?: RequestInit) {
  return fetchApi('/admin/finance/accounts', options);
}

export async function createAccount(data: any, options?: RequestInit) {
  return fetchApi('/admin/finance/accounts', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function getJournalEntries(options?: RequestInit) {
  return fetchApi('/admin/finance/journals', options);
}

export async function createJournalEntry(data: any, options?: RequestInit) {
  return fetchApi('/admin/finance/journals', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function getFinancialReport(type: 'pnl' | 'bs' | 'tb', options?: RequestInit): Promise<any> {
  return fetchApi<any>(`/admin/finance/reports?type=${type}`, options);
}

export async function getBudgets() {
  return fetchApi('/admin/finance/budget');
}

export async function saveBudget(data: any) {
  return fetchApi('/admin/finance/budget', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getSystemSetting(key: string, options?: RequestInit): Promise<any> {
  try {
    return await fetchApi<any>(`/settings/${key}`, options);
  } catch {
    return null;
  }
}

export async function setSystemSetting(key: string, value: any, options?: RequestInit): Promise<boolean> {
  await fetchApi(`/settings/${key}`, {
    method: 'POST',
    body: JSON.stringify(value),
    ...options
  });
  return true;
}

// --- Reconciliation ---

export async function getUnreconciledTransactions(options?: RequestInit): Promise<{ bankTransactions: any[], systemTransactions: any[] }> {
  return fetchApi<{ bankTransactions: any[], systemTransactions: any[] }>('/admin/finance/reconciliation', options);
}

export async function reconcileTransaction(bankTxId: string, systemTxId: string, options?: RequestInit): Promise<boolean> {
  await fetchApi('/admin/finance/reconciliation', {
    method: 'POST',
    body: JSON.stringify({ bank_transaction_id: bankTxId, system_transaction_id: systemTxId }),
    ...options
  });
  return true;
}

// --- Tax Data (APILayer) ---

export interface TaxData {
  country_code: string;
  country_name: string;
  vat_rate: number;
  standard_rate: number;
  reduced_rates: number[];
  super_reduced_rate?: number;
  parking_rate?: number;
  zero_rate?: boolean;
  reverse_charge_applicable: boolean;
  last_updated: string;
  applies_from: string;
  notes?: string;
}

export interface PriceConversionData {
  country_code: string;
  base_amount: number;
  base_currency: string;
  vat_amount: number;
  total_with_vat: number;
  vat_rate: number;
  conversion_date: string;
}

/** Get tax data for specific country */
export async function getTaxDataForCountry(countryCode: string, options?: RequestInit): Promise<TaxData | null> {
  try {
    const res = await fetchApi<{ data: TaxData }>(`/settings/tax-data?action=country&country=${countryCode}`, options);
    return res.data;
  } catch {
    return null;
  }
}

/** Get all available countries with tax data */
export async function getAllTaxCountries(options?: RequestInit): Promise<Array<{ code: string; name: string; vatRate: number }>> {
  try {
    const res = await fetchApi<{ countries: Array<{ code: string; name: string; vatRate: number }> }>(
      `/settings/tax-data?action=countries`,
      options
    );
    return res.countries;
  } catch {
    return [];
  }
}

/** Calculate price with VAT for a country */
export async function calculatePriceWithVAT(
  countryCode: string,
  amount: number,
  currency: string = 'USD',
  options?: RequestInit
): Promise<PriceConversionData | null> {
  try {
    const res = await fetchApi<{ calculation: PriceConversionData }>(`/settings/tax-data?action=calculate-vat`, {
      method: 'POST',
      body: JSON.stringify({ countryCode, amount, currency }),
      ...options
    });
    return res.calculation;
  } catch {
    return null;
  }
}

/** Validate VAT number */
export async function validateVATNumber(vatNumber: string, options?: RequestInit): Promise<{ valid: boolean; country: string | null }> {
  try {
    return await fetchApi<{ valid: boolean; country: string | null }>(`/settings/tax-data?action=validate-vat`, {
      method: 'POST',
      body: JSON.stringify({ vatNumber }),
      ...options
    });
  } catch {
    return { valid: false, country: null };
  }
}

/** Get tax database status and statistics */
export async function getTaxDatabaseStatus(options?: RequestInit): Promise<{
  status: string;
  lastSync: string;
  totalCountries: number;
  collectionStatus: string;
}> {
  try {
    return await fetchApi<{
      status: string;
      lastSync: string;
      totalCountries: number;
      collectionStatus: string;
    }>(`/settings/tax-data`, options);
  } catch {
    return {
      status: 'error',
      lastSync: '',
      totalCountries: 0,
      collectionStatus: 'unknown',
    };
  }
}

/** Trigger manual tax data collection (admin only) */
export async function triggerTaxDataCollection(options?: RequestInit): Promise<{
  message: string;
  result: {
    timestamp: string;
    status: 'success' | 'failed';
    countriesCollected: number;
    errors: number;
    message: string;
    executionTimeMs: number;
  };
}> {
  try {
    return await fetchApi(`/admin/tax-management?action=run-job`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer admin-token', // Update with actual token
      },
      ...options
    });
  } catch (error) {
    throw new Error(`Failed to trigger tax data collection: ${error}`);
  }
}

/** Get tax collection job history (admin only) */
export async function getTaxJobHistory(options?: RequestInit): Promise<
  Array<{
    timestamp: string;
    status: 'success' | 'failed';
    countriesCollected: number;
    errors: number;
    message: string;
    executionTimeMs: number;
  }>
> {
  try {
    const res = await fetchApi<{
      jobHistory: Array<{
        timestamp: string;
        status: 'success' | 'failed';
        countriesCollected: number;
        errors: number;
        message: string;
        executionTimeMs: number;
      }>;
    }>(`/admin/tax-management?resource=job-history`, options);
    return res.jobHistory;
  } catch {
    return [];
  }
}

/** Get tax database statistics (admin only) */
export async function getTaxDatabaseStats(options?: RequestInit): Promise<{
  stats: {
    totalCountries: number;
    collectionDate: string;
    lastSync: string;
    status: string;
    averageVATRate: number;
    minVATRate: number;
    maxVATRate: number;
  } | null;
}> {
  try {
    return await fetchApi<{
      stats: {
        totalCountries: number;
        collectionDate: string;
        lastSync: string;
        status: string;
        averageVATRate: number;
        minVATRate: number;
        maxVATRate: number;
      };
    }>(`/admin/tax-management?resource=database-stats`, options);
  } catch {
    return { stats: null };
  }
}

// --- Purchases ---
import { PurchaseRequest, Vendor, PurchaseOrder, GRN, VendorBill, VendorPayment } from '@/lib/db/types';

export async function getPurchaseRequests(options?: RequestInit): Promise<PurchaseRequest[]> {
  return fetchApi<PurchaseRequest[]>('/purchases/requests', options);
}

export async function createPurchaseRequest(data: any, options?: RequestInit): Promise<PurchaseRequest> {
  return fetchApi<PurchaseRequest>('/purchases/requests', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function getVendors(options?: RequestInit): Promise<Vendor[]> {
  return fetchApi<Vendor[]>('/purchases/vendors', options);
}

export async function createVendor(data: any, options?: RequestInit): Promise<Vendor> {
  return fetchApi<Vendor>('/purchases/vendors', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function getPurchaseOrders(options?: RequestInit): Promise<PurchaseOrder[]> {
  return fetchApi<PurchaseOrder[]>('/purchases/orders', options);
}

export async function getPurchaseOrder(id: string, options?: RequestInit): Promise<PurchaseOrder | null> {
  try {
    return await fetchApi<PurchaseOrder>(`/purchases/orders/${id}`, options);
  } catch {
    return null;
  }
}

export async function createPurchaseOrder(data: any, options?: RequestInit): Promise<PurchaseOrder> {
  return fetchApi<PurchaseOrder>('/purchases/orders', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function runDepreciation(date: string, options?: RequestInit): Promise<any> {
  return fetchApi<any>('/admin/finance/assets/depreciate', {
    method: 'POST',
    body: JSON.stringify({ date }),
    ...options
  });
}

export async function getFixedAssets(options?: RequestInit): Promise<any[]> {
  return fetchApi<any[]>('/admin/finance/assets', options);
}

export async function createFixedAsset(data: any, options?: RequestInit): Promise<any> {
  return fetchApi<any>('/admin/finance/assets', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function getGRNs(options?: RequestInit): Promise<GRN[]> {
  return fetchApi<GRN[]>('/purchases/grns', options);
}

export async function createGRN(data: any, options?: RequestInit): Promise<GRN> {
  return fetchApi<GRN>('/purchases/grns', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function getVendorBills(options?: RequestInit): Promise<VendorBill[]> {
  return fetchApi<VendorBill[]>('/purchases/bills', options);
}

export async function createVendorBill(data: any, options?: RequestInit): Promise<VendorBill> {
  return fetchApi<VendorBill>('/purchases/bills', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function getVendorPayments(options?: RequestInit): Promise<VendorPayment[]> {
  return fetchApi<VendorPayment[]>('/purchases/payments', options);
}

export async function createVendorPayment(data: any, options?: RequestInit): Promise<VendorPayment> {
  return fetchApi<VendorPayment>('/purchases/payments', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

// --- Placeholders for unimplemented ---
export async function getQuotations(options?: RequestInit): Promise<Quotation[]> { return []; }
export async function getQuotation(id: string, options?: RequestInit): Promise<Quotation | null> { return null; }
export async function createQuotation(data: any, options?: RequestInit): Promise<string> { return 'id'; }
export async function updateQuotation(id: string, data: any, options?: RequestInit): Promise<boolean> { return true; }
export async function deleteQuotation(id: string, options?: RequestInit): Promise<boolean> { return true; }

export async function getEnquiries(options?: RequestInit): Promise<Enquiry[]> { return []; }
export async function createEnquiry(data: any, options?: RequestInit): Promise<string> { return 'id'; }
export async function updateEnquiry(id: string, data: any, options?: RequestInit): Promise<boolean> { return true; }

export async function getLeads(options?: RequestInit): Promise<Lead[]> {
  return fetchApi<Lead[]>('/crm/leads', options);
}

export async function createLead(data: any, options?: RequestInit): Promise<Lead> {
  return fetchApi<Lead>('/crm/leads', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function updateLead(id: string, data: any, options?: RequestInit): Promise<boolean> {
  await fetchApi(`/crm/leads/${id}`, { // Route needs to accept [id] if update is needed
    method: 'PATCH',
    body: JSON.stringify(data),
    ...options
  });
  return true;
}

// --- CRM: Customers ---
export async function getCustomers(search?: string, options?: RequestInit): Promise<CustomerAccount[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return fetchApi<CustomerAccount[]>(`/crm/customers${query}`, options);
}

export async function createCustomer(data: any, options?: RequestInit): Promise<CustomerAccount> {
  return fetchApi<CustomerAccount>('/crm/customers', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

// --- CRM: Opportunities ---
export async function getOpportunities(stage?: string, options?: RequestInit): Promise<Opportunity[]> {
  const query = stage ? `?stage=${stage}` : '';
  return fetchApi<Opportunity[]>(`/crm/opportunities${query}`, options);
}

export async function createOpportunity(data: any, options?: RequestInit): Promise<Opportunity> {
  return fetchApi<Opportunity>('/crm/opportunities', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

// --- CRM: Activities ---
export async function getActivities(entityType?: 'lead' | 'customer' | 'opportunity', entityId?: string, options?: RequestInit): Promise<Activity[]> {
  const query = entityType && entityId ? `?${entityType}Id=${entityId}` : '';
  return fetchApi<Activity[]>(`/crm/activities${query}`, options);
}

export async function createActivity(data: any, options?: RequestInit): Promise<Activity> {
  return fetchApi<Activity>('/crm/activities', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function getPlanningNotes(options?: RequestInit): Promise<PlanningNote[]> { return []; }
export async function createPlanningNote(data: any, options?: RequestInit): Promise<string> { return 'id'; }
export async function updatePlanningNote(id: string, data: any, options?: RequestInit): Promise<boolean> { return true; }
export async function deletePlanningNote(id: string, options?: RequestInit): Promise<boolean> { return true; }

// --- Advanced Controls ---

export async function getApprovalWorkflows(options?: RequestInit): Promise<any[]> {
  return fetchApi<any[]>('/admin/finance/approvals/config', options);
}

export async function createApprovalWorkflow(data: any, options?: RequestInit): Promise<any> {
  return fetchApi<any>('/admin/finance/approvals/config', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function getBudgetControls(period?: string, options?: RequestInit): Promise<any[]> {
  const query = period ? `?period=${period}` : '';
  return fetchApi<any[]>(`/admin/finance/budget/config${query}`, options);
}

export async function setBudgetControl(data: any, options?: RequestInit): Promise<any> {
  return fetchApi<any>('/admin/finance/budget/config', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

// --- Sales Operations ---

export async function getQuotes(options?: RequestInit): Promise<any[]> {
  return fetchApi<any[]>('/admin/sales/quotes', options);
}

export async function createQuote(data: any, options?: RequestInit): Promise<any> {
  return fetchApi<any>('/admin/sales/quotes', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function getSalesOrders(options?: RequestInit): Promise<any[]> {
  return fetchApi<any[]>('/admin/sales/orders', options);
}

export async function createSalesOrder(data: any, options?: RequestInit): Promise<any> {
  return fetchApi<any>('/admin/sales/orders', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

// --- Finance Operations (Payables & Receivables) ---

export async function getPayables(options?: RequestInit): Promise<VendorBill[]> {
  return fetchApi<VendorBill[]>('/admin/finance/payables', options);
}

export async function createPayable(data: any, options?: RequestInit): Promise<VendorBill> {
  return fetchApi<VendorBill>('/admin/finance/payables', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function getReceivables(options?: RequestInit): Promise<Invoice[]> {
  return fetchApi<Invoice[]>('/admin/finance/receivables', options);
}

export async function createReceivable(data: any, options?: RequestInit): Promise<Invoice> {
  return fetchApi<Invoice>('/admin/finance/receivables', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

// --- Project Operations ---

export async function submitTimesheet(data: any, options?: RequestInit): Promise<any> {
  return fetchApi<any>('/admin/projects/timesheets', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function approveTimesheet(id: string, status: 'approved' | 'rejected', options?: RequestInit): Promise<any> {
  return fetchApi<any>('/admin/projects/timesheets', {
    method: 'PUT',
    body: JSON.stringify({ id, status }),
    ...options
  });
}

export async function submitExpense(data: any, options?: RequestInit): Promise<any> {
  return fetchApi<any>('/admin/projects/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function approveExpense(id: string, status: 'approved' | 'rejected', options?: RequestInit): Promise<any> {
  return fetchApi<any>('/admin/projects/expenses', {
    method: 'PUT',
    body: JSON.stringify({ id, status }),
    ...options
  });
}

// --- Sales Operations (Part 2) ---

export async function getPriceLists(options?: RequestInit): Promise<any[]> {
  return fetchApi<any[]>('/admin/sales/pricelists', options);
}

export async function createPriceList(data: any, options?: RequestInit): Promise<any> {
  return fetchApi<any>('/admin/sales/pricelists', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

// --- Project Operations (Part 2) ---

export async function getResourceBookings(projectId?: string, userId?: string, options?: RequestInit): Promise<any[]> {
  const params = new URLSearchParams();
  if (projectId) params.append('projectId', projectId);
  if (userId) params.append('userId', userId);

  return fetchApi<any[]>(`/admin/projects/scheduling?${params.toString()}`, options);
}

export async function createResourceBooking(data: any, options?: RequestInit): Promise<any> {
  return fetchApi<any>('/admin/projects/scheduling', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

// --- HR (Phase 7) ---

export async function getPerformanceData(type: 'goals' | 'reviews', userId?: string, options?: RequestInit): Promise<any[]> {
  const params = new URLSearchParams();
  params.append('type', type);
  if (userId) params.append('userId', userId);
  return fetchApi<any[]>(`/admin/hr/performance?${params.toString()}`, options);
}

export async function createPerformanceItem(data: any, options?: RequestInit): Promise<any> {
  return fetchApi<any>('/admin/hr/performance', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

// --- HR Module (Full) ---

import type { HRDepartment, HRRole as HRRoleType, EmployeeDocument, LeaveType, Leave, Holiday, SalaryStructure, HREvent } from '@/lib/db/types';

export async function getDepartments(options?: RequestInit): Promise<HRDepartment[]> {
  return fetchApi<HRDepartment[]>('/hr/departments', options);
}

export async function createDepartment(data: any, options?: RequestInit): Promise<HRDepartment> {
  return fetchApi<HRDepartment>('/hr/departments', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function getHRRoles(options?: RequestInit): Promise<HRRoleType[]> {
  return fetchApi<HRRoleType[]>('/hr/roles', options);
}

export async function createHRRole(data: any, options?: RequestInit): Promise<HRRoleType> {
  return fetchApi<HRRoleType>('/hr/roles', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function getEmployeeDocuments(employeeId?: string, options?: RequestInit): Promise<EmployeeDocument[]> {
  const query = employeeId ? `?employee_id=${employeeId}` : '';
  return fetchApi<EmployeeDocument[]>(`/hr/documents${query}`, options);
}

export async function createEmployeeDocument(data: any, options?: RequestInit): Promise<EmployeeDocument> {
  return fetchApi<EmployeeDocument>('/hr/documents', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function getLeaveTypes(options?: RequestInit): Promise<LeaveType[]> {
  return fetchApi<LeaveType[]>('/hr/leave-types', options);
}

export async function createLeaveType(data: any, options?: RequestInit): Promise<LeaveType> {
  return fetchApi<LeaveType>('/hr/leave-types', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function getLeaves(filters?: { employee_id?: string; status?: string }, options?: RequestInit): Promise<Leave[]> {
  const params = new URLSearchParams();
  if (filters?.employee_id) params.append('employee_id', filters.employee_id);
  if (filters?.status) params.append('status', filters.status);
  const query = params.toString() ? `?${params.toString()}` : '';
  return fetchApi<Leave[]>(`/hr/leaves${query}`, options);
}

export async function applyLeave(data: any, options?: RequestInit): Promise<Leave> {
  return fetchApi<Leave>('/hr/leaves', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function updateLeaveStatus(id: string, status: string, remarks?: string, options?: RequestInit): Promise<Leave> {
  return fetchApi<Leave>('/hr/leaves', {
    method: 'PUT',
    body: JSON.stringify({ id, status, remarks }),
    ...options
  });
}

export async function getHolidays(options?: RequestInit): Promise<Holiday[]> {
  return fetchApi<Holiday[]>('/hr/holidays', options);
}

export async function createHoliday(data: any, options?: RequestInit): Promise<Holiday> {
  return fetchApi<Holiday>('/hr/holidays', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function getSalaryStructures(employeeId?: string, options?: RequestInit): Promise<SalaryStructure[]> {
  const query = employeeId ? `?employee_id=${employeeId}` : '';
  return fetchApi<SalaryStructure[]>(`/hr/salary-structure${query}`, options);
}

export async function createSalaryStructure(data: any, options?: RequestInit): Promise<SalaryStructure> {
  return fetchApi<SalaryStructure>('/hr/salary-structure', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function getHREvents(filters?: { employee_id?: string; type?: string }, options?: RequestInit): Promise<HREvent[]> {
  const params = new URLSearchParams();
  if (filters?.employee_id) params.append('employee_id', filters.employee_id);
  if (filters?.type) params.append('type', filters.type);
  const query = params.toString() ? `?${params.toString()}` : '';
  return fetchApi<HREvent[]>(`/hr/events${query}`, options);
}

export async function createHREvent(data: any, options?: RequestInit): Promise<HREvent> {
  return fetchApi<HREvent>('/hr/events', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function updateEmployee(id: string, data: any, options?: RequestInit): Promise<Employee> {
  return fetchApi<Employee>('/hr/employees', {
    method: 'PUT',
    body: JSON.stringify({ id, ...data }),
    ...options
  });
}

export async function postPayrollToFinance(payrollId: string, options?: RequestInit): Promise<{ success: boolean; journal_entry_id: string; message: string }> {
  return fetchApi<{ success: boolean; journal_entry_id: string; message: string }>('/hr/payroll-posting', {
    method: 'POST',
    body: JSON.stringify({ payroll_id: payrollId }),
    ...options
  });
}

// --- Manufacturing (Phase 7) ---

export async function getBOMs(options?: RequestInit): Promise<any[]> {
  return fetchApi<any[]>('/admin/manufacturing/boms', options);
}

export async function createBOM(data: any, options?: RequestInit): Promise<any> {
  return fetchApi<any>('/admin/manufacturing/boms', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function getProductionOrders(options?: RequestInit): Promise<any[]> {
  return fetchApi<any[]>('/admin/manufacturing/orders', options);
}

export async function createProductionOrder(data: any, options?: RequestInit): Promise<any> {
  return fetchApi<any>('/admin/manufacturing/orders', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function updateProductionOrder(id: string, status: string, options?: RequestInit): Promise<any> {
  return fetchApi<any>('/admin/manufacturing/orders', {
    method: 'PUT',
    body: JSON.stringify({ id, status }),
    ...options
  });
}

// --- Credit Notes ---

export async function getCreditNotes(filters?: { customer_id?: string; status?: string; posting_status?: string }, options?: RequestInit): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.customer_id) params.append('customer_id', filters.customer_id);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.posting_status) params.append('posting_status', filters.posting_status);
  const query = params.toString() ? `?${params.toString()}` : '';
  return fetchApi<any[]>(`/admin/finance/credit-notes${query}`, options);
}

export async function getCreditNote(id: string, options?: RequestInit): Promise<any> {
  return fetchApi<any>(`/admin/finance/credit-notes/${id}`, options);
}

export async function createCreditNote(data: any, options?: RequestInit): Promise<any> {
  return fetchApi<any>('/admin/finance/credit-notes', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function updateCreditNote(id: string, data: any, options?: RequestInit): Promise<any> {
  return fetchApi<any>(`/admin/finance/credit-notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    ...options
  });
}

export async function deleteCreditNote(id: string, options?: RequestInit): Promise<boolean> {
  await fetchApi(`/admin/finance/credit-notes/${id}`, {
    method: 'DELETE',
    ...options
  });
  return true;
}

export async function postCreditNote(id: string, options?: RequestInit): Promise<any> {
  return fetchApi<any>(`/admin/finance/credit-notes/${id}/post`, {
    method: 'POST',
    ...options
  });
}

export async function applyCreditNote(id: string, invoiceId: string, amount: number, options?: RequestInit): Promise<any> {
  return fetchApi<any>(`/admin/finance/credit-notes/${id}/apply`, {
    method: 'POST',
    body: JSON.stringify({ invoice_id: invoiceId, amount }),
    ...options
  });
}

// --- Debit Notes ---

export async function getDebitNotes(filters?: { vendor_id?: string; status?: string; posting_status?: string }, options?: RequestInit): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.vendor_id) params.append('vendor_id', filters.vendor_id);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.posting_status) params.append('posting_status', filters.posting_status);
  const query = params.toString() ? `?${params.toString()}` : '';
  return fetchApi<any[]>(`/admin/finance/debit-notes${query}`, options);
}

export async function getDebitNote(id: string, options?: RequestInit): Promise<any> {
  return fetchApi<any>(`/admin/finance/debit-notes/${id}`, options);
}

export async function createDebitNote(data: any, options?: RequestInit): Promise<any> {
  return fetchApi<any>('/admin/finance/debit-notes', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function updateDebitNote(id: string, data: any, options?: RequestInit): Promise<any> {
  return fetchApi<any>(`/admin/finance/debit-notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    ...options
  });
}

export async function deleteDebitNote(id: string, options?: RequestInit): Promise<boolean> {
  await fetchApi(`/admin/finance/debit-notes/${id}`, {
    method: 'DELETE',
    ...options
  });
  return true;
}

export async function postDebitNote(id: string, options?: RequestInit): Promise<any> {
  return fetchApi<any>(`/admin/finance/debit-notes/${id}/post`, {
    method: 'POST',
    ...options
  });
}

export async function applyDebitNote(id: string, vendorBillId: string, amount: number, options?: RequestInit): Promise<any> {
  return fetchApi<any>(`/admin/finance/debit-notes/${id}/apply`, {
    method: 'POST',
    body: JSON.stringify({ vendor_bill_id: vendorBillId, amount }),
    ...options
  });
}

// --- Stock Journal ---

export async function getStockJournals(filters?: { type?: string; posting_status?: string; variant_id?: string }, options?: RequestInit): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.type) params.append('type', filters.type);
  if (filters?.posting_status) params.append('posting_status', filters.posting_status);
  if (filters?.variant_id) params.append('variant_id', filters.variant_id);
  const query = params.toString() ? `?${params.toString()}` : '';
  return fetchApi<any[]>(`/admin/scm/stock-journal${query}`, options);
}

export async function getStockJournal(id: string, options?: RequestInit): Promise<any> {
  return fetchApi<any>(`/admin/scm/stock-journal/${id}`, options);
}

export async function createStockJournal(data: any, options?: RequestInit): Promise<any> {
  return fetchApi<any>('/admin/scm/stock-journal', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function updateStockJournal(id: string, data: any, options?: RequestInit): Promise<any> {
  return fetchApi<any>(`/admin/scm/stock-journal/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    ...options
  });
}

export async function deleteStockJournal(id: string, options?: RequestInit): Promise<boolean> {
  await fetchApi(`/admin/scm/stock-journal/${id}`, {
    method: 'DELETE',
    ...options
  });
  return true;
}

export async function postStockJournal(id: string, options?: RequestInit): Promise<any> {
  return fetchApi<any>(`/admin/scm/stock-journal/${id}/post`, {
    method: 'POST',
    ...options
  });
}
