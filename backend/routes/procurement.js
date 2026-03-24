const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { PurchaseRequest, PurchaseOrder, GRN, RFQ } = require('../models/Procurement');
const { auth } = require('../middleware/auth');

function tenantIdFromReq(req) {
    return req.user?.tenant_id || 'default';
}

function tenantScopedFilter(tenant_id, filter = {}) {
    if (tenant_id === 'default') {
        return {
            ...filter,
            $or: [{ tenant_id }, { tenant_id: { $exists: false } }],
        };
    }

    return { ...filter, tenant_id };
}

router.get('/requests', auth, async (req, res) => {
    try {
        const tenant_id = tenantIdFromReq(req);
        const requests = await PurchaseRequest.find(tenantScopedFilter(tenant_id))
            .populate('requested_by', 'full_name')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch purchase requests' });
    }
});

router.post('/requests', auth, async (req, res) => {
    try {
        const tenant_id = tenantIdFromReq(req);
        const request = new PurchaseRequest({
            ...req.body,
            tenant_id,
            requested_by: req.user.id,
        });
        await request.save();
        res.status(201).json(request);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create purchase request' });
    }
});

router.get('/rfqs', auth, async (req, res) => {
    try {
        const tenant_id = tenantIdFromReq(req);
        const rfqs = await RFQ.find(tenantScopedFilter(tenant_id))
            .populate('purchase_request_id')
            .populate('vendors', 'legal_name')
            .populate('created_by', 'full_name')
            .sort({ createdAt: -1 });
        res.json(rfqs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch RFQs' });
    }
});

router.post('/rfqs', auth, async (req, res) => {
    try {
        const tenant_id = tenantIdFromReq(req);
        const count = await RFQ.countDocuments(tenantScopedFilter(tenant_id));
        const rfq = new RFQ({
            ...req.body,
            tenant_id,
            rfq_number: req.body.rfq_number || `RFQ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`,
            created_by: req.user.id,
        });
        await rfq.save();
        res.status(201).json(rfq);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create RFQ' });
    }
});

router.get('/orders', auth, async (req, res) => {
    try {
        const tenant_id = tenantIdFromReq(req);
        const orders = await PurchaseOrder.find(tenantScopedFilter(tenant_id))
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
        const tenant_id = tenantIdFromReq(req);
        const count = await PurchaseOrder.countDocuments(tenantScopedFilter(tenant_id));
        const po = new PurchaseOrder({
            ...req.body,
            tenant_id,
            po_number: req.body.po_number || `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`,
            created_by: req.user.id,
        });
        await po.save();
        res.status(201).json(po);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create purchase order' });
    }
});

router.get('/orders/:id', auth, async (req, res) => {
    try {
        const tenant_id = tenantIdFromReq(req);
        const order = await PurchaseOrder.findOne(tenantScopedFilter(tenant_id, { _id: req.params.id }))
            .populate('vendor_id', 'legal_name')
            .populate('created_by', 'full_name')
            .lean();

        if (!order) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }

        res.json(order);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch purchase order' });
    }
});

router.put('/orders/:id', auth, async (req, res) => {
    try {
        const tenant_id = tenantIdFromReq(req);
        const order = await PurchaseOrder.findOneAndUpdate(
            tenantScopedFilter(tenant_id, { _id: req.params.id }),
            { ...req.body, tenant_id },
            { new: true }
        ).populate('vendor_id', 'legal_name');

        if (!order) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }

        res.json(order);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update purchase order' });
    }
});

router.get('/grns', auth, async (req, res) => {
    try {
        const tenant_id = tenantIdFromReq(req);
        const grns = await GRN.find(tenantScopedFilter(tenant_id))
            .populate('purchase_order_id', 'po_number')
            .populate('received_by', 'full_name')
            .sort({ createdAt: -1 });
        res.json(grns);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch GRNs' });
    }
});

router.post('/grns', auth, async (req, res) => {
    try {
        const tenant_id = tenantIdFromReq(req);
        const purchaseOrder = await PurchaseOrder.findOne(
            tenantScopedFilter(tenant_id, { _id: req.body.purchase_order_id })
        );

        if (!purchaseOrder) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }

        const payloadItems = Array.isArray(req.body.lines) ? req.body.lines : [];
        const items = payloadItems.map((line) => ({
            ...(mongoose.Types.ObjectId.isValid(line.variant_id) ? { item_id: line.variant_id } : {}),
            quantity_received: Number(line.quantity || 0),
            location_id: line.location_id || '',
        }));

        const grn = new GRN({
            tenant_id,
            grn_number: req.body.grn_number,
            purchase_order_id: req.body.purchase_order_id,
            received_date: req.body.received_date || new Date(),
            received_by: req.user.id,
            items,
            notes: req.body.notes || '',
        });

        await grn.save();

        await PurchaseOrder.findOneAndUpdate(
            tenantScopedFilter(tenant_id, { _id: req.body.purchase_order_id }),
            { status: 'received' }
        );

        res.status(201).json(grn);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create GRN' });
    }
});

module.exports = router;
