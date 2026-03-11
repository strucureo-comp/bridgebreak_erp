import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice, Project, User, Quotation } from './db/types';
import { getCompanySettings, getBrandingSettings, hexToRgb, formatPdfCurrency } from './pdf-settings';

// Helper to load image from URL
const getBase64ImageFromURL = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            resolve(dataURL);
        };
        img.onerror = error => reject(error);
        img.src = url;
    });
};

// Helper to convert number to words
const numberToWords = (num: number, currency: string = 'AED'): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return 'Zero';

    const convertMillions = (num: number): string => {
        if (num >= 1000000) {
            return convertMillions(Math.floor(num / 1000000)) + ' Million ' + convertThousands(num % 1000000);
        } else {
            return convertThousands(num);
        }
    };

    const convertThousands = (num: number): string => {
        if (num >= 1000) {
            return convertHundreds(Math.floor(num / 1000)) + ' Thousand ' + convertHundreds(num % 1000);
        } else {
            return convertHundreds(num);
        }
    };

    const convertHundreds = (num: number): string => {
        if (num >= 100) {
            return ones[Math.floor(num / 100)] + ' Hundred ' + convertTens(num % 100);
        } else {
            return convertTens(num);
        }
    };

    const convertTens = (num: number): string => {
        if (num < 10) {
            return ones[num];
        } else if (num >= 10 && num < 20) {
            return teens[num - 10];
        } else {
            return tens[Math.floor(num / 10)] + ' ' + ones[num % 10];
        }
    };

    const words = convertMillions(Math.floor(num));
    const decimal = Math.round((num - Math.floor(num)) * 100);

    const currencyName = currency === 'AED' ? 'Dirhams' : currency === 'INR' ? 'Rupees' : currency;
    const decimalName = currency === 'AED' ? 'Fils' : currency === 'INR' ? 'Paisa' : 'Cents';

    if (decimal > 0) {
        return `${words} ${currencyName} and ${convertTens(decimal)} ${decimalName}`;
    }
    return `${words} ${currencyName}`;
};

// Get theme colors from branding
function getThemeColors() {
    const branding = getBrandingSettings();
    const primary = hexToRgb(branding.primaryColor || '#0F172A') || { r: 15, g: 23, b: 42 };
    const accent = hexToRgb(branding.accentColor || '#10B981') || { r: 16, g: 185, b: 129 };
    return { primary, accent };
}

// ============ SALES INVOICE PDF ============
export const createSalesInvoiceDoc = async (invoice: any) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const company = getCompanySettings();
    const branding = getBrandingSettings();
    const { primary, accent } = getThemeColors();

    const pageWidth = 210;
    const margin = 15;
    const rightColumnX = pageWidth - margin;

    // Logo
    try {
        if (branding.logo) {
            const logoData = await getBase64ImageFromURL(branding.logo);
            doc.addImage(logoData, 'PNG', margin, 10, 30, 30);
        }
    } catch (e) { console.warn('Logo load error:', e); }

    // Company Info (Top Left under logo)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.text(company.companyName, margin, 48);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);

    let yPos = 52;
    if (company.address) {
        const addressLines = company.address.split('\n');
        addressLines.forEach(line => {
            doc.text(line, margin, yPos);
            yPos += 4;
        });
    }
    if (company.phone) { doc.text(`Tel: ${company.phone}`, margin, yPos); yPos += 4; }
    if (company.email) { doc.text(`Email: ${company.email}`, margin, yPos); yPos += 4; }
    if (company.trn || company.taxId) { doc.text(`TRN: ${company.trn || company.taxId}`, margin, yPos); }

    // Invoice Header (Right)
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.text('TAX INVOICE', rightColumnX, 20, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    yPos = 28;
    doc.text(`Invoice #: ${invoice.number}`, rightColumnX, yPos, { align: 'right' });
    yPos += 5;
    doc.text(`Date: ${invoice.date}`, rightColumnX, yPos, { align: 'right' });
    yPos += 5;
    if (invoice.dueDate) {
        doc.text(`Due Date: ${invoice.dueDate}`, rightColumnX, yPos, { align: 'right' });
    }

    // Bill To Section
    const billToY = 75;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.text('BILL TO:', margin, billToY);

    doc.setFontSize(11);
    doc.text(invoice.customerName || 'Customer Name', margin, billToY + 6);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    let customerYPos = billToY + 11;
    if (invoice.customerAddress) {
        const addressLines = invoice.customerAddress.split('\n');
        addressLines.forEach(line => {
            doc.text(line, margin, customerYPos);
            customerYPos += 4;
        });
    }
    if (invoice.customerPhone) { doc.text(`Tel: ${invoice.customerPhone}`, margin, customerYPos); customerYPos += 4; }
    if (invoice.customerEmail) { doc.text(`Email: ${invoice.customerEmail}`, margin, customerYPos); customerYPos += 4; }
    if (invoice.customerVat) { doc.text(`VAT: ${invoice.customerVat}`, margin, customerYPos); }

    // Items Table
    const tableStartY = customerYPos + 10;
    const currency = company.baseCurrency || 'AED';

    const tableData = invoice.items?.map((item: any, index: number) => [
        (index + 1).toString(),
        item.description || '',
        item.unit || 'pcs',
        item.quantity.toString(),
        formatPdfCurrency(item.unitPrice, currency),
        formatPdfCurrency(item.total, currency)
    ]) || [];

    autoTable(doc, {
        startY: tableStartY,
        head: [['#', 'Description', 'Unit', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [primary.r, primary.g, primary.b],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9
        },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 65 },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 30, halign: 'right' },
            5: { cellWidth: 30, halign: 'right' }
        },
        margin: { left: margin, right: margin }
    });

    // Totals
    let finalY = (doc as any).lastAutoTable?.finalY + 10;
    doc.setFontSize(10);

    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal:`, rightColumnX - 40, finalY, { align: 'right' });
    doc.text(formatPdfCurrency(invoice.subtotal || 0, currency), rightColumnX, finalY, { align: 'right' });
    finalY += 5;

    doc.text(`Tax (${invoice.taxRate || 5}%):`, rightColumnX - 40, finalY, { align: 'right' });
    doc.text(formatPdfCurrency(invoice.taxAmount || 0, currency), rightColumnX, finalY, { align: 'right' });
    finalY += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Total:`, rightColumnX - 40, finalY, { align: 'right' });
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.text(formatPdfCurrency(invoice.total || 0, currency), rightColumnX, finalY, { align: 'right' });

    // Amount in Words
    finalY += 10;
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Amount in Words:', margin, finalY);
    finalY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    const amountWords = numberToWords(Number(invoice.total) || 0, currency);
    doc.text(`${amountWords.charAt(0).toUpperCase() + amountWords.slice(1)} Only`, margin, finalY);

    // Bank Details
    if (company.bankName || company.bankAccount) {
        finalY += 15;
        doc.setTextColor(primary.r, primary.g, primary.b);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('BANK DETAILS', margin, finalY);
        finalY += 6;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(9);
        if (company.bankName) { doc.text(`Bank: ${company.bankName}`, margin, finalY); finalY += 4; }
        if (company.bankAccount) { doc.text(`A/C: ${company.bankAccount}`, margin, finalY); finalY += 4; }
        if (company.bankIban) { doc.text(`IBAN: ${company.bankIban}`, margin, finalY); finalY += 4; }
        if (company.bankSwift) { doc.text(`SWIFT: ${company.bankSwift}`, margin, finalY); }
    }

    // Notes
    if (invoice.notes) {
        finalY += 12;
        doc.setTextColor(primary.r, primary.g, primary.b);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', margin, finalY);
        finalY += 5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(9);
        const splitNotes = doc.splitTextToSize(invoice.notes, 180);
        doc.text(splitNotes, margin, finalY);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(branding.footerText || 'Powered by BridgeBreak ERP', pageWidth / 2, 285, { align: 'center' });

    return doc;
};

