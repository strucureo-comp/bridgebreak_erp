const express = require('express');
const router = express.Router();
const { PurchaseRequest, PurchaseOrder, GRN } = require('../models/Procurement');
const { auth } = require('../middleware/auth');

// ── PURCHASE REQUESTS ────────────────────────────────────────────────────────
router.get('/requests', auth, async (req, res) => {
    try {
        const requests = await PurchaseRequest.find()
            .populate('requested_by', 'full_name')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch purchase requests' });
    }
});

router.post('/requests', auth, async (req, res) => {
    try {
        const request = new PurchaseRequest({ ...req.body, requested_by: req.user.id });
        await request.save();
        res.status(201).json(request);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create purchase request' });
    }
});

// ── PURCHASE ORDERS ──────────────────────────────────────────────────────────
router.get('/orders', auth, async (req, res) => {
    try {
        const orders = await PurchaseOrder.find()
            .populate('vendor_id', 'legal_name')
            .populate('created_by', 'full_name')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch purchase orders' });
    }
});

router.post('/orders', auth, async (req, res) => {
    try {
        const count = await PurchaseOrder.countDocuments();
        const po = new PurchaseOrder({
            ...req.body,
            po_number: `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`,
            created_by: req.user.id
        });
        await po.save();
        res.status(201).json(po);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create purchase order' });
    }
});

// ── GRNs ────────────────────────────────────────────────────────────────────
router.get('/grns', auth, async (req, res) => {
    try {
        const grns = await GRN.find()
            .populate('purchase_order_id', 'po_number')
            .populate('received_by', 'full_name')
            .sort({ createdAt: -1 });
        res.json(grns);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch GRNs' });
    }
});

module.exports = router;
