import { Project, Invoice, User, SupportRequest, MeetingRequest, Quotation, Enquiry, Lead, PlanningNote, Transaction, SystemSettings, TeamMember } from '@/lib/db/types';

// Helper to fetch from API
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { signal, ...rest } = options;
  const res = await fetch(`/api${endpoint}`, {
    ...rest,
    signal,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'API Request Failed');
  }
  return res.json();
}

// --- Projects ---
export async function getProjects(clientId?: string, options?: RequestInit): Promise<Project[]> {
  const query = clientId ? `?clientId=${clientId}` : '';
  return fetchApi<Project[]>(`/projects${query}`, options);
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
export async function getInvoices(clientId?: string, options?: RequestInit): Promise<Invoice[]> {
  const query = clientId ? `?clientId=${clientId}` : '';
  return fetchApi<Invoice[]>(`/invoices${query}`, options);
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
export async function getSupportRequests(clientId?: string, options?: RequestInit): Promise<SupportRequest[]> {
  const query = clientId ? `?clientId=${clientId}` : '';
  return fetchApi<SupportRequest[]>(`/support${query}`, options);
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
export async function getMeetings(clientId?: string, options?: RequestInit): Promise<MeetingRequest[]> {
  const query = clientId ? `?clientId=${clientId}` : '';
  return fetchApi<MeetingRequest[]>(`/meetings${query}`, options);
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
import { InventoryItem, InventoryTransaction } from '@/lib/db/types';

export async function getInventoryItems(options?: RequestInit): Promise<InventoryItem[]> {
  return fetchApi<InventoryItem[]>('/inventory/items', options);
}

export async function createInventoryItem(data: any, options?: RequestInit): Promise<InventoryItem> {
  return fetchApi<InventoryItem>('/inventory/items', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

export async function getInventoryTransactions(options?: RequestInit): Promise<InventoryTransaction[]> {
  return fetchApi<InventoryTransaction[]>('/inventory/transactions', options);
}

export async function createInventoryTransaction(data: any, options?: RequestInit): Promise<InventoryTransaction> {
  return fetchApi<InventoryTransaction>('/inventory/transactions', {
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

export async function createPurchaseOrder(data: any, options?: RequestInit): Promise<PurchaseOrder> {
  return fetchApi<PurchaseOrder>('/purchases/orders', {
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
export async function getQuotations(clientId?: string, options?: RequestInit): Promise<Quotation[]> { return []; }
export async function getQuotation(id: string, options?: RequestInit): Promise<Quotation | null> { return null; }
export async function createQuotation(data: any, options?: RequestInit): Promise<string> { return 'id'; }
export async function updateQuotation(id: string, data: any, options?: RequestInit): Promise<boolean> { return true; }
export async function deleteQuotation(id: string, options?: RequestInit): Promise<boolean> { return true; }

export async function getEnquiries(options?: RequestInit): Promise<Enquiry[]> { return []; }
export async function createEnquiry(data: any, options?: RequestInit): Promise<string> { return 'id'; }
export async function updateEnquiry(id: string, data: any, options?: RequestInit): Promise<boolean> { return true; }

export async function getLeads(options?: RequestInit): Promise<Lead[]> { return []; }
export async function createLead(data: any, options?: RequestInit): Promise<string> { return 'id'; }
export async function updateLead(id: string, data: any, options?: RequestInit): Promise<boolean> { return true; }

export async function getPlanningNotes(options?: RequestInit): Promise<PlanningNote[]> { return []; }
export async function createPlanningNote(data: any, options?: RequestInit): Promise<string> { return 'id'; }
export async function updatePlanningNote(id: string, data: any, options?: RequestInit): Promise<boolean> { return true; }
export async function deletePlanningNote(id: string, options?: RequestInit): Promise<boolean> { return true; }