export const generateSalesInvoicePDF = async (invoice: any) => {
    const doc = await createSalesInvoiceDoc(invoice);
    doc.save(`Invoice-${invoice.number}.pdf`);
};

// ============ PROFORMA INVOICE PDF ============
export const createProformaInvoiceDoc = async (proforma: any) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const company = getCompanySettings();
    const branding = getBrandingSettings();
    const { primary } = getThemeColors();

    const pageWidth = 210;
    const margin = 15;
    const rightColumnX = pageWidth - margin;

    // Logo
    try {
        if (branding.logo) {
            const logoData = await getBase64ImageFromURL(branding.logo);
            doc.addImage(logoData, 'PNG', margin, 10, 30, 30);
        }
    } catch (e) {}

    // Company Info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.text(company.companyName, margin, 48);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    let companyYPos = 52;
    if (company.address) {
        const addressLines = company.address.split('\n');
        addressLines.forEach(line => { doc.text(line, margin, companyYPos); companyYPos += 4; });
    }
    if (company.phone) { doc.text(`Tel: ${company.phone}`, margin, companyYPos); companyYPos += 4; }
    if (company.email) { doc.text(`Email: ${company.email}`, margin, companyYPos); companyYPos += 4; }
    if (company.trn || company.taxId) { doc.text(`TRN: ${company.trn || company.taxId}`, margin, companyYPos); }

    // Header
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('PROFORMA INVOICE', rightColumnX, 20, { align: 'right' });

    doc.setFontSize(10);
    yPos = 28;
    doc.text(`PI #: ${proforma.number}`, rightColumnX, yPos, { align: 'right' });
    yPos += 5;
    doc.text(`Date: ${proforma.date}`, rightColumnX, yPos, { align: 'right' });
    yPos += 5;
    if (proforma.validUntil) {
        doc.text(`Valid Until: ${proforma.validUntil}`, rightColumnX, yPos, { align: 'right' });
    }

    // Bill To
    const billToY = 75;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', margin, billToY);
    doc.setFontSize(11);
    doc.text(proforma.customerName || 'Customer', margin, billToY + 6);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    let customerYPos = billToY + 11;
    if (proforma.customerAddress) {
        const addressLines = proforma.customerAddress.split('\n');
        addressLines.forEach(line => {
            doc.text(line, margin, customerYPos);
            customerYPos += 4;
        });
    }
    if (proforma.customerPhone) { doc.text(`Tel: ${proforma.customerPhone}`, margin, customerYPos); customerYPos += 4; }
    if (proforma.customerEmail) { doc.text(`Email: ${proforma.customerEmail}`, margin, customerYPos); customerYPos += 4; }
    if (proforma.customerVat) { doc.text(`VAT: ${proforma.customerVat}`, margin, customerYPos); }

    // Table
    const tableStartY = customerYPos + 10;
    const currency = company.baseCurrency || 'AED';

    const tableData = proforma.items?.map((item: any, index: number) => [
        (index + 1).toString(),
        item.description || '',
        item.unit || 'pcs',
        item.quantity.toString(),
        formatPdfCurrency(item.unitPrice, currency),
        formatPdfCurrency(item.total, currency)
    ]) || [];

    autoTable(doc, {
        startY: tableStartY,
        head: [['#', 'Description', 'Unit', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [primary.r, primary.g, primary.b],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9
        },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 65 },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 30, halign: 'right' },
            5: { cellWidth: 30, halign: 'right' }
        },
        margin: { left: margin, right: margin }
    });

    // Totals
    let finalY = (doc as any).lastAutoTable?.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Subtotal:`, rightColumnX - 40, finalY, { align: 'right' });
    doc.text(formatPdfCurrency(proforma.subtotal || 0, currency), rightColumnX, finalY, { align: 'right' });
    finalY += 5;
    doc.text(`Tax (${proforma.taxRate || 5}%):`, rightColumnX - 40, finalY, { align: 'right' });
    doc.text(formatPdfCurrency(proforma.taxAmount || 0, currency), rightColumnX, finalY, { align: 'right' });
    finalY += 6;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total:`, rightColumnX - 40, finalY, { align: 'right' });
    doc.text(formatPdfCurrency(proforma.total || 0, currency), rightColumnX, finalY, { align: 'right' });

    // Amount in Words
    finalY += 10;
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Amount in Words:', margin, finalY);
    finalY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    const amountWords = numberToWords(Number(proforma.total) || 0, currency);
    doc.text(`${amountWords.charAt(0).toUpperCase() + amountWords.slice(1)} Only`, margin, finalY);

    // Notes
    if (proforma.notes) {
        finalY += 15;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', margin, finalY);
        finalY += 5;
        doc.setFont('helvetica', 'normal');
        doc.text(proforma.notes, margin, finalY);
    }

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(branding.footerText || 'Powered by BridgeBreak ERP', pageWidth / 2, 285, { align: 'center' });

    return doc;
};

