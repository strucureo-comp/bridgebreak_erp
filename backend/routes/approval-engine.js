const express = require('express');
const router = express.Router();
const { ApprovalWorkflowV2, SodRule, ApprovalRequest } = require('../models/ApprovalEngine');
const { auth } = require('../middleware/auth');

router.use(auth);

// ======================================================
// APPROVAL REQUESTS (INBOX)
// ======================================================

// GET pending requests for inbox
router.get('/requests/pending', async (req, res) => {
    try {
        const items = await ApprovalRequest.find({ status: 'pending' }).sort({ createdAt: -1 }).lean();

        // Add a 'date' field representing time ago since we don't have real dates
        const formatted = items.map(item => ({
            ...item,
            date: 'Just now' // simplistic format for UI
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch pending requests' });
    }
});

// GET single request
router.get('/requests/:reqId', async (req, res) => {
    try {
        const item = await ApprovalRequest.findOne({ reqId: req.params.reqId }).lean();
        if (!item) return res.status(404).json({ error: 'Request not found' });

        item.date = 'Just now';
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch request' });
    }
});

// POST action (approve/reject)
router.post('/requests/:reqId/action', async (req, res) => {
    try {
        const { action, notes } = req.body;
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'Action must be approve or reject' });
        }

        const statusStr = action === 'approve' ? 'approved' : 'rejected';
        const actionStr = action === 'approve' ? 'Authorized & Posted' : 'Rejected';

        const item = await ApprovalRequest.findOneAndUpdate(
            { reqId: req.params.reqId },
            {
                status: statusStr,
                $push: {
                    history: {
                        action: actionStr,
                        user: req.user ? req.user.full_name : 'Exec Auth',
                        time: new Date().toLocaleTimeString(),
                        notes: notes || ''
                    }
                }
            },
            { new: true }
        );

        if (!item) return res.status(404).json({ error: 'Request not found' });
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: 'Failed to process action' });
    }
});


// ======================================================
// APPROVAL WORKFLOWS (ENTERPRISE V2)
// ======================================================

// GET all workflows (optional ?docType=vendor_bill)
router.get('/workflows', async (req, res) => {
    try {
        const filter = {};
        if (req.query.docType) filter.docType = req.query.docType;
        const items = await ApprovalWorkflowV2.find(filter).sort({ createdAt: -1 }).lean();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch workflows' });
    }
});

// POST create workflow
router.post('/workflows', async (req, res) => {
    try {
        const item = new ApprovalWorkflowV2(req.body);
        await item.save();
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create workflow', detail: err.message });
    }
});

// PUT update workflow
router.put('/workflows/:id', async (req, res) => {
    try {
        const item = await ApprovalWorkflowV2.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ error: 'Workflow not found' });
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update workflow' });
    }
});

// PATCH toggle enabled
router.patch('/workflows/:id/toggle', async (req, res) => {
    try {
        const wf = await ApprovalWorkflowV2.findById(req.params.id);
        if (!wf) return res.status(404).json({ error: 'Workflow not found' });
        wf.enabled = !wf.enabled;
        await wf.save();
        res.json(wf);
    } catch (err) {
        res.status(500).json({ error: 'Failed to toggle workflow' });
    }
});

// DELETE workflow
router.delete('/workflows/:id', async (req, res) => {
    try {
        await ApprovalWorkflowV2.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete workflow' });
    }
});

// ======================================================
// SEGREGATION OF DUTIES (SOD) RULES
// ======================================================

// GET all SoD rules
router.get('/sod-rules', async (req, res) => {
    try {
        const items = await SodRule.find({}).sort({ createdAt: -1 }).lean();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch SoD rules' });
    }
});

// POST create SoD rule
router.post('/sod-rules', async (req, res) => {
    try {
        const item = new SodRule(req.body);
        await item.save();
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create SoD rule', detail: err.message });
    }
});

// PATCH toggle enforced
router.patch('/sod-rules/:id/toggle', async (req, res) => {
    try {
        const rule = await SodRule.findById(req.params.id);
        if (!rule) return res.status(404).json({ error: 'SoD rule not found' });
        rule.enforced = !rule.enforced;
        await rule.save();
        res.json(rule);
    } catch (err) {
        res.status(500).json({ error: 'Failed to toggle SoD rule' });
    }
});

// DELETE SoD rule
router.delete('/sod-rules/:id', async (req, res) => {
    try {
        await SodRule.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete SoD rule' });
    }
});

// ======================================================
// APPROVAL ENGINE SUMMARY (for Finance Hub KPIs)
// ======================================================
router.get('/summary', async (req, res) => {
    try {
        const [workflows, sodRules] = await Promise.all([
            ApprovalWorkflowV2.find({}).lean(),
            SodRule.countDocuments(),
        ]);
        const activeWorkflows = workflows.filter(w => w.enabled).length;
        res.json({
            totalWorkflows: workflows.length,
            activeWorkflows,
            sodRules,
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch approval summary' });
    }
});

module.exports = router;
