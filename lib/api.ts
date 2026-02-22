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
export async function getProjects() { return mockDelay(MOCK_PROJECTS); }
export async function getProject(id: string) { return mockDelay(MOCK_PROJECTS.find(p => p.id === id) || null); }
export async function createProject(data: any) { return mockDelay({ id: `p-${Math.random()}`, ...data }); }
export async function updateProject(id: string, data: any) { return mockDelay(true); }

// --- SALES & CRM ---
export async function getLeads() { return mockDelay(MOCK_CRM.leads); }
export async function createLead(data: any) { return mockDelay(data); }
export async function updateLead(id: string, data: any) { return mockDelay(true); }
export async function getOpportunities() { return mockDelay(MOCK_CRM.opportunities); }
export async function createOpportunity(data: any) { return mockDelay(data); }
export async function getCustomers() { return mockDelay(MOCK_CRM.customers); }
export async function createCustomer(data: any) { return mockDelay(data); }
export async function getQuotes() { return mockDelay([]); }
export async function createQuote(data: any) { return mockDelay(data); }
export async function createQuotation(data: any) { return mockDelay(data); }
export async function updateQuotation(id: string, data: any) { return mockDelay(true); }
export async function deleteQuotation(id: string) { return mockDelay(true); }
export async function getQuotations() { return mockDelay([]); }
export async function getQuotation(id: string) { return mockDelay(null); }
export async function getActivities() { return mockDelay([]); }
export async function createActivity(data: any) { return mockDelay(data); }
export async function getSalesOrders() { return mockDelay([]); }
export async function createSalesOrder(data: any) { return mockDelay(data); }

// --- INVOICES & RECEIVABLES ---
export async function getInvoices() { return mockDelay([]); }
export async function getInvoice(id: string) { return mockDelay(null); }
export async function createInvoice(data: any) { return mockDelay(data); }
export async function updateInvoice(id: string, data: any) { return mockDelay(true); }
export async function deleteInvoice(id: string) { return mockDelay(true); }
export async function getReceivables() { return mockDelay([]); }
export async function createReceivable(data: any) { return mockDelay(data); }

// --- FINANCE & PAYABLES ---
export async function getTransactions() { return mockDelay(MOCK_FINANCE.transactions); }
export async function createTransaction(data: any) { return mockDelay({ id: 't-new', ...data }); }
export async function deleteTransaction(id: string) { return mockDelay(true); }
export async function getAccounts() { return mockDelay([]); }
export async function createAccount(data: any) { return mockDelay(data); }
export async function getJournalEntries() { return mockDelay([]); }
export async function createJournalEntry(data: any) { return mockDelay(data); }
export async function getFinancialReport(type: string) { return mockDelay({}); }
export async function getBudgets() { return mockDelay([]); }
export async function saveBudget(data: any) { return mockDelay(data); }
export async function reconcileTransaction(bt: string, st: string) { return mockDelay(true); }
export async function getUnreconciledTransactions() { return mockDelay({ bankTransactions: [], systemTransactions: [] }); }
export async function getPayables() { return mockDelay([]); }
export async function createPayable(data: any) { return mockDelay(data); }

// --- FIXED ASSETS ---
export async function getFixedAssets() { return mockDelay([]); }
export async function createFixedAsset(data: any) { return mockDelay(data); }
export async function runDepreciation(date: string) { return mockDelay(true); }