export const generateProformaInvoicePDF = async (proforma: any) => {
    const doc = await createProformaInvoiceDoc(proforma);
    doc.save(`ProformaInvoice-${proforma.number}.pdf`);
};

// ============ QUOTATION PDF ============
export const createQuotationDoc = async (quotation: any) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const company = getCompanySettings();
    const branding = getBrandingSettings();
    const { primary } = getThemeColors();

    const pageWidth = 210;
    const margin = 15;
    const rightColumnX = pageWidth - margin;

    // Logo
    try {
        if (branding.logo) {
            const logoData = await getBase64ImageFromURL(branding.logo);
            doc.addImage(logoData, 'PNG', margin, 10, 30, 30);
        }
    } catch (e) {}

    // Company Info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.text(company.companyName, margin, 48);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    let yPos = 52;
    if (company.address) {
        const addressLines = company.address.split('\n');
        addressLines.forEach(line => { doc.text(line, margin, yPos); yPos += 4; });
    }
    if (company.phone) { doc.text(`Tel: ${company.phone}`, margin, yPos); yPos += 4; }
    if (company.email) { doc.text(`Email: ${company.email}`, margin, yPos); yPos += 4; }
    if (company.trn || company.taxId) { doc.text(`TRN: ${company.trn || company.taxId}`, margin, yPos); }

    // Header
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTATION', rightColumnX, 20, { align: 'right' });

    doc.setFontSize(10);
    let headerYPos = 28;
    doc.text(`Quotation #: ${quotation.number}`, rightColumnX, headerYPos, { align: 'right' });
    headerYPos += 5;
    doc.text(`Date: ${quotation.date}`, rightColumnX, headerYPos, { align: 'right' });
    headerYPos += 5;
    if (quotation.validUntil) {
        doc.text(`Valid Until: ${quotation.validUntil}`, rightColumnX, headerYPos, { align: 'right' });
    }

    // Quoted To
    const billToY = 75;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTED TO:', margin, billToY);
    doc.setFontSize(11);
    doc.text(quotation.customerName || 'Customer', margin, billToY + 6);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    let customerYPos = billToY + 11;
    if (quotation.customerAddress) {
        const addressLines = quotation.customerAddress.split('\n');
        addressLines.forEach(line => {
            doc.text(line, margin, customerYPos);
            customerYPos += 4;
        });
    }
    if (quotation.customerPhone) { doc.text(`Tel: ${quotation.customerPhone}`, margin, customerYPos); customerYPos += 4; }
    if (quotation.customerEmail) { doc.text(`Email: ${quotation.customerEmail}`, margin, customerYPos); customerYPos += 4; }
    if (quotation.customerVat) { doc.text(`VAT: ${quotation.customerVat}`, margin, customerYPos); }

    // Table
    const tableStartY = customerYPos + 10;
    const currency = company.baseCurrency || 'AED';

    const tableData = quotation.items?.map((item: any, index: number) => [
        (index + 1).toString(),
        item.description || '',
        item.unit || 'pcs',
        item.quantity.toString(),
        formatPdfCurrency(item.unitPrice, currency),
        formatPdfCurrency(item.total, currency)
    ]) || [];

    autoTable(doc, {
        startY: tableStartY,
        head: [['#', 'Description', 'Unit', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [primary.r, primary.g, primary.b],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9
        },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 65 },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 30, halign: 'right' },
            5: { cellWidth: 30, halign: 'right' }
        },
        margin: { left: margin, right: margin }
    });

    // Totals
    let finalY = (doc as any).lastAutoTable?.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Subtotal:`, rightColumnX - 40, finalY, { align: 'right' });
    doc.text(formatPdfCurrency(quotation.subtotal || 0, currency), rightColumnX, finalY, { align: 'right' });
    finalY += 5;
    doc.text(`Tax (${quotation.taxRate || 5}%):`, rightColumnX - 40, finalY, { align: 'right' });
    doc.text(formatPdfCurrency(quotation.taxAmount || 0, currency), rightColumnX, finalY, { align: 'right' });
    finalY += 6;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total:`, rightColumnX - 40, finalY, { align: 'right' });
    doc.text(formatPdfCurrency(quotation.total || 0, currency), rightColumnX, finalY, { align: 'right' });

    // Amount in Words
    finalY += 10;
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Amount in Words:', margin, finalY);
    finalY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    const amountWords = numberToWords(Number(quotation.total) || 0, currency);
    doc.text(`${amountWords.charAt(0).toUpperCase() + amountWords.slice(1)} Only`, margin, finalY);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(branding.footerText || 'Powered by BridgeBreak ERP', pageWidth / 2, 285, { align: 'center' });

    return doc;
};

