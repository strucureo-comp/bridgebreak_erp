const express = require('express');
const router = express.Router();
const { BOM, ProductionOrder } = require('../models/Manufacturing');
const { auth } = require('../middleware/auth');

// ── BOMs ────────────────────────────────────────────────────────────────────
router.get('/boms', auth, async (req, res) => {
    try {
        const boms = await BOM.find().populate('product_id', 'name sku').sort({ code: 1 });
        res.json(boms);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch BOMs' });
    }
});

router.post('/boms', auth, async (req, res) => {
    try {
        const bom = new BOM(req.body);
        await bom.save();
        res.status(201).json(bom);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create BOM' });
    }
});

// ── PRODUCTION ORDERS ────────────────────────────────────────────────────────
router.get('/production-orders', auth, async (req, res) => {
    try {
        const orders = await ProductionOrder.find().populate('bom_id').sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch production orders' });
    }
});

router.post('/production-orders', auth, async (req, res) => {
    try {
        const count = await ProductionOrder.countDocuments();
        const order = new ProductionOrder({
            ...req.body,
            order_number: `MO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`,
            issued_by: req.user.id
        });
        await order.save();
        res.status(201).json(order);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create production order' });
    }
});

module.exports = router;