// --- HRMS ---
export async function getEmployees() { return mockDelay(MOCK_EMPLOYEES); }
export async function createEmployee(data: any) { return mockDelay(data); }
export async function updateEmployee(id: string, data: any) { return mockDelay(data); }
export async function getAttendance(date?: string) { return mockDelay([]); }
export async function markAttendance(data: any) { return mockDelay(data); }
export async function getDepartments() { return mockDelay([]); }
export async function createDepartment(data: any) { return mockDelay(data); }
export async function getHRRoles() { return mockDelay([]); }
export async function createHRRole(data: any) { return mockDelay(data); }
export async function getPayrolls() { return mockDelay([]); }
export async function generatePayroll(month: string) { return mockDelay({ message: 'Success' }); }
export async function postPayrollToFinance(id: string) { return mockDelay({ message: 'Success' }); }
export async function getSalaryStructures(empId?: string) { return mockDelay([]); }
export async function createSalaryStructure(data: any) { return mockDelay(data); }
export async function getLeaves(f?: any) { return mockDelay([]); }
export async function applyLeave(data: any) { return mockDelay(data); }
export async function updateLeaveStatus(id: string, s: string) { return mockDelay(true); }
export async function getLeaveTypes() { return mockDelay([]); }
export async function createLeaveType(data: any) { return mockDelay(data); }
export async function getHolidays() { return mockDelay([]); }
export async function createHoliday(data: any) { return mockDelay(data); }
export async function getHREvents(f?: any) { return mockDelay([]); }
export async function createHREvent(data: any) { return mockDelay(data); }
export async function allocateLabour(data: any) { return mockDelay(data); }
export async function getLabourAllocations() { return mockDelay([]); }
export async function getEmployeeDocuments(id?: string) { return mockDelay([]); }
export async function createEmployeeDocument(data: any) { return mockDelay(data); }

// --- PROCUREMENT & INVENTORY ---
export async function getProducts() { return mockDelay(MOCK_INVENTORY); }
export async function createProduct(data: any) { return mockDelay(data); }
export async function getWarehouses() { return mockDelay([]); }
export async function createWarehouse(data: any) { return mockDelay(data); }
export async function getInventoryTransactions() { return mockDelay([]); }
export async function createInventoryTransaction(data: any) { return mockDelay(data); }
export async function getVendors() { return mockDelay(MOCK_PROCUREMENT.vendors); }
export async function createVendor(data: any) { return mockDelay(data); }
export async function getPurchaseRequests() { return mockDelay(MOCK_PROCUREMENT.requests); }
export async function createPurchaseRequest(data: any) { return mockDelay(data); }
export async function getPurchaseOrders() { return mockDelay(MOCK_PROCUREMENT.orders); }
export async function getPurchaseOrder(id: string) { return mockDelay(null); }
export async function createPurchaseOrder(data: any) { return mockDelay(data); }
export async function getGRNs() { return mockDelay([]); }
export async function createGRN(data: any) { return mockDelay(data); }
export async function createGRNs(data: any) { return mockDelay(data); }
export async function getVendorBills() { return mockDelay([]); }
export async function createVendorBill(data: any) { return mockDelay(data); }
export async function getVendorPayments() { return mockDelay([]); }
export async function createVendorPayment(data: any) { return mockDelay(data); }

// --- MANUFACTURING ---
export async function getBOMs() { return mockDelay(MOCK_MANUFACTURING.boms); }
export async function createBOM(data: any) { return mockDelay(data); }
export async function getProductionOrders() { return mockDelay(MOCK_MANUFACTURING.orders); }
export async function createProductionOrder(data: any) { return mockDelay(data); }
export async function updateProductionOrder(id: string, s: string) { return mockDelay(true); }

// --- STOCK JOURNAL ---
export async function getStockJournals() { return mockDelay([]); }
export async function getStockJournal(id: string) { return mockDelay(null); }
export async function createStockJournal(data: any) { return mockDelay(data); }
export async function updateStockJournal(id: string, data: any) { return mockDelay(true); }
export async function deleteStockJournal(id: string) { return mockDelay(true); }
export async function postStockJournal(id: string) { return mockDelay(true); }

// --- CRM CUSTOMERS & OPPORTUNITIES ---
export async function getOpportunity(id: string) { return mockDelay(null); }
export async function getActivitiesByEntity(type: string, id: string) { return mockDelay([]); }

// --- PROJECT OPS ---
export async function submitTimesheet(data: any) { return mockDelay(true); }
export async function approveTimesheet(id: string, s: string) { return mockDelay(true); }
export async function submitExpense(data: any) { return mockDelay(true); }
export async function approveExpense(id: string, s: string) { return mockDelay(true); }
export async function getResourceBookings() { return mockDelay([]); }
export async function createResourceBooking(data: any) { return mockDelay(true); }
export async function getPriceLists() { return mockDelay([]); }
export async function createPriceList(data: any) { return mockDelay(true); }