export const generateQuotationPDF = async (quotation: any) => {
    const doc = await createQuotationDoc(quotation);
    doc.save(`Quotation-${quotation.number}.pdf`);
};

// ============ DELIVERY NOTE PDF ============
export const createDeliveryNoteDoc = async (deliveryNote: any) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const company = getCompanySettings();
    const branding = getBrandingSettings();
    const { primary } = getThemeColors();

    const pageWidth = 210;
    const margin = 15;
    const rightColumnX = pageWidth - margin;

    // Logo
    try {
        if (branding.logo) {
            const logoData = await getBase64ImageFromURL(branding.logo);
            doc.addImage(logoData, 'PNG', margin, 10, 30, 30);
        }
    } catch (e) {}

    // Company Info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.text(company.companyName, margin, 48);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    let companyYPos = 52;
    if (company.address) {
        const addressLines = company.address.split('\n');
        addressLines.forEach(line => { doc.text(line, margin, companyYPos); companyYPos += 4; });
    }
    if (company.phone) { doc.text(`Tel: ${company.phone}`, margin, companyYPos); companyYPos += 4; }
    if (company.email) { doc.text(`Email: ${company.email}`, margin, companyYPos); companyYPos += 4; }
    if (company.trn || company.taxId) { doc.text(`TRN: ${company.trn || company.taxId}`, margin, companyYPos); }

    // Header
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('DELIVERY NOTE', rightColumnX, 20, { align: 'right' });

    doc.setFontSize(10);
    let headerYPos = 28;
    doc.text(`DN #: ${deliveryNote.number}`, rightColumnX, headerYPos, { align: 'right' });
    headerYPos += 5;
    doc.text(`Date: ${deliveryNote.date}`, rightColumnX, headerYPos, { align: 'right' });
    headerYPos += 5;
    if (deliveryNote.deliveryDate) {
        doc.text(`Delivery Date: ${deliveryNote.deliveryDate}`, rightColumnX, headerYPos, { align: 'right' });
    }

    // Deliver To
    const billToY = 75;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DELIVER TO:', margin, billToY);
    doc.setFontSize(11);
    doc.text(deliveryNote.customerName || 'Customer', margin, billToY + 6);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    let customerYPos = billToY + 11;
    if (deliveryNote.customerAddress) {
        const addressLines = deliveryNote.customerAddress.split('\n');
        addressLines.forEach(line => {
            doc.text(line, margin, customerYPos);
            customerYPos += 4;
        });
    }
    if (deliveryNote.customerPhone) { doc.text(`Tel: ${deliveryNote.customerPhone}`, margin, customerYPos); customerYPos += 4; }
    if (deliveryNote.customerEmail) { doc.text(`Email: ${deliveryNote.customerEmail}`, margin, customerYPos); customerYPos += 4; }

    if (deliveryNote.driverName || deliveryNote.vehicleNumber) {
        doc.text('Driver Info:', margin, customerYPos); customerYPos += 4;
        if (deliveryNote.driverName) { doc.text(`Driver: ${deliveryNote.driverName}`, margin, customerYPos); customerYPos += 4; }
        if (deliveryNote.vehicleNumber) { doc.text(`Vehicle: ${deliveryNote.vehicleNumber}`, margin, customerYPos); }
    }

    // Table
    const tableStartY = customerYPos + 10;
    const tableData = deliveryNote.items?.map((item: any, index: number) => [
        (index + 1).toString(),
        item.description || '',
        item.unit || 'pcs',
        item.quantity.toString()
    ]) || [];

    autoTable(doc, {
        startY: tableStartY,
        head: [['#', 'Description', 'Unit', 'Qty']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [primary.r, primary.g, primary.b],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9
        },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 85 },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 30, halign: 'center' }
        },
        margin: { left: margin, right: margin }
    });

    // Total Items
    let finalY = (doc as any).lastAutoTable?.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Items: ${deliveryNote.items?.length || 0}`, margin, finalY);

    // Invoice Ref
    if (deliveryNote.invoiceRef) {
        finalY += 8;
        doc.setFontSize(10);
        doc.text(`Invoice Ref: ${deliveryNote.invoiceRef}`, margin, finalY);
    }

    // Notes
    if (deliveryNote.notes) {
        finalY += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', margin, finalY);
        finalY += 5;
        doc.setFont('helvetica', 'normal');
        doc.text(deliveryNote.notes, margin, finalY);
    }

    // Signature Area
    finalY = 250;
    doc.setFontSize(10);
    doc.text('Received By:', margin, finalY);
    doc.text('Delivered By:', rightColumnX, finalY, { align: 'right' });
    finalY += 15;
    doc.setFontSize(9);
    doc.text('Name: ____________________', margin, finalY);
    doc.text('Name: ____________________', rightColumnX, finalY, { align: 'right' });
    finalY += 8;
    doc.text('Signature: ____________________', margin, finalY);
    doc.text('Signature: ____________________', rightColumnX, finalY, { align: 'right' });

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(branding.footerText || 'Powered by BridgeBreak ERP', pageWidth / 2, 285, { align: 'center' });

    return doc;
};

export const generateDeliveryNotePDF = async (deliveryNote: any) => {
    const doc = await createDeliveryNoteDoc(deliveryNote);
    doc.save(`DeliveryNote-${deliveryNote.number}.pdf`);
};

// ============ LEGACY FUNCTIONS FOR FINANCE MODULE ============
export const createQuotationDocLegacy = async (quotation: Quotation, client: User | null) => {
    return createQuotationDoc(quotation as any);
};

export const generateQuotationPDFLegacy = async (quotation: Quotation, client: User | null) => {
    const doc = await createQuotationDocLegacy(quotation, client);
    doc.save(`${quotation.quotation_number}.pdf`);
};

export const createInvoiceDocLegacy = async (invoice: any, client: User | null, project: Project | null) => {
    return createSalesInvoiceDoc(invoice);
};

export const generateInvoicePDFLegacy = async (invoice: any, client: User | null, project: Project | null) => {
    const doc = await createInvoiceDocLegacy(invoice, client, project);
    doc.save(`Invoice-${invoice.invoice_number}.pdf`);
};

// ============ PURCHASE ORDER PDF ============
export const createPurchaseOrderDoc = async (purchaseOrder: any) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const company = getCompanySettings();
    const branding = getBrandingSettings();
    const { primary } = getThemeColors();

    const pageWidth = 210;
    const margin = 15;
    const rightColumnX = pageWidth - margin;

    // Logo
    try {
        if (branding.logo) {
            const logoData = await getBase64ImageFromURL(branding.logo);
            doc.addImage(logoData, 'PNG', margin, 10, 30, 30);
        }
    } catch (e) {}

    // Company Info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.text(company.companyName, margin, 48);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    let yPos = 52;
    if (company.address) {
        const addressLines = company.address.split('\n');
        addressLines.forEach(line => { doc.text(line, margin, yPos); yPos += 4; });
    }
    if (company.phone) { doc.text(`Tel: ${company.phone}`, margin, yPos); yPos += 4; }
    if (company.email) { doc.text(`Email: ${company.email}`, margin, yPos); yPos += 4; }
    if (company.trn || company.taxId) { doc.text(`TRN: ${company.trn || company.taxId}`, margin, yPos); }

    // Header
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('PURCHASE ORDER', rightColumnX, 20, { align: 'right' });

    doc.setFontSize(10);
    yPos = 28;
    doc.text(`PO #: ${purchaseOrder.number}`, rightColumnX, yPos, { align: 'right' });
    yPos += 5;
    doc.text(`Date: ${purchaseOrder.date}`, rightColumnX, yPos, { align: 'right' });
    yPos += 5;
    if (purchaseOrder.expectedDate) {
        doc.text(`Expected: ${purchaseOrder.expectedDate}`, rightColumnX, yPos, { align: 'right' });
    }

    // Supplier Info
    const billToY = 75;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SUPPLIER:', margin, billToY);
    doc.setFontSize(11);
    doc.text(purchaseOrder.supplierName || 'Supplier Name', margin, billToY + 6);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    let supplierYPos = billToY + 11;
    if (purchaseOrder.supplierAddress) {
        const addressLines = purchaseOrder.supplierAddress.split('\n');
        addressLines.forEach(line => {
            doc.text(line, margin, supplierYPos);
            supplierYPos += 4;
        });
    }
    if (purchaseOrder.supplierPhone) { doc.text(`Tel: ${purchaseOrder.supplierPhone}`, margin, supplierYPos); supplierYPos += 4; }
    if (purchaseOrder.supplierEmail) { doc.text(`Email: ${purchaseOrder.supplierEmail}`, margin, supplierYPos); supplierYPos += 4; }
    if (purchaseOrder.supplierVat) { doc.text(`VAT: ${purchaseOrder.supplierVat}`, margin, supplierYPos); }

    // Table
    const tableStartY = supplierYPos + 10;
    const currency = company.baseCurrency || 'AED';

    const tableData = purchaseOrder.items?.map((item: any, index: number) => [
        (index + 1).toString(),
        item.description || '',
        item.unit || 'pcs',
        item.quantity.toString(),
        formatPdfCurrency(item.unitPrice, currency),
        formatPdfCurrency(item.total, currency)
    ]) || [];

    autoTable(doc, {
        startY: tableStartY,
        head: [['#', 'Description', 'Unit', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [primary.r, primary.g, primary.b],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9
        },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 65 },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 30, halign: 'right' },
            5: { cellWidth: 30, halign: 'right' }
        },
        margin: { left: margin, right: margin }
    });

    // Totals
    let finalY = (doc as any).lastAutoTable?.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Subtotal:`, rightColumnX - 40, finalY, { align: 'right' });
    doc.text(formatPdfCurrency(purchaseOrder.subtotal || 0, currency), rightColumnX, finalY, { align: 'right' });
    finalY += 5;
    doc.text(`Tax (${purchaseOrder.taxRate || 5}%):`, rightColumnX - 40, finalY, { align: 'right' });
    doc.text(formatPdfCurrency(purchaseOrder.taxAmount || 0, currency), rightColumnX, finalY, { align: 'right' });
    finalY += 6;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total:`, rightColumnX - 40, finalY, { align: 'right' });
    doc.text(formatPdfCurrency(purchaseOrder.total || 0, currency), rightColumnX, finalY, { align: 'right' });

    // Amount in Words
    finalY += 10;
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Amount in Words:', margin, finalY);
    finalY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    const amountWords = numberToWords(Number(purchaseOrder.total) || 0, currency);
    doc.text(`${amountWords.charAt(0).toUpperCase() + amountWords.slice(1)} Only`, margin, finalY);

    // Terms & Conditions
    if (purchaseOrder.terms) {
        finalY += 12;
        doc.setTextColor(primary.r, primary.g, primary.b);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Terms & Conditions:', margin, finalY);
        finalY += 5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(9);
        const splitTerms = doc.splitTextToSize(purchaseOrder.terms, 180);
        doc.text(splitTerms, margin, finalY);
    }

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(branding.footerText || 'Powered by BridgeBreak ERP', pageWidth / 2, 285, { align: 'center' });

    return doc;
};

