import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice, Project, User, Quotation } from './db/types';

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

const formatCurrency = (amount: number, currency: string = 'USD') => {
    // Format number with commas and 2 decimal places
    const formattedNumber = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // Currency symbols that work in PDF
    const symbols: Record<string, string> = {
        'USD': '$',
        'EUR': 'EUR',
        'GBP': 'GBP',
        'INR': 'INR',
        'AUD': 'AUD',
        'CAD': 'CAD',
        'SGD': 'SGD'
    };

    const symbol = symbols[currency] || currency;

    // For USD, put symbol before. For others, put after with space
    if (currency === 'USD') {
        return `${symbol}${formattedNumber}`;
    }

    return `${symbol} ${formattedNumber}`;
};

export const createQuotationDoc = async (quotation: Quotation, client: User | null) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = 210; // A4 width in mm
    const margin = 15;
    const rightColumnX = pageWidth - margin;

    // Add Logo (Left side, top)
    try {
        const logoData = await getBase64ImageFromURL('/logo_trans_(4884x4884)px_for_white_bg.png');
        doc.addImage(logoData, 'PNG', margin, 10, 35, 35);
    } catch (error) {
        console.warn('Could not load logo for PDF:', error);
    }

    // Header - QUOTATION (Right side, aligned right)
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('QUOTATION', rightColumnX, 20, { align: 'right' });

    // Quotation details (Right side, aligned right)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let yPos = 28;

    doc.text(`Quotation #: ${quotation.quotation_number}`, rightColumnX, yPos, { align: 'right' });
    yPos += 5;
    doc.text(`Date: ${new Date(quotation.created_at).toLocaleDateString()}`, rightColumnX, yPos, { align: 'right' });
    yPos += 5;

    if (quotation.valid_until) {
        try {
            const validDate = new Date(quotation.valid_until);
            if (!isNaN(validDate.getTime())) {
                doc.text(`Valid Until: ${validDate.toLocaleDateString()}`, rightColumnX, yPos, { align: 'right' });
                yPos += 5;
            }
        } catch (e) {
            console.warn('Invalid valid_until date:', quotation.valid_until);
        }
    }

    if (quotation.project_title) {
        doc.text(`Project: ${quotation.project_title}`, rightColumnX, yPos, { align: 'right' });
        yPos += 5;
    }

    // From Section (Left side)
    let leftY = 55;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('From:', margin, leftY);

    leftY += 6;
    doc.setFontSize(12);
    doc.text('System Steel Engineering', margin, leftY);

    leftY += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Your Professional Solution Partner', margin, leftY);

    leftY += 5;
    doc.text('support@systemsteel.ae', margin, leftY);

    leftY += 5;
    doc.text('+91 6385362719', margin, leftY);

    // To Section (Right side, aligned right)
    let rightY = 55;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('To:', rightColumnX, rightY, { align: 'right' });

    rightY += 6;
    doc.setFontSize(12);
    doc.setFontSize(12);

    if (quotation.client_is_company) {
        // Company prominent
        const companyName = quotation.client_company || 'Company Name';
        doc.text(companyName, rightColumnX, rightY, { align: 'right' });
        rightY += 5;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        if (quotation.client_name) {
            doc.text(`Attn: ${quotation.client_name}`, rightColumnX, rightY, { align: 'right' });
            rightY += 5;
        }
    } else {
        // Person prominent
        const clientName = quotation.client_name || client?.full_name || 'Client Name';
        doc.text(clientName, rightColumnX, rightY, { align: 'right' });
        rightY += 5;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        if (quotation.client_company) {
            doc.text(quotation.client_company, rightColumnX, rightY, { align: 'right' });
            rightY += 5;
        }
    }

    if (quotation.client_address) {
        doc.text(quotation.client_address, rightColumnX, rightY, { align: 'right' });
        rightY += 5;
    }

    const clientEmail = quotation.client_email || client?.email || '';
    if (clientEmail) {
        doc.text(clientEmail, rightColumnX, rightY, { align: 'right' });
        rightY += 5;
    }

    // Table starts after both columns
    const tableStartY = Math.max(leftY, rightY) + 10;

    const currency = quotation.currency || 'USD';
    const tableData = quotation.items.map(item => [
        item.description || '',
        item.quantity.toString(),
        formatCurrency(item.unit_price, currency),
        formatCurrency(item.total, currency)
    ]);

    autoTable(doc, {
        startY: tableStartY,
        head: [['Description', 'Quantity', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 2,
            overflow: 'linebreak',
            cellWidth: 'wrap',
            lineColor: [200, 200, 200],
            lineWidth: 0.1
        },
        headStyles: {
            fillColor: [51, 51, 51],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'left',
            valign: 'middle'
        },
        bodyStyles: {
            textColor: [0, 0, 0],
            valign: 'top'
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        columnStyles: {
            0: { cellWidth: 'auto', halign: 'left' },   // Description - auto width
            1: { cellWidth: 20, halign: 'center' },      // Quantity
            2: { cellWidth: 30, halign: 'right' },       // Unit Price
            3: { cellWidth: 30, halign: 'right' }        // Total
        },
        margin: { left: margin, right: margin }
    });

    // Total Amount (Right aligned)
    let finalY = (doc as any).lastAutoTable?.finalY || tableStartY + 50;
    finalY += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount: ${formatCurrency(quotation.amount, currency)}`, rightColumnX, finalY, { align: 'right' });

    finalY += 15;

    // Notes Section
    if (quotation.notes) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', margin, finalY);

        finalY += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        const splitNotes = doc.splitTextToSize(quotation.notes, pageWidth - (2 * margin));
        doc.text(splitNotes, margin, finalY);
        finalY += splitNotes.length * 5;
    }

    // Footer (centered at bottom)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Powered by System Steel Engineering Software', pageWidth / 2, 285, { align: 'center' });

    return doc;
};

export const generateQuotationPDF = async (quotation: Quotation, client: User | null) => {
    const doc = await createQuotationDoc(quotation, client);
    doc.save(`${quotation.quotation_number}.pdf`);
};

export const createInvoiceDoc = async (invoice: any, client: User | null, project: Project | null) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = 210;
    const margin = 15;
    const rightColumnX = pageWidth - margin;

    // Add Logo
    try {
        const logoData = await getBase64ImageFromURL('/logo_trans_(4884x4884)px_for_white_bg.png');
        doc.addImage(logoData, 'PNG', margin, 10, 35, 35);
    } catch (error) {
        console.warn('Could not load logo for PDF:', error);
    }

    // Header - TAX INVOICE
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('TAX INVOICE', rightColumnX, 20, { align: 'right' });

    // Details/Meta
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let yPos = 28;

    doc.text(`Invoice #: ${invoice.invoice_number}`, rightColumnX, yPos, { align: 'right' });
    yPos += 5;
    
    if (invoice.issue_date) {
        doc.text(`Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, rightColumnX, yPos, { align: 'right' });
        yPos += 5;
    }
    
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, rightColumnX, yPos, { align: 'right' });
    yPos += 5;

    if (invoice.payment_terms) {
        const termsLabels: Record<string, string> = {
            'immediate': 'Due on Receipt',
            'net_7': 'Net 7 Days',
            'net_15': 'Net 15 Days',
            'net_30': 'Net 30 Days',
            'net_60': 'Net 60 Days',
            'net_90': 'Net 90 Days',
        };
        doc.text(`Terms: ${termsLabels[invoice.payment_terms] || invoice.payment_terms}`, rightColumnX, yPos, { align: 'right' });
        yPos += 5;
    }

    // From Section (Company Details)
    let leftY = 55;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('From:', margin, leftY);

    leftY += 6;
    doc.setFontSize(12);
    const companyName = invoice.manual_company_name || 'System Steel Engineering LLC';
    doc.text(companyName, margin, leftY);

    leftY += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const companyAddress = invoice.manual_company_address || 'Warehouse 4, Al Quoz Industrial Area\nDubai, UAE';
    const addressLines = companyAddress.split('\n');
    addressLines.forEach((line: string) => {
        doc.text(line, margin, leftY);
        leftY += 4;
    });

    const companyTaxId = invoice.manual_company_tax_id || '100123456789003';
    doc.text(`TRN: ${companyTaxId}`, margin, leftY);
    leftY += 4;

    if (invoice.manual_company_phone) {
        doc.text(`Tel: ${invoice.manual_company_phone}`, margin, leftY);
        leftY += 4;
    }
    if (invoice.manual_company_email) {
        doc.text(invoice.manual_company_email, margin, leftY);
        leftY += 4;
    }

    // To Section (Client Details)
    let rightY = 55;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', rightColumnX, rightY, { align: 'right' });

    rightY += 6;
    doc.setFontSize(12);
    const clientName = invoice.manual_client_name || client?.full_name || 'Valued Client';
    doc.text(clientName, rightColumnX, rightY, { align: 'right' });
    rightY += 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (invoice.manual_client_address) {
        const clientAddressLines = invoice.manual_client_address.split('\n');
        clientAddressLines.forEach((line: string) => {
            doc.text(line, rightColumnX, rightY, { align: 'right' });
            rightY += 4;
        });
    }

    const clientEmail = invoice.manual_client_email || client?.email;
    if (clientEmail) {
        doc.text(clientEmail, rightColumnX, rightY, { align: 'right' });
        rightY += 4;
    }

    if (invoice.manual_client_tax_id) {
        doc.text(`TRN: ${invoice.manual_client_tax_id}`, rightColumnX, rightY, { align: 'right' });
        rightY += 4;
    }

    if (project) {
        doc.text(`Project: ${project.title}`, rightColumnX, rightY, { align: 'right' });
        rightY += 4;
    }

    // Table with line items
    const tableStartY = Math.max(leftY, rightY) + 10;
    const currency = invoice.currency || 'AED';

    // Check if we have line items or old-style single description
    const hasLineItems = invoice.line_items && invoice.line_items.length > 0;
    const showTaxColumn = hasLineItems && invoice.line_items.some((item: any) => item.tax_rate);

    let tableData: any[] = [];
    let tableHeaders: string[] = [];

    if (hasLineItems) {
        tableHeaders = showTaxColumn 
            ? ['Description', 'Quantity', 'Unit Price', 'Tax %', 'Total']
            : ['Description', 'Quantity', 'Unit Price', 'Total'];

        tableData = invoice.line_items.map((item: any) => {
            const row = [
                item.description || '',
                item.quantity.toString(),
                formatCurrency(item.unit_price, currency),
            ];
            if (showTaxColumn) {
                row.push(`${item.tax_rate || 0}%`);
            }
            row.push(formatCurrency(item.quantity * item.unit_price, currency));
            return row;
        });
    } else {
        // Fallback to old structure
        tableHeaders = ['Description', 'Quantity', 'Amount', 'Total'];
        tableData = [[
            invoice.description || 'Professional Services',
            '1',
            formatCurrency(invoice.amount, currency),
            formatCurrency(invoice.amount, currency)
        ]];
    }

    autoTable(doc, {
        startY: tableStartY,
        head: [tableHeaders],
        body: tableData,
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 2,
            overflow: 'linebreak',
            cellWidth: 'wrap',
            lineColor: [200, 200, 200],
            lineWidth: 0.1
        },
        headStyles: {
            fillColor: [51, 51, 51],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'left',
            valign: 'middle'
        },
        bodyStyles: {
            textColor: [0, 0, 0],
            valign: 'top'
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        columnStyles: showTaxColumn ? {
            0: { cellWidth: 'auto', halign: 'left' },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 28, halign: 'right' },
            3: { cellWidth: 18, halign: 'center' },
            4: { cellWidth: 28, halign: 'right' }
        } : {
            0: { cellWidth: 'auto', halign: 'left' },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 30, halign: 'right' },
            3: { cellWidth: 30, halign: 'right' }
        },
        margin: { left: margin, right: margin }
    });

    let finalY = (doc as any).lastAutoTable?.finalY || tableStartY + 30;
    finalY += 10;

    // Financial Summary
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Calculate totals if we have line items
    if (hasLineItems) {
        const subtotal = invoice.line_items.reduce((acc: number, item: any) => 
            acc + (item.quantity * item.unit_price), 0);
        
        doc.text(`Subtotal: ${formatCurrency(subtotal, currency)}`, rightColumnX, finalY, { align: 'right' });
        finalY += 5;

        // Discount
        if (invoice.discount_value && invoice.discount_value > 0) {
            const discount = invoice.discount_type === 'percentage' 
                ? subtotal * (invoice.discount_value / 100)
                : invoice.discount_value;
            doc.setTextColor(220, 38, 38); // Red color for discount
            doc.text(`Discount: -${formatCurrency(discount, currency)}`, rightColumnX, finalY, { align: 'right' });
            doc.setTextColor(0, 0, 0);
            finalY += 5;
        }

        // Tax
        const tax = invoice.line_items.reduce((acc: number, item: any) => 
            acc + (item.quantity * item.unit_price * (item.tax_rate || 0) / 100), 0);
        doc.text(`Tax (VAT): ${formatCurrency(tax, currency)}`, rightColumnX, finalY, { align: 'right' });
        finalY += 5;

        // Additional Charges
        if (invoice.additional_charges && invoice.additional_charges > 0) {
            const chargesLabel = invoice.additional_charges_description || 'Additional Charges';
            doc.text(`${chargesLabel}: ${formatCurrency(invoice.additional_charges, currency)}`, rightColumnX, finalY, { align: 'right' });
            finalY += 5;
        }
    }

    finalY += 5;

    // Total Amount
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount Due: ${formatCurrency(invoice.amount, currency)}`, rightColumnX, finalY, { align: 'right' });

    finalY += 15;

    // Payment Method
    if (invoice.payment_method) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Payment Method:', margin, finalY);
        finalY += 5;
        doc.setFont('helvetica', 'normal');
        const methodLabels: Record<string, string> = {
            'bank_transfer': 'Bank Transfer',
            'credit_card': 'Credit Card',
            'cash': 'Cash',
            'cheque': 'Cheque',
            'online': 'Online Payment',
        };
        doc.text(methodLabels[invoice.payment_method] || invoice.payment_method, margin, finalY);
        finalY += 10;
    }

    // Terms & Conditions
    if (invoice.terms_conditions) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Terms & Conditions:', margin, finalY);
        finalY += 6;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const splitTerms = doc.splitTextToSize(invoice.terms_conditions, pageWidth - (2 * margin));
        doc.text(splitTerms, margin, finalY);
        finalY += splitTerms.length * 4;
    }

    // Notes
    if (invoice.notes) {
        finalY += 5;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', margin, finalY);
        finalY += 6;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - (2 * margin));
        doc.text(splitNotes, margin, finalY);
        finalY += splitNotes.length * 4;
    }

    // Bank Details
    if (invoice.bank_details) {
        finalY += 10;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Bank Details:', margin, finalY);
        finalY += 6;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        Object.entries(invoice.bank_details).forEach(([key, value]) => {
            doc.text(`${key}: ${value}`, margin, finalY);
            finalY += 4;
        });
    }

    // Footer
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Powered by System Steel Engineering Software', pageWidth / 2, 285, { align: 'center' });

    return doc;
};

export const generateInvoicePDF = async (invoice: any, client: User | null, project: Project | null) => {
    const doc = await createInvoiceDoc(invoice, client, project);
    doc.save(`Invoice-${invoice.invoice_number}.pdf`);
};