// --- TENANT & SETTINGS ---
export async function getTenantStatus() {
    return mockDelay({
        setup_stage: 'completed',
        business_type: 'construction',
        company_setup_complete: true,
        finance_setup_complete: true,
        roles_setup_complete: true,
        module_finance: true,
        module_sales: true,
        module_operations: true,
        module_hr: true
    });
}

export async function getSettings<T>(key: string): Promise<T | null> {
    if (key === 'company_profile') {
        return mockDelay({
            legalName: 'SYSTEM STEEL ENGINEERING LLC',
            tradingName: 'System Steel',
            baseCurrency: 'AED',
            taxId: '100123456789003',
            address: 'Warehouse 4, Al Quoz, Dubai',
            branding: {
                color: '#ef4444',
                template: 'modern',
                headerAlign: 'left',
                showWatermark: true
            }
        } as any);
    }
    return mockDelay(null);
}

export async function saveSettings(key: string, data: any) {
    console.log(`[Mock API] Save Settings [${key}]:`, data);
    return mockDelay(true);
}

export async function getSystemSetting(key: string) { return mockDelay(null); }
export async function setSystemSetting(key: string, val: any) { return mockDelay(true); }

// --- USERS ---
export async function getUsers() { return mockDelay([]); }
export async function getUser(id: string) { return mockDelay(null); }

// --- BANKING ---
export async function getBankAccounts() { return mockDelay([]); }
export async function createBankAccount(data: any) { return mockDelay(data); }
export async function getBankTransactions() { return mockDelay([]); }
export async function createBankTransaction(data: any) { return mockDelay(data); }

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
export async function getTaxDataForCountry(c: string) { return mockDelay(null); }
export async function getAllTaxCountries() { return mockDelay([]); }
export async function calculatePriceWithVAT(c: string, a: number) { return mockDelay(null); }
export async function validateVATNumber(v: string) { return mockDelay({ valid: true, country: 'AE' }); }
export async function getTaxDatabaseStatus() { return mockDelay({ status: 'active', lastSync: '', totalCountries: 0, collectionStatus: 'done' }); }
export async function triggerTaxDataCollection() { return mockDelay({ message: 'Success' }); }
export async function getTaxJobHistory() { return mockDelay([]); }
export async function getTaxDatabaseStats() { return mockDelay({ stats: null }); }

// --- SUPPORT ---
export async function getSupportRequests() { return mockDelay([]); }
export async function getSupportRequest(id: string) { return mockDelay(null); }
export async function createSupportRequest(data: any) { return mockDelay({ id: 'sr-new' }); }
export async function updateSupportRequest(id: string, data: any) { return mockDelay(true); }

// --- MEETINGS ---
export async function getMeetings() { return mockDelay([]); }
export async function getMeeting(id: string) { return mockDelay(null); }
export async function createMeetingRequest(data: any) { return mockDelay({ id: 'm-new' }); }
export async function updateMeeting(id: string, data: any) { return mockDelay(true); }

// --- MISC ---
export async function getTeamMembers() { return mockDelay([]); }
export async function getPlanningNotes() { return mockDelay([]); }
export async function createPlanningNote(data: any) { return mockDelay('id'); }
export async function updatePlanningNote(id: string, data: any) { return mockDelay(true); }
export async function deletePlanningNote(id: string) { return mockDelay(true); }
export async function getEnquiries() { return mockDelay([]); }
export async function createEnquiry(data: any) { return mockDelay('id'); }
export async function updateEnquiry(id: string, data: any) { return mockDelay(true); }
export async function getPerformanceData(t: string) { return mockDelay([]); }
export async function createPerformanceItem(data: any) { return mockDelay(true); }
export async function getApprovalWorkflows() { return mockDelay([]); }
export async function createApprovalWorkflow(data: any) { return mockDelay(true); }
export async function getBudgetControls() { return mockDelay([]); }
export async function setBudgetControl(data: any) { return mockDelay(true); }