export const generatePurchaseOrderPDF = async (purchaseOrder: any) => {
    const doc = await createPurchaseOrderDoc(purchaseOrder);
    doc.save(`PurchaseOrder-${purchaseOrder.number}.pdf`);
};

// ============ PURCHASE BILL PDF ============
export const createPurchaseBillDoc = async (purchaseBill: any) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const company = getCompanySettings();
    const branding = getBrandingSettings();
    const { primary } = getThemeColors();

    const pageWidth = 210;
    const margin = 15;
    const rightColumnX = pageWidth - margin;

    // Logo
    try {
        if (branding.logo) {
            const logoData = await getBase64ImageFromURL(branding.logo);
            doc.addImage(logoData, 'PNG', margin, 10, 30, 30);
        }
    } catch (e) {}

    // Company Info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.text(company.companyName, margin, 48);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    let yPos = 52;
    if (company.address) {
        const addressLines = company.address.split('\n');
        addressLines.forEach(line => { doc.text(line, margin, yPos); yPos += 4; });
    }
    if (company.phone) { doc.text(`Tel: ${company.phone}`, margin, yPos); yPos += 4; }
    if (company.email) { doc.text(`Email: ${company.email}`, margin, yPos); yPos += 4; }
    if (company.trn || company.taxId) { doc.text(`TRN: ${company.trn || company.taxId}`, margin, yPos); }

    // Header
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('PURCHASE BILL', rightColumnX, 20, { align: 'right' });

    doc.setFontSize(10);
    yPos = 28;
    doc.text(`Bill #: ${purchaseBill.number}`, rightColumnX, yPos, { align: 'right' });
    yPos += 5;
    doc.text(`Date: ${purchaseBill.date}`, rightColumnX, yPos, { align: 'right' });
    yPos += 5;
    doc.text(`Due Date: ${purchaseBill.dueDate}`, rightColumnX, yPos, { align: 'right' });

    // Supplier Info
    const billToY = 75;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SUPPLIER:', margin, billToY);
    doc.setFontSize(11);
    doc.text(purchaseBill.supplierName || 'Supplier Name', margin, billToY + 6);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    let supplierYPos = billToY + 11;
    if (purchaseBill.supplierAddress) {
        const addressLines = purchaseBill.supplierAddress.split('\n');
        addressLines.forEach(line => {
            doc.text(line, margin, supplierYPos);
            supplierYPos += 4;
        });
    }
    if (purchaseBill.supplierPhone) { doc.text(`Tel: ${purchaseBill.supplierPhone}`, margin, supplierYPos); supplierYPos += 4; }
    if (purchaseBill.supplierEmail) { doc.text(`Email: ${purchaseBill.supplierEmail}`, margin, supplierYPos); supplierYPos += 4; }
    if (purchaseBill.supplierVat) { doc.text(`VAT: ${purchaseBill.supplierVat}`, margin, supplierYPos); }

    // Table
    const tableStartY = supplierYPos + 10;
    const currency = company.baseCurrency || 'AED';

    const tableData = purchaseBill.items?.map((item: any, index: number) => [
        (index + 1).toString(),
        item.description || '',
        item.unit || 'pcs',
        item.quantity.toString(),
        formatPdfCurrency(item.unitPrice, currency),
        formatPdfCurrency(item.total, currency)
    ]) || [];

    autoTable(doc, {
        startY: tableStartY,
        head: [['#', 'Description', 'Unit', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [primary.r, primary.g, primary.b],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9
        },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 65 },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 30, halign: 'right' },
            5: { cellWidth: 30, halign: 'right' }
        },
        margin: { left: margin, right: margin }
    });

    // Totals
    let finalY = (doc as any).lastAutoTable?.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Subtotal:`, rightColumnX - 40, finalY, { align: 'right' });
    doc.text(formatPdfCurrency(purchaseBill.subtotal || 0, currency), rightColumnX, finalY, { align: 'right' });
    finalY += 5;
    doc.text(`Tax (${purchaseBill.taxRate || 5}%):`, rightColumnX - 40, finalY, { align: 'right' });
    doc.text(formatPdfCurrency(purchaseBill.taxAmount || 0, currency), rightColumnX, finalY, { align: 'right' });
    finalY += 6;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total:`, rightColumnX - 40, finalY, { align: 'right' });
    doc.text(formatPdfCurrency(purchaseBill.total || 0, currency), rightColumnX, finalY, { align: 'right' });

    // Amount in Words
    finalY += 10;
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Amount in Words:', margin, finalY);
    finalY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    const amountWords = numberToWords(Number(purchaseBill.total) || 0, currency);
    doc.text(`${amountWords.charAt(0).toUpperCase() + amountWords.slice(1)} Only`, margin, finalY);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(branding.footerText || 'Powered by BridgeBreak ERP', pageWidth / 2, 285, { align: 'center' });

    return doc;
};

