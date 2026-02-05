export type UserRole = 'client' | 'admin';

export type ProjectStatus =
  | 'pending'
  | 'under_review'
  | 'accepted'
  | 'in_progress'
  | 'testing'
  | 'completed'
  | 'cancelled';

export type FileType = 'document' | 'voice_note' | 'image' | 'other';

export type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type PriorityLevel = 'low' | 'medium' | 'high';

export type MeetingStatus = 'pending' | 'accepted' | 'declined' | 'completed';

export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export type MemberStatus = 'active' | 'inactive';

export type NotificationType = 'project' | 'payment' | 'support' | 'meeting' | 'system';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  attachment_url?: string;
  tax_rate_id?: string;
  currency?: string;
  exchange_rate?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  github_link?: string;
  document_url?: string;
  estimated_cost?: number;
  actual_cost?: number;
  deadline?: string;
  progress_percentage?: number;
  test_asset_url?: string;
  deployment_url?: string; // Kept for backward compatibility or primary link

  // LIVE PREVIEW CONFIG
  live_preview_type?: 'url' | 'image';
  live_preview_url?: string;

  // DYNAMIC TECHNICAL CONFIG
  technical_config?: Array<{
    id: string;
    label: string;
    value: string;
    isLink?: boolean;
    isSecret?: boolean;
    category: 'infra' | 'admin' | 'deploy';
  }>;

  // TICKETS & NOTES
  tickets?: Array<{
    id: string;
    title: string;
    description?: string;
    attachment_url?: string;
    completed: boolean;
    created_at?: string;
  }>;
  notes?: string[];

  // Node-based module data
  labour_data?: unknown;
  inventory_data?: unknown;
  resources_data?: unknown;
  design_data?: unknown;
  expenses_data?: unknown;
  timeline_data?: unknown;

  is_featured?: boolean; // Mark project as featured for portfolio/showcase

  created_at: string;
  updated_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  file_name: string;
  file_url: string;
  file_type: FileType;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  update_text: string;
  created_by: string;
  created_at: string;
}

export interface SupportRequest {
  id: string;
  project_id?: string;
  client_id: string;
  subject: string;
  description: string;
  status: SupportStatus;
  priority: PriorityLevel;
  attachment_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  support_request_id: string;
  user_id: string;
  message: string;
  created_at: string;
}

export interface MeetingRequest {
  id: string;
  project_id?: string;
  client_id: string;
  requested_date: string;
  duration_minutes: number;
  purpose: string;
  status: MeetingStatus;
  meeting_link?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  project_id: string;
  client_id: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  status: InvoiceStatus;
  description?: string;
  notes?: string;
  payment_qr_url?: string;
  bank_details?: Record<string, any>;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  project?: { title?: string };
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: string;
  transaction_id?: string;
  payment_date: string;
  notes?: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  monthly_salary: number;
  joined_date: string;
  status: MemberStatus;
  created_at: string;
  updated_at: string;
}

export interface SalaryPayment {
  id: string;
  team_member_id: string;
  amount: number;
  payment_date: string;
  month: string;
  notes?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  read: boolean;
  created_at: string;
}



export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface QuotationItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Quotation {
  id: string;
  project_id?: string;
  project_title?: string; // Snapshot or manual
  client_id: string; // Can be empty if manual
  quotation_number: string;
  amount: number;
  valid_until: string;
  status: QuotationStatus;
  currency: string;
  description?: string;
  items: QuotationItem[];
  notes?: string;

  // Manual Client Details (Non-registered)
  client_name?: string;
  client_email?: string;
  client_company?: string;
  client_address?: string;
  client_is_company?: boolean;

  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  id: string;
  key: string;
  value: Record<string, any>;
  updated_at: string;
}

export interface PlanningNote {
  id: string;
  title: string;
  content: string;
  category: 'idea' | 'strategy' | 'todo' | 'other';
  created_by: string;
  updated_at: string;
  created_at: string;
}

export type EnquiryStatus = 'new' | 'read' | 'replied' | 'converted';

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
  status: EnquiryStatus;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  min_stock?: number;
  cost_price?: number;
  created_at: string;
  updated_at: string;
  sku?: string;
  quantity?: number;
  min_stock_level?: number;
}

export type InventoryTransactionType = 
  | 'stock_in' 
  | 'stock_out' 
  | 'issue_to_project' 
  | 'return_from_project' 
  | 'scrap' 
  | 'wastage';

export interface InventoryTransaction {
  id: string;
  item_id: string;
  project_id?: string;
  type: InventoryTransactionType;
  quantity: number;
  date: string;
  reference_no?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  
  item?: InventoryItem;
  project?: { title: string };
  user?: { full_name: string };
}

export interface Employee {
  id: string;
  employee_id: string;
  name: string;
  role: string;
  skill_type: string;
  employment_type: string;
  department?: string;
  joining_date: string;
  basic_salary: number;
  overtime_rate: number;
  bank_details?: any;
  status: 'active' | 'inactive';
}

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  status: string;
  overtime_hours: number;
  project_id?: string;
  employee?: Employee;
  project?: { title: string };
}

export interface LabourAllocation {
  id: string;
  employee_id: string;
  project_id: string;
  start_date: string;
  end_date?: string;
  status: string;
  employee?: Employee;
  project?: { title: string };
}

export interface Payroll {
  id: string;
  month: string;
  status: string;
  total_amount: number;
  lines?: PayrollLine[];
}

export interface PayrollLine {
  id: string;
  payroll_id: string;
  employee_id: string;
  basic_pay: number;
  overtime_pay: number;
  total_pay: number;
  status: string;
  employee?: Employee;
}

export interface BankAccount {
  id: string;
  name: string;
  account_number?: string;
  bank_name?: string;
  currency: string;
  current_balance: number;
  type: string;
  updated_at: string;
}

export interface BankTransaction {
  id: string;
  bank_account_id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  reference?: string;
  status: string;
  bank_account?: BankAccount;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  status: LeadStatus;
  source?: string;
  potential_value?: number;
  probability?: number;
  notes?: string;
  last_contacted?: string;
  next_follow_up?: string;
  follow_up_notes?: string;
  created_at: string;
  updated_at: string;
}

export type PurchaseStatus = 'pending' | 'approved' | 'ordered' | 'received' | 'billed' | 'paid' | 'cancelled';

export interface PurchaseRequest {
  id: string;
  project_id?: string;
  item_name: string;
  quantity: number;
  unit: string;
  estimated_cost?: number;
  priority: PriorityLevel;
  status: PurchaseStatus;
  requested_by: string;
  needed_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  project?: { title: string };
  requester?: { full_name: string };
}

export interface Vendor {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  vat_no?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  purchase_request_id?: string;
  vendor_id: string;
  total_amount: number;
  status: PurchaseStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  vendor?: Vendor;
  creator?: { full_name: string };
  purchase_request?: PurchaseRequest;
}

export interface GRN {
  id: string;
  grn_number: string;
  purchase_order_id: string;
  received_date: string;
  received_by: string;
  notes?: string;
  created_at: string;
  purchase_order?: PurchaseOrder;
  receiver?: { full_name: string };
}

export interface VendorBill {
  id: string;
  bill_number: string;
  purchase_order_id: string;
  vendor_id: string;
  amount: number;
  tax_amount?: number;
  due_date: string;
  status: InvoiceStatus;
  created_at: string;
  updated_at: string;
  vendor?: Vendor;
  purchase_order?: PurchaseOrder;
}

export interface VendorPayment {
  id: string;
  vendor_bill_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_no?: string;
  notes?: string;
  created_at: string;
  vendor_bill?: VendorBill;
}
