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
// VAT RETURNS
// ======================================================
router.get('/vat-returns', async (req, res) => {
    try {
        const { status, year } = req.query;
        const query = {};
        if (status) query.status = status;
        if (year) {
            query.periodStart = { $gte: `${year}-01-01` };
            query.periodEnd = { $lte: `${year}-12-31` };
        }
        const vatReturns = await VATReturn.find(query).sort({ periodEnd: -1 }).lean();
        res.json(vatReturns.map(r => ({ ...r, id: r._id })));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch VAT returns' });
    }
});

router.post('/vat-returns', async (req, res) => {
    try {
        const vatReturn = new VATReturn(req.body);
        await vatReturn.save();
        res.status(201).json({ ...vatReturn.toObject(), id: vatReturn._id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create VAT return' });
    }
});

router.put('/vat-returns/:id', async (req, res) => {
    try {
        const vatReturn = await VATReturn.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!vatReturn) return res.status(404).json({ error: 'VAT return not found' });
        res.json({ ...vatReturn.toObject(), id: vatReturn._id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update VAT return' });
    }
});

router.patch('/vat-returns/:id/file', async (req, res) => {
    try {
        const vatReturn = await VATReturn.findByIdAndUpdate(
            req.params.id,
            { status: 'filed', filedAt: new Date(), ...req.body },
            { new: true }
        );
        if (!vatReturn) return res.status(404).json({ error: 'VAT return not found' });
        res.json({ ...vatReturn.toObject(), id: vatReturn._id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to file VAT return' });
    }
});

router.delete('/vat-returns/:id', async (req, res) => {
    try {
        const vatReturn = await VATReturn.findByIdAndDelete(req.params.id);
        if (!vatReturn) return res.status(404).json({ error: 'VAT return not found' });
        res.json({ message: 'VAT return deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete VAT return' });
    }
});

// ======================================================
// CORPORATE TAX FILINGS
// ======================================================
router.get('/corporate-tax', async (req, res) => {
    try {
        const { status, year } = req.query;
        const query = {};
        if (status) query.status = status;
        if (year) query.taxYear = year;
        const corpTaxFilings = await CorporateTaxFiling.find(query).sort({ taxYear: -1, periodEnd: -1 }).lean();
        res.json(corpTaxFilings.map(c => ({ ...c, id: c._id })));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch corporate tax filings' });
    }
});

router.post('/corporate-tax', async (req, res) => {
    try {
        const filing = new CorporateTaxFiling(req.body);
        await filing.save();
        res.status(201).json({ ...filing.toObject(), id: filing._id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create corporate tax filing' });
    }
});

router.put('/corporate-tax/:id', async (req, res) => {
    try {
        const filing = await CorporateTaxFiling.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!filing) return res.status(404).json({ error: 'Corporate tax filing not found' });
        res.json({ ...filing.toObject(), id: filing._id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update corporate tax filing' });
    }
});

router.patch('/corporate-tax/:id/file', async (req, res) => {
    try {
        const filing = await CorporateTaxFiling.findByIdAndUpdate(
            req.params.id,
            { status: 'filed', filedAt: new Date(), ...req.body },
            { new: true }
        );
        if (!filing) return res.status(404).json({ error: 'Corporate tax filing not found' });
        res.json({ ...filing.toObject(), id: filing._id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to file corporate tax' });
    }
});

router.patch('/corporate-tax/:id/assess', async (req, res) => {
    try {
        const filing = await CorporateTaxFiling.findByIdAndUpdate(
            req.params.id,
            { status: 'assessed', assessedAt: new Date(), ...req.body },
            { new: true }
        );
        if (!filing) return res.status(404).json({ error: 'Corporate tax filing not found' });
        res.json({ ...filing.toObject(), id: filing._id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to process assessment' });
    }
});

router.delete('/corporate-tax/:id', async (req, res) => {
    try {
        const filing = await CorporateTaxFiling.findByIdAndDelete(req.params.id);
        if (!filing) return res.status(404).json({ error: 'Corporate tax filing not found' });
        res.json({ message: 'Corporate tax filing deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete corporate tax filing' });
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

// ======================================================
// VAT RETURNS
// ======================================================

// In-memory storage for VAT Returns (would be a database collection in production)
let vatReturns = [];

// Get all VAT returns
router.get('/vat-returns', async (req, res) => {
    try {
        res.json(vatReturns);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch VAT returns' });
    }
});

// Create a new VAT return
router.post('/vat-returns', async (req, res) => {
    try {
        const newReturn = {
            id: `VAT-${Date.now()}`,
            ...req.body,
            status: 'draft',
            createdAt: new Date().toISOString()
        };
        vatReturns.push(newReturn);
        res.status(201).json(newReturn);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create VAT return' });
    }
});

// Update VAT return (file it)
router.put('/vat-returns/:id', async (req, res) => {
    try {
        const index = vatReturns.findIndex(v => v.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'VAT return not found' });

        vatReturns[index] = { ...vatReturns[index], ...req.body };
        res.json(vatReturns[index]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update VAT return' });
    }
});

// File VAT return
router.post('/vat-returns/:id/file', async (req, res) => {
    try {
        const index = vatReturns.findIndex(v => v.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'VAT return not found' });

        vatReturns[index] = {
            ...vatReturns[index],
            status: 'filed',
            filedAt: new Date().toISOString(),
            filedBy: req.body.filedBy || 'System',
            referenceNumber: req.body.referenceNumber || `VAT-REF-${Date.now()}`
        };
        res.json(vatReturns[index]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to file VAT return' });
    }
});

// ======================================================
// CORPORATE TAX FILINGS
// ======================================================

// In-memory storage for Corporate Tax Filings
let corpTaxFilings = [];

// Get all corporate tax filings
router.get('/corporate-tax', async (req, res) => {
    try {
        const { year } = req.query;
        if (year) {
            const filtered = corpTaxFilings.filter(c => c.taxYear === year);
            return res.json(filtered);
        }
        res.json(corpTaxFilings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch corporate tax filings' });
    }
});

// Create a new corporate tax filing
router.post('/corporate-tax', async (req, res) => {
    try {
        const newFiling = {
            id: `CT-${Date.now()}`,
            ...req.body,
            status: 'draft',
            createdAt: new Date().toISOString()
        };
        corpTaxFilings.push(newFiling);
        res.status(201).json(newFiling);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create corporate tax filing' });
    }
});

// Update corporate tax filing
router.put('/corporate-tax/:id', async (req, res) => {
    try {
        const index = corpTaxFilings.findIndex(c => c.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Corporate tax filing not found' });

        corpTaxFilings[index] = { ...corpTaxFilings[index], ...req.body };
        res.json(corpTaxFilings[index]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update corporate tax filing' });
    }
});

// File corporate tax return
router.post('/corporate-tax/:id/file', async (req, res) => {
    try {
        const index = corpTaxFilings.findIndex(c => c.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Corporate tax filing not found' });

        corpTaxFilings[index] = {
            ...corpTaxFilings[index],
            status: 'filed',
            filedAt: new Date().toISOString(),
            filedBy: req.body.filedBy || 'System',
            referenceNumber: req.body.referenceNumber || `CT-REF-${Date.now()}`
        };
        res.json(corpTaxFilings[index]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to file corporate tax return' });
    }
});

// Request assessment for corporate tax
router.post('/corporate-tax/:id/request-assessment', async (req, res) => {
    try {
        const index = corpTaxFilings.findIndex(c => c.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Corporate tax filing not found' });

        corpTaxFilings[index] = {
            ...corpTaxFilings[index],
            status: 'pending',
            assessmentRequestedAt: new Date().toISOString()
        };
        res.json(corpTaxFilings[index]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to request assessment' });
    }
});

module.exports = router;
