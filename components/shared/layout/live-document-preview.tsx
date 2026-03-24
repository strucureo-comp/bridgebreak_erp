'use client';

import { useSettings } from '@/lib/settings-context';
import { hexToRgb, formatPdfCurrency } from '@/lib/pdf-settings';
import { useCompanySettings } from '@/lib/hooks/use-company-settings';

interface LineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

interface DocumentData {
    number: string;
    date: string;
    dueDate?: string;
    validUntil?: string;
    currency?: string;
    customerName: string;
    items: LineItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    notes?: string;
    driverName?: string;
    vehicleNumber?: string;
    invoiceRef?: string;
    deliveryDate?: string;
    status?: string;
}

interface LiveDocumentPreviewProps {
    data: DocumentData;
    type: 'invoice' | 'proforma' | 'quotation' | 'delivery';
}

export function LiveDocumentPreview({ data, type }: LiveDocumentPreviewProps) {
    const { settings } = useSettings();
    const {
        companyName,
        address,
        phone,
        email,
        taxId,
        baseCurrency,
        taxName,
        logo,
        footerText,
    } = useCompanySettings();

    const colors = (() => {
        const primary = hexToRgb(settings.primaryColor || '#0F172A') || { r: 15, g: 23, b: 42 };
        const accent = hexToRgb(settings.accentColor || '#10B981') || { r: 16, g: 185, b: 129 };
        return { primary, accent };
    })();

    const currency = data.currency || baseCurrency;

    const getTitle = () => {
        switch (type) {
            case 'invoice': return 'TAX INVOICE';
            case 'proforma': return 'PROFORMA INVOICE';
            case 'quotation': return 'QUOTATION';
            case 'delivery': return 'DELIVERY NOTE';
            default: return 'DOCUMENT';
        }
    };

    return (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            {/* Document Preview */}
            <div className="p-6 space-y-4 text-xs" style={{ minHeight: '600px' }}>
                {/* Header Row */}
                <div className="flex justify-between items-start gap-4">
                    {/* Company Info - Left */}
                    <div className="w-1/2">
                        {logo || settings.logoUrl ? (
                            <img src={logo || settings.logoUrl} alt={companyName} className="h-16 w-auto object-contain mb-2" />
                        ) : (
                            <div className="mb-2 flex h-12 w-24 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">
                                {companyName}
                            </div>
                        )}
                        <h3 className="font-bold text-sm" style={{ color: `rgb(${colors.primary.r},${colors.primary.g},${colors.primary.b})` }}>
                            {companyName}
                        </h3>
                        <div className="text-gray-500 mt-1 whitespace-pre-line">
                            {address}
                            {phone && `\nTel: ${phone}`}
                            {email && `\nEmail: ${email}`}
                            {taxId && `\nTRN: ${taxId}`}
                        </div>
                    </div>

                    {/* Document Title - Right */}
                    <div className="w-1/2 text-right">
                        <h2 className="text-2xl font-bold" style={{ color: `rgb(${colors.primary.r},${colors.primary.g},${colors.primary.b})` }}>
                            {getTitle()}
                        </h2>
                        <div className="text-gray-500 mt-2 space-y-1">
                            <p>{type === 'delivery' ? 'DN' : type === 'proforma' ? 'PI' : type === 'quotation' ? 'QT' : 'Invoice'} #: <span className="font-semibold text-gray-800">{data.number}</span></p>
                            <p>Date: <span className="font-semibold">{data.date}</span></p>
                            {(data.dueDate || data.validUntil || data.deliveryDate) && (
                                <p>
                                    {type === 'delivery' ? 'Delivery' : type === 'proforma' ? 'Valid Until' : 'Due'}:
                                    <span className="font-semibold">{data.dueDate || data.validUntil || data.deliveryDate}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t my-4" style={{ borderColor: `rgb(${colors.primary.r},${colors.primary.g},${colors.primary.b})` }} />

                {/* Bill To / Deliver To */}
                <div className="flex justify-between gap-4">
                    <div className="w-1/2">
                        <p className="text-xs font-bold uppercase" style={{ color: `rgb(${colors.primary.r},${colors.primary.g},${colors.primary.b})` }}>
                            {type === 'delivery' ? 'DELIVER TO:' : 'BILL TO:'}
                        </p>
                        <p className="font-semibold text-sm mt-1">{data.customerName || 'Customer Name'}</p>
                    </div>

                    {/* Additional Info for Delivery */}
                    {type === 'delivery' && (data.driverName || data.vehicleNumber || data.invoiceRef) && (
                        <div className="w-1/2 text-right">
                            {data.invoiceRef && <p className="text-xs">Invoice Ref: <span className="font-semibold">{data.invoiceRef}</span></p>}
                            {data.driverName && <p className="text-xs">Driver: <span className="font-semibold">{data.driverName}</span></p>}
                            {data.vehicleNumber && <p className="text-xs">Vehicle: <span className="font-semibold">{data.vehicleNumber}</span></p>}
                        </div>
                    )}
                </div>

                {/* Items Table */}
                <div className="mt-4">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="text-white" style={{ backgroundColor: `rgb(${colors.primary.r},${colors.primary.g},${colors.primary.b})` }}>
                                <th className="text-left p-2 font-bold">Description</th>
                                <th className="text-center p-2 font-bold w-16">Qty</th>
                                {type !== 'delivery' && (
                                    <>
                                        <th className="text-right p-2 font-bold w-24">Unit Price</th>
                                        <th className="text-right p-2 font-bold w-24">Total</th>
                                    </>
                                )}
                                {type === 'delivery' && (
                                    <th className="text-center p-2 font-bold w-20">Unit</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {data.items?.length > 0 ? (
                                data.items.map((item, idx) => (
                                    <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                        <td className="p-2 border-b">{item.description || '-'}</td>
                                        <td className="p-2 border-b text-center">{item.quantity}</td>
                                        {type !== 'delivery' && (
                                            <>
                                                <td className="p-2 border-b text-right">{formatPdfCurrency(item.unitPrice, currency)}</td>
                                                <td className="p-2 border-b text-right">{formatPdfCurrency(item.total, currency)}</td>
                                            </>
                                        )}
                                        {type === 'delivery' && (
                                            <td className="p-2 border-b text-center">{ (item as any).unit || 'pcs'}</td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-4 text-center text-gray-400">No items added yet</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                {type !== 'delivery' && (
                    <div className="flex justify-end mt-4">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Subtotal:</span>
                                <span className="font-medium">{formatPdfCurrency(data.subtotal || 0, currency)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">{`${taxName} (${data.taxRate || 5}%):`}</span>
                                <span className="font-medium">{formatPdfCurrency(data.taxAmount || 0, currency)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2 font-bold text-sm" style={{ color: `rgb(${colors.primary.r},${colors.primary.g},${colors.primary.b})` }}>
                                <span>Total:</span>
                                <span>{formatPdfCurrency(data.total || 0, currency)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delivery Note Total */}
                {type === 'delivery' && (
                    <div className="flex justify-end mt-4">
                        <div className="bg-gray-100 p-3 rounded-lg">
                            <span className="text-xs text-gray-500">Total Items:</span>
                            <p className="text-lg font-bold">{data.items?.length || 0}</p>
                        </div>
                    </div>
                )}

                {/* Bank Details - Only for Invoice */}
                {type === 'invoice' && (settings.bankDetails.bankName || settings.bankDetails.accountNumber) && (
                    <div className="mt-6 pt-4 border-t">
                        <p className="text-xs font-bold mb-2" style={{ color: `rgb(${colors.primary.r},${colors.primary.g},${colors.primary.b})` }}>BANK DETAILS</p>
                        <div className="text-xs text-gray-500 space-y-1">
                            {settings.bankDetails.bankName && <p>Bank: {settings.bankDetails.bankName}</p>}
                            {settings.bankDetails.accountNumber && <p>A/C: {settings.bankDetails.accountNumber}</p>}
                            {settings.bankDetails.iban && <p>IBAN: {settings.bankDetails.iban}</p>}
                            {settings.bankDetails.swiftCode && <p>SWIFT: {settings.bankDetails.swiftCode}</p>}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {data.notes && (
                    <div className="mt-6 pt-4 border-t">
                        <p className="text-xs font-bold mb-1" style={{ color: `rgb(${colors.primary.r},${colors.primary.g},${colors.primary.b})` }}>Notes</p>
                        <p className="text-xs text-gray-500">{data.notes}</p>
                    </div>
                )}

                {/* Signature Area - Delivery Only */}
                {type === 'delivery' && (
                    <div className="mt-12 pt-4 border-t flex justify-between">
                        <div>
                            <p className="text-xs text-gray-500 mb-8">Received By</p>
                            <p className="text-xs">Name: ____________________</p>
                            <p className="text-xs mt-2">Signature: ____________________</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 mb-8">Delivered By</p>
                            <p className="text-xs">Name: ____________________</p>
                            <p className="text-xs mt-2">Signature: ____________________</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-2 text-center text-[10px] text-gray-400 border-t">
                {footerText || `${companyName} | This is a computer-generated document`}
            </div>
        </div>
    );
}
