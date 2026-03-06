const express = require('express');
const router = express.Router();
const {
    Vendor,
    Bill,
    VendorPayment,
    PaymentAllocationAP,
    DebitNote,
    VendorAgingSnapshot
} = require('../models/Payables');
const { JournalEntry, Account } = require('../models/Finance');
const { auth } = require('../middleware/auth');

router.use(auth);

// ── VENDORS ──────────────────────────────────────────────────────────────

router.get('/vendors', async (req, res) => {
    try {
        const vendors = await Vendor.find().sort({ legal_name: 1 }).lean();
        res.json(vendors);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch vendors' });
    }
});

router.post('/vendors', async (req, res) => {
    try {
        const count = await Vendor.countDocuments();
        const vendor_id = `VEN-${String(count + 1001).padStart(4, '0')}`;
        const vendor = new Vendor({ ...req.body, vendor_id });
        await vendor.save();
        res.status(201).json(vendor);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create vendor', detail: err.message });
    }
});

// ── BILLS ────────────────────────────────────────────────────────────────

router.get('/bills', async (req, res) => {
    try {
        const bills = await Bill.find().sort({ createdAt: -1 }).lean();
        res.json(bills);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch bills' });
    }
});

router.post('/bills', async (req, res) => {
    try {
        const count = await Bill.countDocuments();
        const bill_number = `BILL-AP-${String(count + 1).padStart(6, '0')}`;

        const { lines = [], ...rest } = req.body;

        const subtotal = lines.reduce((s, l) => s + Number(l.amount || 0), 0);
        const tax_total = lines.reduce((s, l) => s + Number(l.tax_amount || 0), 0);
        const total_amount = subtotal + tax_total;

        const bill = new Bill({
            ...rest,
            bill_number,
            lines,
            subtotal,
            tax_total,
            total_amount,
            balance_due: total_amount
        });

        await bill.save();
        res.status(201).json(bill);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create bill', detail: err.message });
    }
});

// POST Journal Entry for Bill
router.post('/bills/:id/post', async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id);
        if (!bill) return res.status(404).json({ error: 'Bill not found' });
        if (bill.status !== 'draft') return res.status(400).json({ error: 'Only draft bills can be posted' });

        const vendor = await Vendor.findOne({ vendor_id: bill.vendor_id });
        if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

        // Create Journal Entry
        // Dr Expense (Default or per line)
        // Dr Input VAT (1400 - VAT Receivable)
        // Cr Accounts Payable (2100)

        const je_lines = [];

        // Distribution per line
        bill.lines.forEach(line => {
            je_lines.push({
                account_code: line.expense_gl_account || vendor.expense_gl_account || '5000',
                debit: line.amount,
                credit: 0,
                description: `Expense: ${line.description} for ${bill.bill_number}`
            });
        });

        if (bill.tax_total > 0) {
            je_lines.push({
                account_code: '1400', // VAT Receivable (Input VAT)
                debit: bill.tax_total,
                credit: 0,
                description: `Input VAT for ${bill.bill_number}`
            });
        }

        je_lines.push({
            account_code: vendor.payable_gl_account || '2100', // AP Control
            debit: 0,
            credit: bill.total_amount,
            description: `Payable for ${bill.bill_number}`
        });

        const count = await JournalEntry.countDocuments();
        const je = new JournalEntry({
            entry_number: `JE-AP-${String(count + 1).padStart(6, '0')}`,
            date: bill.posting_date || bill.bill_date || new Date(),
            reference: bill.bill_number,
            description: `Auto-generated JE for Bill ${bill.bill_number}`,
            lines: je_lines,
            status: 'posted',
            total_debit: bill.total_amount,
            total_credit: bill.total_amount,
            created_by: 'system'
        });

        await je.save();

        bill.status = 'approved';
        bill.journal_entry_id = je._id;
        await bill.save();

        res.json({ success: true, journal_entry: je });
    } catch (err) {
        res.status(500).json({ error: 'Posting failed', detail: err.message });
    }
});

// ── PAYMENTS ──────────────────────────────────────────────────────────────

router.post('/payments', async (req, res) => {
    try {
        const { allocations = [], ...rest } = req.body;
        const count = await VendorPayment.countDocuments();
        const payment_number = `V-PAY-${String(count + 1).padStart(6, '0')}`;

        const amount_applied = allocations.reduce((s, a) => s + Number(a.amount_allocated || 0), 0);

        const payment = new VendorPayment({
            ...rest,
            payment_number,
            amount_applied,
            unapplied_balance: rest.amount_paid - amount_applied,
            status: 'posted'
        });

        await payment.save();

        // Process allocations
        for (const alloc of allocations) {
            const pa = new PaymentAllocationAP({
                payment_id: payment._id,
                bill_id: alloc.bill_id,
                amount_allocated: alloc.amount_allocated
            });
            await pa.save();

            // Update bill balance
            const bill = await Bill.findById(alloc.bill_id);
            if (bill) {
                bill.balance_due -= alloc.amount_allocated;
                if (bill.balance_due <= 0) {
                    bill.status = 'paid';
                    bill.payment_status = 'paid';
                } else if (bill.balance_due < bill.total_amount) {
                    bill.status = 'partial';
                    bill.payment_status = 'partial';
                }
                await bill.save();
            }
        }

        // Generate Journal Entry
        // Dr Accounts Payable (2100)
        // Cr Bank (1000)

        const vendor = await Vendor.findOne({ vendor_id: payment.vendor_id });
        const jeCount = await JournalEntry.countDocuments();
        const je = new JournalEntry({
            entry_number: `JE-V-PAY-${String(jeCount + 1).padStart(6, '0')}`,
            date: payment.payment_date,
            reference: payment_number,
            description: `Payment to ${vendor?.legal_name || payment.vendor_id}`,
            lines: [
                {
                    account_code: vendor?.payable_gl_account || '2100',
                    debit: payment.amount_paid,
                    credit: 0,
                    description: `Settlement of balance`
                },
                {
                    account_code: payment.gl_account || '1000',
                    debit: 0,
                    credit: payment.amount_paid,
                    description: `Cash/Bank Disbursement ${payment_number}`
                }
            ],
            status: 'posted',
            total_debit: payment.amount_paid,
            total_credit: payment.amount_paid
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
        const bills = await Bill.find({ balance_due: { $gt: 0 }, status: { $nin: ['draft', 'cancelled'] } }).lean();

        const aging = {
            current: 0,
            d30: 0,
            d60: 0,
            d90: 0,
            d90Plus: 0,
            total: 0
        };

        bills.forEach(bill => {
            const dueDate = new Date(bill.due_date);
            const diffDays = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));

            if (diffDays <= 0) aging.current += bill.balance_due;
            else if (diffDays <= 30) aging.d30 += bill.balance_due;
            else if (diffDays <= 60) aging.d60 += bill.balance_due;
            else if (diffDays <= 90) aging.d90 += bill.balance_due;
            else aging.d90Plus += bill.balance_due;

            aging.total += bill.balance_due;
        });

        res.json(aging);
    } catch (err) {
        res.status(500).json({ error: 'Failed to calculate aging' });
    }
});

module.exports = router;
