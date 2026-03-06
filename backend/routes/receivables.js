const express = require('express');
const router = express.Router();
const {
    Customer,
    InvoiceAR,
    Payment,
    PaymentAllocation,
    CreditNote,
    WriteOff,
    Provision,
    AgingSnapshot
} = require('../models/Receivables');
const { JournalEntry, Account } = require('../models/Finance');
const { auth } = require('../middleware/auth');

router.use(auth);

// ── CUSTOMERS ──────────────────────────────────────────────────────────────

router.get('/customers', async (req, res) => {
    try {
        const customers = await Customer.find().sort({ legal_name: 1 }).lean();
        res.json(customers);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

router.post('/customers', async (req, res) => {
    try {
        const count = await Customer.countDocuments();
        const customer_id = `CUST-${String(count + 1001).padStart(4, '0')}`;
        const customer = new Customer({ ...req.body, customer_id });
        await customer.save();
        res.status(201).json(customer);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create customer', detail: err.message });
    }
});

router.put('/customers/:id', async (req, res) => {
    try {
        const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(customer);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

// ── INVOICES ──────────────────────────────────────────────────────────────

router.get('/invoices', async (req, res) => {
    try {
        const invoices = await InvoiceAR.find().sort({ createdAt: -1 }).lean();
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
});

router.post('/invoices', async (req, res) => {
    try {
        const count = await InvoiceAR.countDocuments();
        const invoice_number = `INV-AR-${String(count + 1).padStart(6, '0')}`;

        const { lines = [], ...rest } = req.body;

        const subtotal = lines.reduce((s, l) => s + Number(l.amount || 0), 0);
        const tax_total = lines.reduce((s, l) => s + Number(l.tax_amount || 0), 0);
        const discount_total = lines.reduce((s, l) => s + Number(l.discount || 0), 0);
        const total_amount = subtotal + tax_total;

        const invoice = new InvoiceAR({
            ...rest,
            invoice_number,
            lines,
            subtotal,
            tax_total,
            discount_total,
            total_amount,
            balance_due: total_amount
        });

        await invoice.save();
        res.status(201).json(invoice);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create invoice', detail: err.message });
    }
});

// POST Journal Entry for Invoice
router.post('/invoices/:id/post', async (req, res) => {
    try {
        const inv = await InvoiceAR.findById(req.params.id);
        if (!inv) return res.status(404).json({ error: 'Invoice not found' });
        if (inv.status !== 'draft') return res.status(400).json({ error: 'Only draft invoices can be posted' });

        const customer = await Customer.findOne({ customer_id: inv.customer_id });

        // Create Journal Entry
        // Dr Accounts Receivable (1100)
        // Cr Sales Revenue (4000)
        // Cr VAT Payable (2100)

        const lines = [
            {
                account_code: customer.receivable_gl_account || '1100',
                debit: inv.total_amount,
                credit: 0,
                description: `Receivable for ${inv.invoice_number}`
            },
            {
                account_code: customer.revenue_gl_account || '4000',
                debit: 0,
                credit: inv.subtotal,
                description: `Revenue for ${inv.invoice_number}`
            }
        ];

        if (inv.tax_total > 0) {
            lines.push({
                account_code: '2100', // VAT Payable
                debit: 0,
                credit: inv.tax_total,
                description: `VAT for ${inv.invoice_number}`
            });
        }

        const count = await JournalEntry.countDocuments();
        const je = new JournalEntry({
            entry_number: `JE-AR-${String(count + 1).padStart(6, '0')}`,
            date: inv.posting_date || new Date(),
            reference: inv.invoice_number,
            description: `Auto-generated JE for Invoice ${inv.invoice_number}`,
            lines,
            status: 'posted',
            total_debit: inv.total_amount,
            total_credit: inv.total_amount,
            created_by: 'system'
        });

        await je.save();

        inv.status = 'sent';
        inv.journal_entry_id = je._id;
        await inv.save();

        res.json({ success: true, journal_entry: je });
    } catch (err) {
        res.status(500).json({ error: 'Posting failed', detail: err.message });
    }
});

// ── PAYMENTS & ALLOCATIONS ────────────────────────────────────────────────

router.get('/payments', async (req, res) => {
    try {
        const payments = await Payment.find().sort({ createdAt: -1 }).lean();
        res.json(payments);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

router.post('/payments', async (req, res) => {
    try {
        const { allocations = [], ...rest } = req.body;
        const count = await Payment.countDocuments();
        const receipt_number = `PAY-${String(count + 1).padStart(6, '0')}`;

        const amount_applied = allocations.reduce((s, a) => s + Number(a.amount_allocated || 0), 0);

        const payment = new Payment({
            ...rest,
            receipt_number,
            amount_applied,
            unapplied_balance: rest.amount_received - amount_applied,
            status: 'posted'
        });

        await payment.save();

        // Process allocations
        for (const alloc of allocations) {
            const pa = new PaymentAllocation({
                payment_id: payment._id,
                invoice_id: alloc.invoice_id,
                amount_allocated: alloc.amount_allocated
            });
            await pa.save();

            // Update invoice balance
            const inv = await InvoiceAR.findById(alloc.invoice_id);
            if (inv) {
                inv.balance_due -= alloc.amount_allocated;
                if (inv.balance_due <= 0) {
                    inv.status = 'paid';
                } else {
                    inv.status = 'partial';
                }
                await inv.save();
            }
        }

        // Generate Journal Entry
        // Dr Bank (1000)
        // Cr Accounts Receivable (1100)

        const customer = await Customer.findOne({ customer_id: payment.customer_id });
        const jeCount = await JournalEntry.countDocuments();
        const je = new JournalEntry({
            entry_number: `JE-PAY-${String(jeCount + 1).padStart(6, '0')}`,
            date: payment.payment_date,
            reference: receipt_number,
            description: `Payment from ${customer?.legal_name || payment.customer_id}`,
            lines: [
                {
                    account_code: payment.gl_account || '1000',
                    debit: payment.amount_received,
                    credit: 0,
                    description: `Cash/Bank Receipt ${receipt_number}`
                },
                {
                    account_code: customer?.receivable_gl_account || '1100',
                    debit: 0,
                    credit: payment.amount_received,
                    description: `Payment Application ${receipt_number}`
                }
            ],
            status: 'posted',
            total_debit: payment.amount_received,
            total_credit: payment.amount_received
        });
        await je.save();
        payment.journal_entry_id = je._id;
        await payment.save();

        res.status(201).json(payment);
    } catch (err) {
        res.status(500).json({ error: 'Payment failed', detail: err.message });
    }
});

// ── AGING ──────────────────────────────────────────────────────────────────

router.get('/aging-report', async (req, res) => {
    try {
        const today = new Date();
        const invoices = await InvoiceAR.find({ balance_due: { $gt: 0 }, status: { $ne: 'draft' } }).lean();

        const aging = {
            current: 0,
            d30: 0,
            d60: 0,
            d90: 0,
            d90Plus: 0,
            total: 0
        };

        invoices.forEach(inv => {
            const dueDate = new Date(inv.due_date);
            const diffDays = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));

            if (diffDays <= 0) aging.current += inv.balance_due;
            else if (diffDays <= 30) aging.d30 += inv.balance_due;
            else if (diffDays <= 60) aging.d60 += inv.balance_due;
            else if (diffDays <= 90) aging.d90 += inv.balance_due;
            else aging.d90Plus += inv.balance_due;

            aging.total += inv.balance_due;
        });

        res.json(aging);
    } catch (err) {
        res.status(500).json({ error: 'Failed to calculate aging' });
    }
});

module.exports = router;
