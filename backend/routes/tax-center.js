const express = require('express');
const router = express.Router();
const { TaxJurisdiction, TaxCode, FilingPeriod, TaxAdjustment } = require('../models/TaxCenter');
const { auth } = require('../middleware/auth');

router.use(auth);

// ======================================================
// TAX JURISDICTIONS
// ======================================================

// GET all jurisdictions
router.get('/jurisdictions', async (req, res) => {
    try {
        const items = await TaxJurisdiction.find({}).sort({ createdAt: -1 }).lean();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch jurisdictions' });
    }
});

// POST create jurisdiction
router.post('/jurisdictions', async (req, res) => {
    try {
        const item = new TaxJurisdiction(req.body);
        await item.save();
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create jurisdiction', detail: err.message });
    }
});

// PUT update jurisdiction
router.put('/jurisdictions/:id', async (req, res) => {
    try {
        const item = await TaxJurisdiction.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ error: 'Jurisdiction not found' });
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update jurisdiction' });
    }
});

// DELETE jurisdiction
router.delete('/jurisdictions/:id', async (req, res) => {
    try {
        await TaxJurisdiction.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete jurisdiction' });
    }
});

// ======================================================
// TAX CODES
// ======================================================

// GET all tax codes (optional ?jurisdiction=AE)
router.get('/codes', async (req, res) => {
    try {
        const filter = {};
        if (req.query.jurisdiction) filter.jurisdiction = req.query.jurisdiction;
        const items = await TaxCode.find(filter).sort({ createdAt: -1 }).lean();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch tax codes' });
    }
});

// POST create tax code
router.post('/codes', async (req, res) => {
    try {
        const item = new TaxCode(req.body);
        await item.save();
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create tax code', detail: err.message });
    }
});

// PUT update tax code
router.put('/codes/:id', async (req, res) => {
    try {
        const item = await TaxCode.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ error: 'Tax code not found' });
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update tax code' });
    }
});

// DELETE tax code
router.delete('/codes/:id', async (req, res) => {
    try {
        await TaxCode.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete tax code' });
    }
});

// ======================================================
// FILING PERIODS
// ======================================================

// GET all filing periods (optional ?jurisdiction=AE)
router.get('/filing-periods', async (req, res) => {
    try {
        const filter = {};
        if (req.query.jurisdiction) filter.jurisdiction = req.query.jurisdiction;
        const items = await FilingPeriod.find(filter).sort({ createdAt: -1 }).lean();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch filing periods' });
    }
});

// POST create filing period
router.post('/filing-periods', async (req, res) => {
    try {
        const body = { ...req.body };
        body.netLiability = (body.taxPayable || 0) - (body.taxReceivable || 0);
        const item = new FilingPeriod(body);
        await item.save();
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create filing period', detail: err.message });
    }
});

// PUT update filing period
router.put('/filing-periods/:id', async (req, res) => {
    try {
        const body = { ...req.body };
        if (body.taxPayable !== undefined || body.taxReceivable !== undefined) {
            body.netLiability = (body.taxPayable || 0) - (body.taxReceivable || 0);
        }
        const item = await FilingPeriod.findByIdAndUpdate(req.params.id, body, { new: true });
        if (!item) return res.status(404).json({ error: 'Filing period not found' });
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update filing period' });
    }
});

// PATCH toggle filing status (open → filed → locked)
router.patch('/filing-periods/:id/status', async (req, res) => {
    try {
        const fp = await FilingPeriod.findById(req.params.id);
        if (!fp) return res.status(404).json({ error: 'Filing period not found' });
        if (fp.status === 'open') {
            fp.status = 'filed';
            fp.filedBy = req.body.filedBy || 'Admin';
            fp.filedAt = new Date().toISOString().slice(0, 10);
        } else if (fp.status === 'filed') {
            fp.status = 'locked';
        }
        await fp.save();
        res.json(fp);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update filing status' });
    }
});

// DELETE filing period
router.delete('/filing-periods/:id', async (req, res) => {
    try {
        await FilingPeriod.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete filing period' });
    }
});

// ======================================================
// TAX ADJUSTMENTS
// ======================================================

// GET all adjustments
router.get('/adjustments', async (req, res) => {
    try {
        const items = await TaxAdjustment.find({}).sort({ createdAt: -1 }).lean();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch adjustments' });
    }
});

// POST create adjustment
router.post('/adjustments', async (req, res) => {
    try {
        const item = new TaxAdjustment(req.body);
        await item.save();
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create adjustment', detail: err.message });
    }
});

// PATCH post adjustment
router.patch('/adjustments/:id/post', async (req, res) => {
    try {
        const item = await TaxAdjustment.findByIdAndUpdate(
            req.params.id, { status: 'posted' }, { new: true }
        );
        if (!item) return res.status(404).json({ error: 'Adjustment not found' });
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: 'Failed to post adjustment' });
    }
});

// DELETE adjustment
router.delete('/adjustments/:id', async (req, res) => {
    try {
        await TaxAdjustment.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete adjustment' });
    }
});

// ======================================================
// TAX CENTER SUMMARY (for Finance Hub KPIs)
// ======================================================
router.get('/center-summary', async (req, res) => {
    try {
        const [jurisdictions, codes, filings, adjustments] = await Promise.all([
            TaxJurisdiction.countDocuments(),
            TaxCode.countDocuments(),
            FilingPeriod.find({}).lean(),
            TaxAdjustment.countDocuments(),
        ]);
        const openPeriods = filings.filter(f => f.status === 'open').length;
        const totalLiability = filings
            .filter(f => f.status === 'open')
            .reduce((s, f) => s + (f.netLiability || 0), 0);

        res.json({
            jurisdictions, codes, openPeriods, totalLiability, adjustments,
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch tax summary' });
    }
});

module.exports = router;