export const generatePurchaseBillPDF = async (purchaseBill: any) => {
    const doc = await createPurchaseBillDoc(purchaseBill);
    doc.save(`PurchaseBill-${purchaseBill.number}.pdf`);
};

// ============ PAYMENT VOUCHER PDF ============
export const createPaymentVoucherDoc = async (paymentVoucher: any) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const company = getCompanySettings();
    const branding = getBrandingSettings();
    const { primary } = getThemeColors();

    const pageWidth = 210;
    const margin = 15;
    const rightColumnX = pageWidth - margin;

    // Logo
    try {
        if (branding.logo) {
            const logoData = await getBase64ImageFromURL(branding.logo);
            doc.addImage(logoData, 'PNG', margin, 10, 30, 30);
        }
    } catch (e) {}

    // Company Info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.text(company.companyName, margin, 48);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    let yPos = 52;
    if (company.address) {
        const addressLines = company.address.split('\n');
        addressLines.forEach(line => { doc.text(line, margin, yPos); yPos += 4; });
    }
    if (company.phone) { doc.text(`Tel: ${company.phone}`, margin, yPos); yPos += 4; }
    if (company.email) { doc.text(`Email: ${company.email}`, margin, yPos); yPos += 4; }
    if (company.trn || company.taxId) { doc.text(`TRN: ${company.trn || company.taxId}`, margin, yPos); }

    // Header
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT VOUCHER', rightColumnX, 20, { align: 'right' });

    doc.setFontSize(10);
    yPos = 28;
    doc.text(`Voucher #: ${paymentVoucher.number}`, rightColumnX, yPos, { align: 'right' });
    yPos += 5;
    doc.text(`Date: ${paymentVoucher.date}`, rightColumnX, yPos, { align: 'right' });
    yPos += 5;
    doc.text(`Payment Method: ${paymentVoucher.paymentMethod || 'Bank Transfer'}`, rightColumnX, yPos, { align: 'right' });

    // Payee Info
    const billToY = 75;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYEE:', margin, billToY);
    doc.setFontSize(11);
    doc.text(paymentVoucher.payeeName || 'Payee Name', margin, billToY + 6);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    let payeeYPos = billToY + 11;
    if (paymentVoucher.payeeAddress) {
        const addressLines = paymentVoucher.payeeAddress.split('\n');
        addressLines.forEach(line => {
            doc.text(line, margin, payeeYPos);
            payeeYPos += 4;
        });
    }
    if (paymentVoucher.payeePhone) { doc.text(`Tel: ${paymentVoucher.payeePhone}`, margin, payeeYPos); payeeYPos += 4; }
    if (paymentVoucher.payeeEmail) { doc.text(`Email: ${paymentVoucher.payeeEmail}`, margin, payeeYPos); payeeYPos += 4; }

    // Payment Details Box
    const paymentDetailsY = payeeYPos + 10;
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, paymentDetailsY - 5, pageWidth - 2 * margin, 30);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Details:', margin + 5, paymentDetailsY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Reference: ${paymentVoucher.reference || ''}`, margin + 5, paymentDetailsY + 12);
    doc.text(`Amount: ${formatPdfCurrency(paymentVoucher.amount || 0, company.baseCurrency || 'AED')}`, margin + 5, paymentDetailsY + 19);

    // Amount in Words
    let amountWordsY = paymentDetailsY + 40;
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Amount in Words:', margin, amountWordsY);
    amountWordsY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    const amountWords = numberToWords(Number(paymentVoucher.amount) || 0, company.baseCurrency || 'AED');
    doc.text(`${amountWords.charAt(0).toUpperCase() + amountWords.slice(1)} Only`, margin, amountWordsY);

    // Authorization
    let authY = 250;
    doc.setFontSize(10);
    doc.text('Prepared By:', margin, authY);
    doc.text('Approved By:', pageWidth / 2, authY);
    authY += 15;
    doc.setFontSize(9);
    doc.text('________________________', margin, authY);
    doc.text('________________________', pageWidth / 2, authY);
    authY += 8;
    doc.text('Signature & Date', margin, authY);
    doc.text('Signature & Date', pageWidth / 2, authY);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(branding.footerText || 'Powered by BridgeBreak ERP', pageWidth / 2, 285, { align: 'center' });

    return doc;
};

