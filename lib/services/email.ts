'use server';

interface EmailAttachment {
  filename: string;
  content: string;
  contentType: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

// Disable actual email sending
export async function sendEmail({ to, subject, html, attachments }: SendEmailParams) {
  console.log(`[Mock Email] To: ${to}, Subject: ${subject}`);
  return { success: true, error: null };
}

export async function sendWelcomeEmail(to: string, fullName: string) {
  console.log(`[Mock Email] Welcome email to ${to} (${fullName}) suppressed.`);
  return { success: true, error: null };
}

export async function sendProjectUpdateEmail(
  to: string,
  projectTitle: string,
  message: string,
  updatedBy: string
) {
  console.log(`[Mock Email] Project update email for ${projectTitle} to ${to} suppressed.`);
  return { success: true, error: null };
}

export async function sendSupportTicketEmail(
  to: string,
  subject: string,
  description: string,
  clientName: string,
  isAdmin: boolean
) {
  console.log(`[Mock Email] Support ticket email for ${subject} to ${to} suppressed.`);
  return { success: true, error: null };
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  title: string,
  message: string,
  link?: string,
  linkText: string = 'View Details'
) {
  console.log(`[Mock Email] Notification email "${title}" to ${to} suppressed.`);
  return { success: true, error: null };
}

export async function sendInvoiceEmail(
  to: string,
  invoiceNumber: string,
  amount: number,
  dueDate: string
) {
  console.log(`[Mock Email] Invoice email ${invoiceNumber} to ${to} suppressed.`);
  return { success: true, error: null };
}

export async function sendMeetingStatusEmail(
  to: string,
  purpose: string,
  requestedDate: string,
  duration: number,
  status: string,
  meetingLink?: string
) {
  console.log(`[Mock Email] Meeting status email for ${purpose} to ${to} suppressed.`);
  return { success: true, error: null };
}