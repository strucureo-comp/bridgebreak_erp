const mongoose = require('mongoose');

// ── TAX JURISDICTION ──────────────────────────────────────────────────────────
const jurisdictionSchema = new mongoose.Schema({
    code: { type: String, required: true, index: true },
    country: { type: String, required: true },
    regNumber: { type: String, default: '' },
    system: { type: String, enum: ['vat', 'gst', 'sales'], default: 'vat' },
    reportingPeriod: { type: String, enum: ['monthly', 'quarterly', 'annual'], default: 'quarterly' },
    filingMethod: { type: String, default: '' },
    authority: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });
jurisdictionSchema.index({ code: 1, status: 1 });

// ── TAX CODE ──────────────────────────────────────────────────────────────────
const taxCodeSchema = new mongoose.Schema({
    code: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    jurisdiction: { type: String, required: true, index: true },
    type: { type: String, enum: ['output', 'input', 'reverse_charge', 'withholding', 'zero_rated', 'exempt'], required: true },
    rate: { type: Number, required: true, default: 0 },
    glPayable: { type: String, default: '' },
    glReceivable: { type: String, default: '' },
    recoverablePct: { type: Number, default: 100, min: 0, max: 100 },
    effectiveDate: { type: String, default: '' },
    expiryDate: { type: String, default: '' },
    autoSelfAccount: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });
taxCodeSchema.index({ jurisdiction: 1, code: 1 });

// ── FILING PERIOD ──────────────────────────────────────────────────────────────
const filingPeriodSchema = new mongoose.Schema({
    jurisdiction: { type: String, required: true, index: true },
    period: { type: String, required: true },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    dueDate: { type: String, default: '' },
    status: { type: String, enum: ['open', 'filed', 'locked'], default: 'open' },
    filedBy: { type: String, default: '' },
    filedAt: { type: String, default: '' },
    taxPayable: { type: Number, default: 0 },
    taxReceivable: { type: Number, default: 0 },
    netLiability: { type: Number, default: 0 },
}, { timestamps: true });

// ── TAX ADJUSTMENT ─────────────────────────────────────────────────────────────
const taxAdjustmentSchema = new mongoose.Schema({
    date: { type: String, required: true },
    type: { type: String, enum: ['Correction', 'Credit Note', 'Bad Debt', 'Reclassification'], default: 'Correction' },
    period: { type: String, default: '' },
    description: { type: String, required: true },
    amount: { type: Number, default: 0 },
    je: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'posted'], default: 'draft' },
}, { timestamps: true });

const TaxJurisdiction = mongoose.models.TaxJurisdiction || mongoose.model('TaxJurisdiction', jurisdictionSchema);
const TaxCode = mongoose.models.TaxCode || mongoose.model('TaxCode', taxCodeSchema);
const FilingPeriod = mongoose.models.FilingPeriod || mongoose.model('FilingPeriod', filingPeriodSchema);
const TaxAdjustment = mongoose.models.TaxAdjustment || mongoose.model('TaxAdjustment', taxAdjustmentSchema);

module.exports = { TaxJurisdiction, TaxCode, FilingPeriod, TaxAdjustment };
