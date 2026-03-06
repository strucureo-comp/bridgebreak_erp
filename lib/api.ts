import {
    MOCK_PROJECTS,
    MOCK_EMPLOYEES,
    MOCK_FINANCE,
    MOCK_CRM,
    MOCK_INVENTORY,
    MOCK_PROCUREMENT,
    MOCK_MANUFACTURING
} from './mock-data';

// ==========================================
// MOCK-FIRST API LAYER (EXPLICIT EXPORTS)
// Disconnected for UI Prototyping
// ==========================================

async function mockDelay<T>(data: T, ms = 300): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(data), ms));
}

// --- PROJECTS ---
export async function getProjects(): Promise<any[]> {
    try {
        const res = await fetch(`${API_BASE}/projects`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getProjects error:', e); }
    return [];
}
export async function getProject(id: string): Promise<any> {
    try {
        const res = await fetch(`${API_BASE}/projects/${id}`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getProject error:', e); }
    return null;
}
export async function createProject(data: any): Promise<any> {
    try {
        const res = await fetch(`${API_BASE}/projects`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createProject error:', e); }
    return null;
}
export async function updateProject(id: string, data: any): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE}/projects/${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        return res.ok;
    } catch (e) { console.warn('[API] updateProject error:', e); }
    return false;
}

// --- SALES & CRM ---
export async function getLeads(): Promise<any[]> {
    try {
        const res = await fetch(`${API_BASE}/crm/leads`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getLeads error:', e); }
    return [];
}
export async function createLead(data: any): Promise<any> {
    try {
        const res = await fetch(`${API_BASE}/crm/leads`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createLead error:', e); }
    return null;
}
export async function updateLead(id: string, data: any) {
    try {
        const res = await fetch(`${API_BASE}/crm/leads/${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        return res.ok;
    } catch (e) { console.warn('[API] updateLead error:', e); }
    return false;
}
export async function getOpportunities() {
    try {
        const res = await fetch(`${API_BASE}/crm/opportunities`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getOpportunities error:', e); }
    return [];
}
export async function createOpportunity(data: any) {
    try {
        const res = await fetch(`${API_BASE}/crm/opportunities`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createOpportunity error:', e); }
    return null;
}
export async function getCustomers(): Promise<any[]> {
    try {
        const res = await fetch(`${API_BASE}/crm/customers`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getCustomers error:', e); }
    return [];
}
export async function createCustomer(data: any): Promise<any> {
    try {
        const res = await fetch(`${API_BASE}/crm/customers`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createCustomer error:', e); }
    return null;
}
export async function updateCustomer(id: string, data: any) {
    try {
        const res = await fetch(`${API_BASE}/receivables/customers/${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        return res.ok;
    } catch (e) { console.warn('[API] updateCustomer error:', e); }
    return false;
}
export async function deleteCustomer(id: string) { return mockDelay(true); }
export async function deleteLead(id: string) { return mockDelay(true); }
export async function updateOpportunity(id: string, data: any) { return mockDelay(true); }
export async function deleteOpportunity(id: string) { return mockDelay(true); }
export async function getQuotes() { return mockDelay([]); }
export async function createQuote(data: any) { return mockDelay(data); }
export async function createQuotation(data: any) { return mockDelay(data); }
export async function updateQuotation(id: string, data: any) { return mockDelay(true); }
export async function deleteQuotation(id: string) { return mockDelay(true); }
export async function getQuotations() { return mockDelay([]); }
export async function getQuotation(id: string) { return mockDelay(null as any); }
export async function getActivities() {
    try {
        const res = await fetch(`${API_BASE}/crm/activities`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getActivities error:', e); }
    return [];
}
export async function createActivity(data: any) {
    try {
        const res = await fetch(`${API_BASE}/crm/activities`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createActivity error:', e); }
    return null;
}
export async function getSalesOrders() {
    try {
        const res = await fetch(`${API_BASE}/crm/sales-orders`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getSalesOrders error:', e); }
    return [];
}
export async function createSalesOrder(data: any) {
    try {
        const res = await fetch(`${API_BASE}/crm/sales-orders`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createSalesOrder error:', e); }
    return null;
}

// --- INVOICES & RECEIVABLES ---
export async function getInvoices(): Promise<any[]> {
    try {
        const res = await fetch(`${API_BASE}/finance/invoices`);
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getInvoices error:', e); }
    return [];
}
export async function getInvoice(id: string): Promise<any> {
    try {
        const res = await fetch(`${API_BASE}/finance/invoices/${id}`);
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getInvoice error:', e); }
    return null;
}
export async function createInvoice(data: any): Promise<any> {
    try {
        const res = await fetch(`${API_BASE}/finance/invoices`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createInvoice error:', e); }
    return null;
}
export async function updateInvoice(id: string, data: any): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE}/finance/invoices/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        return res.ok;
    } catch (e) { console.warn('[API] updateInvoice error:', e); }
    return false;
}
export async function deleteInvoice(id: string): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE}/finance/invoices/${id}`, { method: 'DELETE' });
        return res.ok;
    } catch (e) { console.warn('[API] deleteInvoice error:', e); }
    return false;
}
export async function getReceivables() { return getInvoices().then(inv => inv.filter(i => ['sent', 'overdue', 'partial'].includes(i.status))); }
export async function createReceivable(data: any) { return createInvoice(data); }

// --- FINANCE & PAYABLES ---
export async function getTransactions() { return mockDelay(MOCK_FINANCE.transactions); }
export async function createTransaction(data: any) { return mockDelay({ id: 't-new', ...data }); }
export async function deleteTransaction(id: string) { return mockDelay(true); }
export async function getAccounts(): Promise<any[]> {
    try {
        const res = await fetch(`${API_BASE}/finance/accounts`);
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getAccounts error:', e); }
    return [];
}
export async function createAccount(data: any): Promise<any> {
    try {
        const res = await fetch(`${API_BASE}/finance/accounts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createAccount error:', e); }
    return null;
}
export async function getJournalEntries(): Promise<any[]> {
    try {
        const res = await fetch(`${API_BASE}/finance/journals`);
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getJournalEntries error:', e); }
    return [];
}
export async function createJournalEntry(data: any): Promise<any> {
    try {
        const res = await fetch(`${API_BASE}/finance/journals`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createJournalEntry error:', e); }
    return null;
}
export async function getFinancialReport(type: string) { return mockDelay({}); }
export async function getBudgets() { return mockDelay([]); }
export async function saveBudget(data: any) { return mockDelay(data); }
export async function reconcileTransaction(bt: string, st: string) { return mockDelay(true); }
export async function getUnreconciledTransactions() { return mockDelay({ bankTransactions: [], systemTransactions: [] }); }
export async function getPayables() { return getInvoices().then(inv => inv.filter(i => i.type === 'debit_note')); }
export async function createPayable(data: any) { return createInvoice(data); }

// --- EXPENSES ---
export async function getExpenses(): Promise<any[]> {
    try {
        const res = await fetch(`${API_BASE}/finance/expenses`);
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getExpenses error:', e); }
    return [];
}
export async function createExpense(data: any): Promise<any> {
    try {
        const res = await fetch(`${API_BASE}/finance/expenses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createExpense error:', e); }
    return null;
}
export async function updateExpense(id: string, data: any): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE}/finance/expenses/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        return res.ok;
    } catch (e) { console.warn('[API] updateExpense error:', e); }
    return false;
}
export async function deleteExpense(id: string): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE}/finance/expenses/${id}`, { method: 'DELETE' });
        return res.ok;
    } catch (e) { console.warn('[API] deleteExpense error:', e); }
    return false;
}

// --- FINANCE SUMMARY ---
export async function getFinanceSummary(): Promise<any> {
    try {
        const res = await fetch(`${API_BASE}/finance/summary`);
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getFinanceSummary error:', e); }
    return null;
}

// --- SEED COA ---
export async function seedChartOfAccounts(): Promise<any> {
    try {
        const res = await fetch(`${API_BASE}/finance/accounts/seed`, { method: 'POST' });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] seedCOA error:', e); }
    return null;
}

// --- FIXED ASSETS ---
export async function getFixedAssets() {
    try {
        const res = await fetch(`${API_BASE}/fixed-assets`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getFixedAssets error:', e); }
    return [];
}
export async function createFixedAsset(data: any) {
    try {
        const res = await fetch(`${API_BASE}/fixed-assets`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createFixedAsset error:', e); }
    return null;
}
export async function runDepreciation(date: string) { return mockDelay(true); }

// --- HRMS ---
export async function getEmployees() {
    try {
        const res = await fetch(`${API_BASE}/hrms/employees`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getEmployees error:', e); }
    return [];
}
export async function createEmployee(data: any) {
    try {
        const res = await fetch(`${API_BASE}/hrms/employees`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createEmployee error:', e); }
    return null;
}
export async function updateEmployee(id: string, data: any) {
    try {
        const res = await fetch(`${API_BASE}/hrms/employees/${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] updateEmployee error:', e); }
    return null;
}
export async function getAttendance(date?: string) {
    try {
        const url = `${API_BASE}/hrms/attendance${date ? `?date=${date}` : ''}`;
        const res = await fetch(url, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getAttendance error:', e); }
    return [];
}
export async function markAttendance(data: any) {
    try {
        const res = await fetch(`${API_BASE}/hrms/attendance`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] markAttendance error:', e); }
    return null;
}
export async function getDepartments() {
    try {
        const res = await fetch(`${API_BASE}/hrms/departments`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getDepartments error:', e); }
    return [];
}
export async function createDepartment(data: any) {
    try {
        const res = await fetch(`${API_BASE}/hrms/departments`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createDepartment error:', e); }
    return null;
}
export async function getHRRoles() {
    try {
        const res = await fetch(`${API_BASE}/hrms/roles`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getHRRoles error:', e); }
    return [];
}
export async function createHRRole(data: any) {
    try {
        const res = await fetch(`${API_BASE}/hrms/roles`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createHRRole error:', e); }
    return null;
}
export async function getPayrolls() {
    try {
        const res = await fetch(`${API_BASE}/hrms/payrolls`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getPayrolls error:', e); }
    return [];
}

export async function previewPayroll(month: string) {
    try {
        const res = await fetch(`${API_BASE}/hrms/payrolls/preview`, {
            method: 'POST',
            headers: { ...authHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ month })
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] previewPayroll error:', e); }
    throw new Error('Failed to preview payroll');
}

export async function generatePayroll(month: string, force = false) {
    try {
        const res = await fetch(`${API_BASE}/hrms/payrolls/generate`, {
            method: 'POST',
            headers: { ...authHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ month, force })
        });
        if (res.ok) return res.json();
        
        // Handle duplicate cycle error
        if (res.status === 409) {
            const errorData = await res.json();
            throw { code: 'DUPLICATE_CYCLE', ...errorData };
        }
    } catch (e) { console.warn('[API] generatePayroll error:', e); throw e; }
    throw new Error('Failed to generate payroll');
}

export async function postPayrollToFinance(id: string) {
    try {
        const res = await fetch(`${API_BASE}/hrms/payrolls/${id}/post`, {
            method: 'POST',
            headers: authHeaders()
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] postPayrollToFinance error:', e); }
    throw new Error('Failed to post payroll to finance');
}

export async function updatePayrollStatus(id: string, status: string) {
    try {
        const res = await fetch(`${API_BASE}/hrms/payrolls/${id}/status`, {
            method: 'PATCH',
            headers: { ...authHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] updatePayrollStatus error:', e); }
    throw new Error('Failed to update payroll status');
}

export async function getSalaryStructures(empId?: string) {
    try {
        const url = empId ? `${API_BASE}/hrms/salary-structures?employee_id=${empId}` : `${API_BASE}/hrms/salary-structures`;
        const res = await fetch(url, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getSalaryStructures error:', e); }
    return [];
}

export async function createSalaryStructure(data: any) {
    try {
        const res = await fetch(`${API_BASE}/hrms/salary-structures`, {
            method: 'POST',
            headers: { ...authHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createSalaryStructure error:', e); }
    throw new Error('Failed to create salary structure');
}

export async function getLeaves(f?: any) {
    try {
        const res = await fetch(`${API_BASE}/hrms/leaves`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getLeaves error:', e); }
    return [];
}
export async function applyLeave(data: any) {
    try {
        const res = await fetch(`${API_BASE}/hrms/leaves`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] applyLeave error:', e); }
    return null;
}
export async function updateLeaveStatus(id: string, s: string) {
    try {
        const res = await fetch(`${API_BASE}/hrms/leaves/${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ status: s })
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] updateLeaveStatus error:', e); }
    return null;
}
export async function getLeaveTypes() {
    try {
        const res = await fetch(`${API_BASE}/hrms/leave-types`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getLeaveTypes error:', e); }
    return [];
}
export async function createLeaveType(data: any) {
    try {
        const res = await fetch(`${API_BASE}/hrms/leave-types`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createLeaveType error:', e); }
    return null;
}
export async function getHolidays() {
    try {
        const res = await fetch(`${API_BASE}/hrms/holidays`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getHolidays error:', e); }
    return [];
}
export async function createHoliday(data: any) {
    try {
        const res = await fetch(`${API_BASE}/hrms/holidays`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createHoliday error:', e); }
    return null;
}
export async function getHREvents(f?: any) { return mockDelay([]); }
export async function createHREvent(data: any) { return mockDelay(data); }
export async function allocateLabour(data: any) { return mockDelay(data); }
export async function getLabourAllocations() { return mockDelay([]); }
export async function getEmployeeDocuments(id?: string) { return mockDelay([]); }
export async function createEmployeeDocument(data: any) { return mockDelay(data); }

// --- PROCUREMENT & INVENTORY ---
async function invFetch(path: string, opts?: RequestInit) {
    const res = await fetch(`${API_BASE}/inventory${path}`, { ...opts, headers: { ...authHeaders(), ...(opts?.headers || {}) } });
    if (!res.ok) throw new Error(`Inventory API error: ${res.status}`);
    return res.json();
}

export async function getInventoryItems() { try { return await invFetch('/items'); } catch { return []; } }
export async function createInventoryItem(data: any) { return invFetch('/items', { method: 'POST', body: JSON.stringify(data) }); }
export async function updateInventoryItem(id: string, data: any) { return invFetch(`/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }

export async function getProducts() { return getInventoryItems(); }
export async function createProduct(data: any) { return createInventoryItem(data); }

export async function getWarehouses() { try { return await invFetch('/warehouses'); } catch { return []; } }
export async function createWarehouse(data: any) { return invFetch('/warehouses', { method: 'POST', body: JSON.stringify(data) }); }
export async function getInventoryTransactions() { try { return await invFetch('/summary').then(s => s.recent_transactions); } catch { return []; } }
export async function createInventoryTransaction(data: any) { return invFetch('/move', { method: 'POST', body: JSON.stringify(data) }); }
export async function recordStockMovement(data: any) { return createInventoryTransaction(data); }
export async function getInventorySummary() { try { return await invFetch('/summary'); } catch { return { total_skus: 0, recent_transactions: [], total_value: 0 }; } }
export async function getVendors() {
    try {
        const res = await fetch(`${API_BASE}/payables/vendors`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getVendors error:', e); }
    return [];
}
export async function createVendor(data: any) {
    try {
        const res = await fetch(`${API_BASE}/payables/vendors`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createVendor error:', e); }
    return null;
}
export async function getPurchaseRequests() {
    try {
        const res = await fetch(`${API_BASE}/procurement/requests`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getPurchaseRequests error:', e); }
    return [];
}
export async function createPurchaseRequest(data: any) {
    try {
        const res = await fetch(`${API_BASE}/procurement/requests`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createPurchaseRequest error:', e); }
    return null;
}
export async function getPurchaseOrders() {
    try {
        const res = await fetch(`${API_BASE}/procurement/orders`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getPurchaseOrders error:', e); }
    return [];
}
export async function getPurchaseOrder(id: string) { return mockDelay(null); }
export async function createPurchaseOrder(data: any) {
    try {
        const res = await fetch(`${API_BASE}/procurement/orders`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createPurchaseOrder error:', e); }
    return null;
}
export async function getGRNs() {
    try {
        const res = await fetch(`${API_BASE}/procurement/grns`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getGRNs error:', e); }
    return [];
}
export async function createGRN(data: any) { return mockDelay(data); }
export async function createGRNs(data: any) { return mockDelay(data); }
export async function getVendorBills() {
    try {
        const res = await fetch(`${API_BASE}/payables/bills`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getVendorBills error:', e); }
    return [];
}
export async function createVendorBill(data: any) {
    try {
        const res = await fetch(`${API_BASE}/payables/bills`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createVendorBill error:', e); }
    return null;
}
export async function getVendorPayments() {
    try {
        const res = await fetch(`${API_BASE}/payables/payments`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getVendorPayments error:', e); }
    return [];
}
export async function createVendorPayment(data: any) {
    try {
        const res = await fetch(`${API_BASE}/payables/payments`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createVendorPayment error:', e); }
    return null;
}

// --- MANUFACTURING ---
export async function getBOMs() {
    try {
        const res = await fetch(`${API_BASE}/manufacturing/boms`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getBOMs error:', e); }
    return [];
}
export async function createBOM(data: any) {
    try {
        const res = await fetch(`${API_BASE}/manufacturing/boms`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createBOM error:', e); }
    return null;
}
export async function getProductionOrders() {
    try {
        const res = await fetch(`${API_BASE}/manufacturing/production-orders`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getProductionOrders error:', e); }
    return [];
}
export async function createProductionOrder(data: any) {
    try {
        const res = await fetch(`${API_BASE}/manufacturing/production-orders`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createProductionOrder error:', e); }
    return null;
}
export async function updateProductionOrder(id: string, s: string) { return mockDelay(true); }

// --- STOCK JOURNAL ---
export async function getStockJournals() {
    try {
        const res = await fetch(`${API_BASE}/stock-journal`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getStockJournals error:', e); }
    return [];
}
export async function getStockJournal(id: string) { return mockDelay(null); }
export async function createStockJournal(data: any) {
    try {
        const res = await fetch(`${API_BASE}/stock-journal`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createStockJournal error:', e); }
    return null;
}
export async function updateStockJournal(id: string, data: any) { return mockDelay(true); }
export async function deleteStockJournal(id: string) { return mockDelay(true); }
export async function postStockJournal(id: string) { return mockDelay(true); }

// --- CRM CUSTOMERS & OPPORTUNITIES ---
export async function getOpportunity(id: string) { return mockDelay(null); }
export async function getActivitiesByEntity(type: string, id: string) { return mockDelay([]); }

// --- PROJECT OPS ---
export async function submitTimesheet(data: any) {
    try {
        const res = await fetch(`${API_BASE}/project-ops/timesheets`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        return res.ok;
    } catch (e) { console.warn('[API] submitTimesheet error:', e); }
    return false;
}
export async function approveTimesheet(id: string, s: string) { return mockDelay(true); }
export async function submitExpense(data: any) { return mockDelay(true); }
export async function approveExpense(id: string, s: string) { return mockDelay(true); }
export async function getResourceBookings() {
    try {
        const res = await fetch(`${API_BASE}/project-ops/resource-bookings`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getResourceBookings error:', e); }
    return [];
}
export async function createResourceBooking(data: any) {
    try {
        const res = await fetch(`${API_BASE}/project-ops/resource-bookings`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        return res.ok;
    } catch (e) { console.warn('[API] createResourceBooking error:', e); }
    return false;
}
export async function getPriceLists() { return mockDelay([]); }
export async function createPriceList(data: any) { return mockDelay(true); }

// --- TENANT & SETTINGS (REAL BACKEND) ---
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('bb_token');
}

function authHeaders(): HeadersInit {
    const token = getToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

export async function getTenantStatus() {
    try {
        const res = await fetch(`${API_BASE}/settings/tenant_status`, { headers: authHeaders() });
        if (res.ok) {
            const json = await res.json();
            if (json.data) return json.data;
        }
    } catch (e) { console.error('[API] getTenantStatus error:', e); }
    // Fallback defaults
    return {
        setup_stage: 'completed',
        business_type: 'construction',
        company_setup_complete: true,
        finance_setup_complete: true,
        roles_setup_complete: true,
        module_finance: true,
        module_sales: true,
        module_operations: true,
        module_hr: true
    };
}

export async function getSettings<T>(key: string): Promise<T | null> {
    try {
        const res = await fetch(`${API_BASE}/settings/${key}`, { headers: authHeaders() });
        if (res.ok) {
            const json = await res.json();
            if (json.data) {
                // Cache to localStorage for offline fallback
                localStorage.setItem(`bb_settings_${key}`, JSON.stringify(json.data));
                return json.data as T;
            }
        }
    } catch (e) {
        console.warn(`[API] getSettings(${key}) backend unavailable, using local cache`);
    }
    // Fallback: try localStorage
    try {
        const cached = localStorage.getItem(`bb_settings_${key}`);
        if (cached) return JSON.parse(cached) as T;
    } catch { }
    return null;
}

export async function saveSettings(key: string, data: any) {
    // Always save to localStorage first
    try {
        localStorage.setItem(`bb_settings_${key}`, JSON.stringify(data));
    } catch { }

    try {
        const res = await fetch(`${API_BASE}/settings/${key}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ value: data }),
        });
        if (res.ok) {
            const json = await res.json();
            return json.data;
        }
        console.warn(`[API] saveSettings(${key}) backend returned ${res.status}, saved locally`);
        return data;
    } catch (e) {
        console.warn(`[API] saveSettings(${key}) backend unavailable, saved locally`);
        return data;
    }
}

export async function getSystemSetting(key: string) {
    return getSettings(key);
}
export async function setSystemSetting(key: string, val: any) {
    return saveSettings(key, val);
}

// Tax Rates API
export async function getTaxRates(countryCode: string): Promise<{
    country: string;
    countryName: string;
    system: string;
    rates: Array<{ type: string; rate: number; category: string; date?: string }>;
    lastUpdated: string | null;
} | null> {
    try {
        const res = await fetch(`${API_BASE}/tax/rates/${countryCode}`);
        if (res.ok) {
            const json = await res.json();
            if (json.success) return json.data;
        }
    } catch (e) {
        console.warn(`[API] getTaxRates(${countryCode}) error:`, e);
    }
    return null;
}

// --- USERS ---
export async function getUsers(): Promise<any[]> {
    try {
        const res = await fetch(`${API_BASE}/auth/users`, { headers: authHeaders() });
        if (res.ok) {
            const json = await res.json();
            return json.users || [];
        }
    } catch (e) { console.warn('[API] getUsers error:', e); }
    return [];
}
export async function getUser(id: string): Promise<any> {
    try {
        const res = await fetch(`${API_BASE}/auth/users/${id}`, { headers: authHeaders() });
        if (res.ok) {
            const json = await res.json();
            return json.user || null;
        }
    } catch (e) { console.warn('[API] getUser error:', e); }
    return null;
}

// --- BANKING ---
export async function getBankAccounts() {
    try {
        const res = await fetch(`${API_BASE}/finance/accounts?type=asset`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getBankAccounts error:', e); }
    return [];
}
export async function createBankAccount(data: any) { return createAccount({ ...data, type: 'asset' }); }

export async function getBankTransactions() {
    try {
        const res = await fetch(`${API_BASE}/finance/journals`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getBankTransactions error:', e); }
    return [];
}
export async function createBankTransaction(data: any) { return createJournalEntry(data); }

// --- DEBIT/CREDIT NOTES ---
export async function getCreditNotes() { return mockDelay([]); }
export async function getCreditNote(id: string) { return mockDelay(null); }
export async function createCreditNote(data: any) { return mockDelay(data); }
export async function updateCreditNote(id: string, data: any) { return mockDelay(true); }
export async function deleteCreditNote(id: string) { return mockDelay(true); }
export async function postCreditNote(id: string) { return mockDelay(true); }
export async function applyCreditNote(id: string, inv: string, amt: number) { return mockDelay(true); }

export async function getDebitNotes() { return mockDelay([]); }
export async function getDebitNote(id: string) { return mockDelay(null); }
export async function createDebitNote(data: any) { return mockDelay(data); }
export async function updateDebitNote(id: string, data: any) { return mockDelay(true); }
export async function deleteDebitNote(id: string) { return mockDelay(true); }
export async function postDebitNote(id: string) { return mockDelay(true); }
export async function applyDebitNote(id: string, bill: string, amt: number) { return mockDelay(true); }

// --- TAX DATA ---
export async function getTaxDataForCountry(c: string) { return getTaxRates(c); }
export async function getAllTaxCountries() { return mockDelay([]); }
export async function calculatePriceWithVAT(c: string, a: number) { return mockDelay(null); }
export async function validateVATNumber(v: string) { return mockDelay({ valid: true, country: 'AE' }); }
export async function getTaxDatabaseStatus() {
    try {
        const res = await fetch(`${API_BASE}/tax/rates/AE`);
        if (res.ok) return { status: 'active', lastSync: new Date().toISOString(), totalCountries: 40, collectionStatus: 'done' };
    } catch (e) { /* fallback */ }
    return { status: 'active', lastSync: '', totalCountries: 0, collectionStatus: 'done' };
}
export async function triggerTaxDataCollection() { return { message: 'Tax rates are fetched in real-time per country. No batch collection needed.' }; }
export async function getTaxJobHistory() { return [{ timestamp: new Date().toISOString(), countriesCollected: 40, status: 'success' }]; }
export async function getTaxDatabaseStats() { return { stats: { totalCountries: 40, source: 'API Ninjas + Built-in' } }; }

// --- SUPPORT ---
export async function getSupportRequests() {
    try {
        const res = await fetch(`${API_BASE}/support-meetings/support`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getSupportRequests error:', e); }
    return [];
}
export async function getSupportRequest(id: string) { return mockDelay(null); }
export async function createSupportRequest(data: any) {
    try {
        const res = await fetch(`${API_BASE}/support-meetings/support`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createSupportRequest error:', e); }
    return null;
}
export async function updateSupportRequest(id: string, data: any) { return mockDelay(true); }

// --- MEETINGS ---
export async function getMeetings() {
    try {
        const res = await fetch(`${API_BASE}/support-meetings/meetings`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getMeetings error:', e); }
    return [];
}
export async function getMeeting(id: string) { return mockDelay(null); }
export async function createMeetingRequest(data: any) {
    try {
        const res = await fetch(`${API_BASE}/support-meetings/meetings`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createMeetingRequest error:', e); }
    return null;
}
export async function updateMeeting(id: string, data: any) { return mockDelay(true); }

// --- MISC ---
export async function getTeamMembers() { return mockDelay([]); }
export async function getPlanningNotes() {
    try {
        const res = await fetch(`${API_BASE}/misc/planning-notes`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getPlanningNotes error:', e); }
    return [];
}
export async function createPlanningNote(data: any) {
    try {
        const res = await fetch(`${API_BASE}/misc/planning-notes`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createPlanningNote error:', e); }
    return null;
}
export async function updatePlanningNote(id: string, data: any) { return mockDelay(true); }
export async function deletePlanningNote(id: string) { return mockDelay(true); }
export async function getEnquiries() {
    try {
        const res = await fetch(`${API_BASE}/misc/enquiries`, { headers: authHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] getEnquiries error:', e); }
    return [];
}
export async function createEnquiry(data: any) {
    try {
        const res = await fetch(`${API_BASE}/misc/enquiries`, {
            method: 'POST',
            headers: authHeaders(), // Enquiries can be public, but headers don't hurt
            body: JSON.stringify(data)
        });
        if (res.ok) return res.json();
    } catch (e) { console.warn('[API] createEnquiry error:', e); }
    return null;
}
export async function updateEnquiry(id: string, data: any) { return mockDelay(true); }
export async function getPerformanceData(t: string) { return mockDelay([]); }
export async function createPerformanceItem(data: any) { return mockDelay(true); }

// --- APPROVAL WORKFLOWS (REAL BACKEND) ---
export async function getApprovalWorkflows() {
    try {
        const res = await fetch(`${API_BASE}/workflows`, { headers: authHeaders() });
        if (res.ok) {
            const json = await res.json();
            return json.data || [];
        }
    } catch (e) { console.error('[API] getApprovalWorkflows error:', e); }
    return [];
}

export async function createApprovalWorkflow(data: any) {
    const res = await fetch(`${API_BASE}/workflows`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create workflow');
    const json = await res.json();
    return json.data;
}

export async function updateApprovalWorkflow(id: string, data: any) {
    const res = await fetch(`${API_BASE}/workflows/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update workflow');
    const json = await res.json();
    return json.data;
}

export async function deleteApprovalWorkflow(id: string) {
    const res = await fetch(`${API_BASE}/workflows/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete workflow');
    return true;
}

export async function getBudgetControls() { return mockDelay([]); }
export async function setBudgetControl(data: any) { return mockDelay(true); }

// ====================================================================
// TAX CENTER API (REAL BACKEND)
// ====================================================================
async function tcFetch(path: string, opts?: RequestInit) {
    const res = await fetch(`${API_BASE}/tax-center${path}`, { ...opts, headers: { ...authHeaders(), ...(opts?.headers || {}) } });
    if (!res.ok) throw new Error(`Tax Center API error: ${res.status}`);
    return res.json();
}

// Jurisdictions
export async function getTaxJurisdictions() { try { return await tcFetch('/jurisdictions'); } catch { return []; } }
export async function createTaxJurisdiction(data: any) { return tcFetch('/jurisdictions', { method: 'POST', body: JSON.stringify(data) }); }
export async function updateTaxJurisdiction(id: string, data: any) { return tcFetch(`/jurisdictions/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
export async function deleteTaxJurisdiction(id: string) { return tcFetch(`/jurisdictions/${id}`, { method: 'DELETE' }); }

// Tax Codes
export async function getTaxCodes(jurisdiction?: string) { try { return await tcFetch(`/codes${jurisdiction ? `?jurisdiction=${jurisdiction}` : ''}`); } catch { return []; } }
export async function createTaxCode(data: any) { return tcFetch('/codes', { method: 'POST', body: JSON.stringify(data) }); }
export async function updateTaxCode(id: string, data: any) { return tcFetch(`/codes/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
export async function deleteTaxCode(id: string) { return tcFetch(`/codes/${id}`, { method: 'DELETE' }); }

// Filing Periods
export async function getFilingPeriods(jurisdiction?: string) { try { return await tcFetch(`/filing-periods${jurisdiction ? `?jurisdiction=${jurisdiction}` : ''}`); } catch { return []; } }
export async function createFilingPeriod(data: any) { return tcFetch('/filing-periods', { method: 'POST', body: JSON.stringify(data) }); }
export async function updateFilingPeriod(id: string, data: any) { return tcFetch(`/filing-periods/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
export async function toggleFilingPeriodStatus(id: string) { return tcFetch(`/filing-periods/${id}/status`, { method: 'PATCH', body: JSON.stringify({}) }); }
export async function deleteFilingPeriod(id: string) { return tcFetch(`/filing-periods/${id}`, { method: 'DELETE' }); }

// Tax Adjustments
export async function getTaxAdjustments() { try { return await tcFetch('/adjustments'); } catch { return []; } }
export async function createTaxAdjustment(data: any) { return tcFetch('/adjustments', { method: 'POST', body: JSON.stringify(data) }); }
export async function postTaxAdjustment(id: string) { return tcFetch(`/adjustments/${id}/post`, { method: 'PATCH', body: JSON.stringify({}) }); }
export async function deleteTaxAdjustment(id: string) { return tcFetch(`/adjustments/${id}`, { method: 'DELETE' }); }

// Tax Center Summary
export async function getTaxCenterSummary() { try { return await tcFetch('/center-summary'); } catch { return { jurisdictions: 0, codes: 0, openPeriods: 0, totalLiability: 0, adjustments: 0 }; } }

// ====================================================================
// RECEIVABLES API (REAL BACKEND)
// ====================================================================
async function arFetch(path: string, opts?: RequestInit) {
    const res = await fetch(`${API_BASE}/receivables${path}`, { ...opts, headers: { ...authHeaders(), ...(opts?.headers || {}) } });
    if (!res.ok) throw new Error(`Receivables API error: ${res.status}`);
    return res.json();
}

async function apFetch(path: string, opts?: RequestInit) {
    const res = await fetch(`${API_BASE}/payables${path}`, { ...opts, headers: { ...authHeaders(), ...(opts?.headers || {}) } });
    if (!res.ok) throw new Error(`Payables API error: ${res.status}`);
    return res.json();
}

// ── Receivables API Definitions ──────────────────────────────────────────────
export async function getARCustomers() { try { return await arFetch('/customers'); } catch { return []; } }
export async function createARCustomer(data: any) { return arFetch('/customers', { method: 'POST', body: JSON.stringify(data) }); }
export async function updateARCustomer(id: string, data: any) { return arFetch(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }

export async function getARInvoices() { try { return await arFetch('/invoices'); } catch { return []; } }
export async function createARInvoice(data: any) { return arFetch('/invoices', { method: 'POST', body: JSON.stringify(data) }); }
export async function postARInvoice(id: string) { return arFetch(`/invoices/${id}/post`, { method: 'POST' }); }

export async function getARPayments() { try { return await arFetch('/payments'); } catch { return []; } }
export async function createARPayment(data: any) { return arFetch('/payments', { method: 'POST', body: JSON.stringify(data) }); }

export async function getARAgingReport() { try { return await arFetch('/aging-report'); } catch { return { current: 0, d30: 0, d60: 0, d90: 0, d90Plus: 0, total: 0 }; } }

// ── Payables API Definitions ──────────────────────────────────────────────────
export async function getAPVendors() { try { return await apFetch('/vendors'); } catch { return []; } }
export async function createAPVendor(data: any) { return apFetch('/vendors', { method: 'POST', body: JSON.stringify(data) }); }
export async function updateAPVendor(id: string, data: any) { return apFetch(`/vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }

export async function getAPBills() { try { return await apFetch('/bills'); } catch { return []; } }
export async function createAPBill(data: any) { return apFetch('/bills', { method: 'POST', body: JSON.stringify(data) }); }
export async function postAPBill(id: string) { return apFetch(`/bills/${id}/post`, { method: 'POST' }); }

export async function getAPPayments() { try { return await apFetch('/payments'); } catch { return []; } }
export async function createAPPayment(data: any) { return apFetch('/payments', { method: 'POST', body: JSON.stringify(data) }); }

export async function getAPAgingReport() { try { return await apFetch('/aging-report'); } catch { return { current: 0, d30: 0, d60: 0, d90: 0, d90Plus: 0, total: 0 }; } }

// ====================================================================
// APPROVAL ENGINE API (REAL BACKEND)
// ====================================================================
async function aeFetch(path: string, opts?: RequestInit) {
    const res = await fetch(`${API_BASE}/approval-engine${path}`, { ...opts, headers: { ...authHeaders(), ...(opts?.headers || {}) } });
    if (!res.ok) throw new Error(`Approval Engine API error: ${res.status}`);
    return res.json();
}

// Workflows
export async function getApprovalWorkflowsV2(docType?: string) { try { return await aeFetch(`/workflows${docType ? `?docType=${docType}` : ''}`); } catch { return []; } }
export async function createApprovalWorkflowV2(data: any) { return aeFetch('/workflows', { method: 'POST', body: JSON.stringify(data) }); }
export async function updateApprovalWorkflowV2(id: string, data: any) { return aeFetch(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
export async function toggleApprovalWorkflowV2(id: string) { return aeFetch(`/workflows/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({}) }); }
export async function deleteApprovalWorkflowV2(id: string) { return aeFetch(`/workflows/${id}`, { method: 'DELETE' }); }

// SoD Rules
export async function getSodRules() { try { return await aeFetch('/sod-rules'); } catch { return []; } }
export async function createSodRule(data: any) { return aeFetch('/sod-rules', { method: 'POST', body: JSON.stringify(data) }); }
export async function toggleSodRule(id: string) { return aeFetch(`/sod-rules/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({}) }); }
export async function deleteSodRule(id: string) { return aeFetch(`/sod-rules/${id}`, { method: 'DELETE' }); }

// Approval Engine Summary
export async function getApprovalEngineSummary() { try { return await aeFetch('/summary'); } catch { return { totalWorkflows: 0, activeWorkflows: 0, sodRules: 0 }; } }

// ====================================================================
// FINANCE HUB SUMMARY (aggregates from multiple endpoints)
// ====================================================================
export async function getFinanceHubSummary() {
    try {
        const [financeSummary, taxSummary, approvalSummary] = await Promise.all([
            fetch(`${API_BASE}/finance/summary`, { headers: authHeaders() }).then(r => r.ok ? r.json() : null).catch(() => null),
            getTaxCenterSummary(),
            getApprovalEngineSummary(),
        ]);
        return {
            revenue: financeSummary?.totalRevenue ?? 0,
            expenses: financeSummary?.totalExpenses ?? 0,
            netIncome: financeSummary?.netIncome ?? 0,
            cashPosition: 0,
            receivables: financeSummary?.totalReceivable ?? 0,
            payables: financeSummary?.totalPayable ?? 0,
            taxLiability: taxSummary?.totalLiability ?? 0,
            openInvoices: financeSummary?.invoiceCount ?? 0,
            overdueBills: 0,
            pendingApprovals: approvalSummary?.activeWorkflows ?? 0,
            invoiceCount: financeSummary?.invoiceCount ?? 0,
            expenseCount: financeSummary?.expenseCount ?? 0,
            accountCount: financeSummary?.accountCount ?? 0,
        };
    } catch {
        return { revenue: 0, expenses: 0, netIncome: 0, cashPosition: 0, receivables: 0, payables: 0, taxLiability: 0, openInvoices: 0, overdueBills: 0, pendingApprovals: 0, invoiceCount: 0, expenseCount: 0, accountCount: 0 };
    }
}
