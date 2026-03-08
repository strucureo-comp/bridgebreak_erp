// Approval System for Sales & CRM Documents
// This utility provides approval workflow functionality for all sales documents

import { toast } from 'sonner';

// Document Types
export type SalesDocumentType = 'quotation' | 'proformaInvoice' | 'salesInvoice' | 'deliveryNote';

// Document Status
export type DocumentStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'completed';

// Approval Config Interface
export interface SalesApprovalConfig {
    quotation: { enabled: boolean; approverRole: string };
    proformaInvoice: { enabled: boolean; approverRole: string };
    salesInvoice: { enabled: boolean; approverRole: string };
    deliveryNote: { enabled: boolean; approverRole: string };
}

// Document with approval info
export interface SalesDocument {
    id: string;
    type: SalesDocumentType;
    number: string;
    customerName: string;
    date: string;
    total: number;
    status: DocumentStatus;
    createdBy: string;
    createdAt: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectedBy?: string;
    rejectedAt?: string;
    rejectedReason?: string;
}

// Get current user's role from auth context
export function getCurrentUserRole(): string {
    // Try to get from localStorage (simulated)
    const userStr = localStorage.getItem('auth_user');
    if (userStr) {
        const user = JSON.parse(userStr);
        return user.role || 'Employee';
    }
    // Default role for testing
    return 'Employee';
}

// Get sales approval config from localStorage
export function getSalesApprovalConfig(): SalesApprovalConfig {
    const saved = localStorage.getItem('sales_approval_config');
    if (saved) {
        return JSON.parse(saved);
    }
    return {
        quotation: { enabled: false, approverRole: '' },
        proformaInvoice: { enabled: false, approverRole: '' },
        salesInvoice: { enabled: false, approverRole: '' },
        deliveryNote: { enabled: false, approverRole: '' },
    };
}

// Check if approval is required for a document type
export function isApprovalRequired(documentType: SalesDocumentType): boolean {
    const config = getSalesApprovalConfig();
    return config[documentType]?.enabled || false;
}

// Get approver role for a document type
export function getApproverRole(documentType: SalesDocumentType): string {
    const config = getSalesApprovalConfig();
    return config[documentType]?.approverRole || '';
}

// Check if current user can approve a document
export function canApproveDocument(documentType: SalesDocumentType): boolean {
    const currentRole = getCurrentUserRole();
    const approverRole = getApproverRole(documentType);
    return currentRole === approverRole && isApprovalRequired(documentType);
}

// Check if current user is the creator of the document
export function isDocumentCreator(document: SalesDocument): boolean {
    const currentUser = localStorage.getItem('auth_user');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        return document.createdBy === user.full_name || document.createdBy === user.email;
    }
    return false;
}

