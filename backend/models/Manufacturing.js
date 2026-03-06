const mongoose = require('mongoose');

// ── BILL OF MATERIALS (BOM) ──────────────────────────────────────────────────
const bomSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    description: String,
    version: { type: String, default: '1.0' },
    components: [{
        item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
        quantity: { type: Number, required: true },
        waste_factor: { type: Number, default: 0 }
    }],
    total_cost: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true }
}, { timestamps: true });

// ── PRODUCTION ORDER ─────────────────────────────────────────────────────────
const productionOrderSchema = new mongoose.Schema({
    order_number: { type: String, required: true, unique: true },
    bom_id: { type: mongoose.Schema.Types.ObjectId, ref: 'BOM', required: true },
    quantity: { type: Number, required: true },
    status: {
        type: String,
        enum: ['planned', 'released', 'in_progress', 'completed', 'cancelled'],
        default: 'planned'
    },
    start_date: Date,
    end_date: Date,
    project_id: { type: String }, // Links to project
    issued_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String
}, { timestamps: true });

const BOM = mongoose.models.BOM || mongoose.model('BOM', bomSchema);
const ProductionOrder = mongoose.models.ProductionOrder || mongoose.model('ProductionOrder', productionOrderSchema);

module.exports = {
    BOM,
    ProductionOrder
};
