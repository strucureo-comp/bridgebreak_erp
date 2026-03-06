const express = require('express');
const router = express.Router();
const { Lead, Opportunity, CustomerAccount, Contact, Activity } = require('../models/CRM');
const { auth } = require('../middleware/auth');

// ── LEADS ───────────────────────────────────────────────────────────────────
router.get('/leads', auth, async (req, res) => {
    try {
        const leads = await Lead.find().populate('owner_id', 'full_name').sort({ createdAt: -1 });
        res.json(leads);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

router.post('/leads', auth, async (req, res) => {
    try {
        const lead = new Lead({ ...req.body, owner_id: req.user.id });
        await lead.save();
        res.status(201).json(lead);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create lead' });
    }
});

// ── OPPORTUNITIES ────────────────────────────────────────────────────────────
router.get('/opportunities', auth, async (req, res) => {
    try {
        const opps = await Opportunity.find().populate('account_id', 'name').populate('owner_id', 'full_name').sort({ createdAt: -1 });
        res.json(opps);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch opportunities' });
    }
});

// ── CUSTOMERS (ACCOUNTS) ──────────────────────────────────────────────────────
router.get('/customers', auth, async (req, res) => {
    try {
        const customers = await CustomerAccount.find().populate('owner_id', 'full_name').sort({ name: 1 });
        res.json(customers);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

router.post('/customers', auth, async (req, res) => {
    try {
        const customer = new CustomerAccount({ ...req.body, owner_id: req.user.id });
        await customer.save();
        res.status(201).json(customer);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

// ── SALES ORDERS ─────────────────────────────────────────────────────────────
router.get('/sales-orders', auth, async (req, res) => {
    try {
        const orders = await SalesOrder.find().populate('customer_id', 'name').sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch sales orders' });
    }
});

router.post('/sales-orders', auth, async (req, res) => {
    try {
        const count = await SalesOrder.countDocuments();
        const order = new SalesOrder({
            ...req.body,
            order_number: `SO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`,
            created_by: req.user.id
        });
        await order.save();
        res.status(201).json(order);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create sales order' });
    }
});

module.exports = router;