// Get status display info
export function getStatusInfo(status: DocumentStatus): { label: string; color: string; icon: string } {
    switch (status) {
        case 'draft':
            return { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: '📝' };
        case 'pending_approval':
            return { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' };
        case 'approved':
            return { label: 'Approved', color: 'bg-green-100 text-green-800', icon: '✅' };
        case 'rejected':
            return { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: '❌' };
        case 'completed':
            return { label: 'Completed', color: 'bg-blue-100 text-blue-800', icon: '📋' };
        default:
            return { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: '❓' };
    }
}

// Get available actions based on document status and user role
export function getAvailableActions(
    document: SalesDocument,
    userRole: string,
    approverRole: string
): { edit: boolean; delete: boolean; submit: boolean; approve: boolean; reject: boolean; resubmit: boolean; download: boolean } {
    const isApprover = userRole === approverRole;
    const isCreator = document.createdBy === localStorage.getItem('user_email');
    const approvalRequired = isApprovalRequired(document.type);

    // If approval not required, allow all actions
    if (!approvalRequired) {
        return {
            edit: document.status === 'draft',
            delete: document.status === 'draft',
            submit: document.status === 'draft',
            approve: false,
            reject: false,
            resubmit: false,
            download: document.status !== 'draft',
        };
    }

    switch (document.status) {
        case 'draft':
            return {
                edit: true,
                delete: true,
                submit: true,
                approve: false,
                reject: false,
                resubmit: false,
                download: false,
            };
        case 'pending_approval':
            return {
                edit: false,
                delete: false,
                submit: false,
                approve: isApprover,
                reject: isApprover,
                resubmit: false,
                download: false,
            };
        case 'approved':
            return {
                edit: false,
                delete: false,
                submit: false,
                approve: false,
                reject: false,
                resubmit: false,
                download: true,
            };
        case 'rejected':
            return {
                edit: true,
                delete: true,
                submit: false,
                approve: false,
                reject: false,
                resubmit: true,
                download: false,
            };
        case 'completed':
            return {
                edit: false,
                delete: false,
                submit: false,
                approve: false,
                reject: false,
                resubmit: false,
                download: true,
            };
        default:
            return {
                edit: false,
                delete: false,
                submit: false,
                approve: false,
                reject: false,
                resubmit: false,
                download: false,
            };
    }
}

// Submit document for approval
export function submitForApproval(document: SalesDocument): SalesDocument {
    return {
        ...document,
        status: 'pending_approval',
        submittedAt: new Date().toISOString(),
    };
}

// Approve document
export function approveDocument(document: SalesDocument, approvedBy: string): SalesDocument {
    return {
        ...document,
        status: 'approved',
        approvedBy: approvedBy,
        approvedAt: new Date().toISOString(),
    };
}

// Reject document
export function rejectDocument(document: SalesDocument, rejectedBy: string, reason: string): SalesDocument {
    return {
        ...document,
        status: 'rejected',
        rejectedBy: rejectedBy,
        rejectedAt: new Date().toISOString(),
        rejectedReason: reason,
    };
}

// Resubmit rejected document
export function resubmitDocument(document: SalesDocument): SalesDocument {
    return {
        ...document,
        status: 'pending_approval',
        resubmittedAt: new Date().toISOString(),
        rejectedBy: undefined,
        rejectedAt: undefined,
        rejectedReason: undefined,
    };
}

// Complete approved document
export function completeDocument(document: SalesDocument): SalesDocument {
    return {
        ...document,
        status: 'completed',
        completedAt: new Date().toISOString(),
    };
}

// Get document type label
export function getDocumentTypeLabel(type: SalesDocumentType): string {
    switch (type) {
        case 'quotation': return 'Quotation';
        case 'proformaInvoice': return 'Proforma Invoice';
        case 'salesInvoice': return 'Sales Invoice';
        case 'deliveryNote': return 'Delivery Note';
        default: return type;
    }
}

// Get documents from localStorage
export function getDocuments(type?: SalesDocumentType): SalesDocument[] {
    const allDocs: SalesDocument[] = [];

    if (type) {
        const saved = localStorage.getItem(`sales_${type}s`);
        if (saved) {
            return JSON.parse(saved);
        }
    } else {
        // Get all document types
        const types: SalesDocumentType[] = ['quotation', 'proformaInvoice', 'salesInvoice', 'deliveryNote'];
        types.forEach(t => {
            const saved = localStorage.getItem(`sales_${t}s`);
            if (saved) {
                const docs = JSON.parse(saved);
                allDocs.push(...docs);
            }
        });
    }

    return allDocs;
}

// Save document to localStorage
export function saveDocument(document: SalesDocument): void {
    const storageKey = `sales_${document.type}s`;
    const saved = localStorage.getItem(storageKey);
    let documents: SalesDocument[] = saved ? JSON.parse(saved) : [];

    const existingIndex = documents.findIndex(d => d.id === document.id);
    if (existingIndex >= 0) {
        documents[existingIndex] = document;
    } else {
        documents.push(document);
    }

    localStorage.setItem(storageKey, JSON.stringify(documents));
}

// Delete document from localStorage
export function deleteDocument(document: SalesDocument): void {
    const storageKey = `sales_${document.type}s`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
        let documents: SalesDocument[] = JSON.parse(saved);
        documents = documents.filter(d => d.id !== document.id);
        localStorage.setItem(storageKey, JSON.stringify(documents));
    }
}
