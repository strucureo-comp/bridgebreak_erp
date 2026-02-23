/**
 * UAE PDC (Post Dated Cheque) Manager
 * Tracks and manages the lifecycle of cheques
 */

export type PDCStatus = 'pending' | 'cleared' | 'bounced' | 'cancelled';

export interface PDCRecord {
  id: string;
  cheque_number: string;
  bank_name: string;
  amount: number;
  cheque_date: string;
  clearance_date?: string;
  status: PDCStatus;
  account_id: string; // Ledger account
  reference_id: string; // Invoice or Voucher ID
  notes?: string;
}

/**
 * Filter cheques that are due for clearance
 */
export function getDueCheques(cheques: PDCRecord[], referenceDate: string = new Date().toISOString()): PDCRecord[] {
  return cheques.filter(c => c.status === 'pending' && c.cheque_date <= referenceDate);
}

/**
 * Transition PDC status
 */
export function updatePDCStatus(
  cheque: PDCRecord, 
  newStatus: PDCStatus, 
  clearanceDate?: string
): PDCRecord {
  return {
    ...cheque,
    status: newStatus,
    clearance_date: newStatus === 'cleared' ? (clearanceDate || new Date().toISOString()) : undefined
  };
}