export const generatePaymentVoucherPDF = async (paymentVoucher: any) => {
    const doc = await createPaymentVoucherDoc(paymentVoucher);
    doc.save(`PaymentVoucher-${paymentVoucher.number}.pdf`);
};

// ============ RECEIPT VOUCHER PDF ============
export const createReceiptVoucherDoc = async (receiptVoucher: any) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const company = getCompanySettings();
    const branding = getBrandingSettings();
    const { primary } = getThemeColors();

    const pageWidth = 210;
    const margin = 15;
    const rightColumnX = pageWidth - margin;

    // Logo
    try {
        if (branding.logo) {
            const logoData = await getBase64ImageFromURL(branding.logo);
            doc.addImage(logoData, 'PNG', margin, 10, 30, 30);
        }
    } catch (e) {}

    // Company Info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.text(company.companyName, margin, 48);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    let yPos = 52;
    if (company.address) {
        const addressLines = company.address.split('\n');
        addressLines.forEach(line => { doc.text(line, margin, yPos); yPos += 4; });
    }
    if (company.phone) { doc.text(`Tel: ${company.phone}`, margin, yPos); yPos += 4; }
    if (company.email) { doc.text(`Email: ${company.email}`, margin, yPos); yPos += 4; }
    if (company.trn || company.taxId) { doc.text(`TRN: ${company.trn || company.taxId}`, margin, yPos); }

    // Header
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('RECEIPT VOUCHER', rightColumnX, 20, { align: 'right' });

    doc.setFontSize(10);
    yPos = 28;
    doc.text(`Receipt #: ${receiptVoucher.number}`, rightColumnX, yPos, { align: 'right' });
    yPos += 5;
    doc.text(`Date: ${receiptVoucher.date}`, rightColumnX, yPos, { align: 'right' });
    yPos += 5;
    doc.text(`Payment Method: ${receiptVoucher.paymentMethod || 'Bank Transfer'}`, rightColumnX, yPos, { align: 'right' });

    // Received From
    const billToY = 75;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('RECEIVED FROM:', margin, billToY);
    doc.setFontSize(11);
    doc.text(receiptVoucher.customerName || 'Customer Name', margin, billToY + 6);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    let customerYPos = billToY + 11;
    if (receiptVoucher.customerAddress) {
        const addressLines = receiptVoucher.customerAddress.split('\n');
        addressLines.forEach(line => {
            doc.text(line, margin, customerYPos);
            customerYPos += 4;
        });
    }
    if (receiptVoucher.customerPhone) { doc.text(`Tel: ${receiptVoucher.customerPhone}`, margin, customerYPos); customerYPos += 4; }
    if (receiptVoucher.customerEmail) { doc.text(`Email: ${receiptVoucher.customerEmail}`, margin, customerYPos); customerYPos += 4; }

    // Payment Details Box
    const paymentDetailsY = customerYPos + 10;
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, paymentDetailsY - 5, pageWidth - 2 * margin, 30);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Details:', margin + 5, paymentDetailsY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Reference: ${receiptVoucher.reference || ''}`, margin + 5, paymentDetailsY + 12);
    doc.text(`Amount: ${formatPdfCurrency(receiptVoucher.amount || 0, company.baseCurrency || 'AED')}`, margin + 5, paymentDetailsY + 19);

    // Amount in Words
    let amountWordsY = paymentDetailsY + 40;
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Amount in Words:', margin, amountWordsY);
    amountWordsY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    const amountWords = numberToWords(Number(receiptVoucher.amount) || 0, company.baseCurrency || 'AED');
    doc.text(`${amountWords.charAt(0).toUpperCase() + amountWords.slice(1)} Only`, margin, amountWordsY);

    // Authorization
    let authY = 250;
    doc.setFontSize(10);
    doc.text('Received By:', margin, authY);
    doc.text('Approved By:', pageWidth / 2, authY);
    authY += 15;
    doc.setFontSize(9);
    doc.text('________________________', margin, authY);
    doc.text('________________________', pageWidth / 2, authY);
    authY += 8;
    doc.text('Signature & Date', margin, authY);
    doc.text('Signature & Date', pageWidth / 2, authY);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(branding.footerText || 'Powered by BridgeBreak ERP', pageWidth / 2, 285, { align: 'center' });

    return doc;
};

export const generateReceiptVoucherPDF = async (receiptVoucher: any) => {
    const doc = await createReceiptVoucherDoc(receiptVoucher);
    doc.save(`ReceiptVoucher-${receiptVoucher.number}.pdf`);
};
