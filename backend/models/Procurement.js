const mongoose = require('mongoose');

// ── PURCHASE REQUEST ─────────────────────────────────────────────────────────
const purchaseRequestSchema = new mongoose.Schema({
    item_name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'pcs' },
    estimated_cost: { type: Number, default: 0 },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: {
        type: String,
        enum: ['pending', 'approved', 'ordered', 'received', 'cancelled'],
        default: 'pending'
    },
    requested_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    project_id: { type: String }, // Optional link to project
    needed_by: Date,
    notes: String
}, { timestamps: true });

// ── PURCHASE ORDER ───────────────────────────────────────────────────────────
const purchaseOrderSchema = new mongoose.Schema({
    po_number: { type: String, required: true, unique: true },
    vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    total_amount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'issued', 'partially_received', 'received', 'closed', 'cancelled'],
        default: 'pending'
    },
    lines: [{
        description: String,
        quantity: Number,
        unit_price: Number,
        amount: Number,
        item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' }
    }],
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    delivery_date: Date,
    terms: String
}, { timestamps: true });

// ── GRN (GOODS RECEIVED NOTE) ────────────────────────────────────────────────
const grnSchema = new mongoose.Schema({
    grn_number: { type: String, required: true, unique: true },
    purchase_order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
    received_date: { type: Date, default: Date.now },
    received_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [{
        item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
        quantity_received: Number,
        location_id: String // Warehouse location
    }],
    notes: String
}, { timestamps: true });

const PurchaseRequest = mongoose.models.PurchaseRequest || mongoose.model('PurchaseRequest', purchaseRequestSchema);
const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model('PurchaseOrder', purchaseOrderSchema);
const GRN = mongoose.models.GRN || mongoose.model('GRN', grnSchema);

module.exports = {
    PurchaseRequest,
    PurchaseOrder,
    GRN
};
