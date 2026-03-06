const mongoose = require('mongoose');

// ── CUSTOMER ACCOUNT (CRM) ──────────────────────────────────────────────────
const customerAccountSchema = new mongoose.Schema({
    name: { type: String, required: true },
    industry: String,
    website: String,
    phone: String,
    address: String,
    tax_id: String,
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['active', 'inactive', 'prospect'], default: 'prospect' },
    notes: String
}, { timestamps: true });

// ── CONTACT ──────────────────────────────────────────────────────────────────
const contactSchema = new mongoose.Schema({
    account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerAccount' },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: String,
    phone: String,
    title: String,
    is_primary: { type: Boolean, default: false }
}, { timestamps: true });

// ── LEAD ─────────────────────────────────────────────────────────────────────
const leadSchema = new mongoose.Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    company: String,
    email: String,
    phone: String,
    status: { type: String, enum: ['new', 'contacted', 'qualified', 'lost', 'converted'], default: 'new' },
    source: String,
    potential_value: { type: Number, default: 0 },
    probability: { type: Number, default: 0 },
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String
}, { timestamps: true });

// ── OPPORTUNITY ──────────────────────────────────────────────────────────────
const opportunitySchema = new mongoose.Schema({
    account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerAccount', required: true },
    name: { type: String, required: true },
    amount: { type: Number, default: 0 },
    stage: {
        type: String,
        enum: ['new_lead', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost'],
        default: 'new_lead'
    },
    probability: { type: Number, default: 10 },
    close_date: Date,
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String
}, { timestamps: true });

// ── ACTIVITY ─────────────────────────────────────────────────────────────────
const activitySchema = new mongoose.Schema({
    type: { type: String, enum: ['call', 'email', 'meeting', 'task', 'note'], required: true },
    subject: { type: String, required: true },
    description: String,
    due_date: Date,
    completed: { type: Boolean, default: false },
    lead_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerAccount' },
    opportunity_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// ── SALES ORDER ──────────────────────────────────────────────────────────────
const salesOrderSchema = new mongoose.Schema({
    order_number: { type: String, required: true, unique: true },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerAccount', required: true },
    project_id: { type: String },
    total_amount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'draft'
    },
    lines: [{
        description: String,
        quantity: Number,
        unit_price: Number,
        amount: Number
    }],
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const CustomerAccount = mongoose.models.CustomerAccount || mongoose.model('CustomerAccount', customerAccountSchema);
const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);
const Lead = mongoose.models.Lead || mongoose.model('Lead', leadSchema);
const Opportunity = mongoose.models.Opportunity || mongoose.model('Opportunity', opportunitySchema);
const Activity = mongoose.models.Activity || mongoose.model('Activity', activitySchema);
const SalesOrder = mongoose.models.SalesOrder || mongoose.model('SalesOrder', salesOrderSchema);

module.exports = {
    CustomerAccount,
    Contact,
    Lead,
    Opportunity,
    Activity,
    SalesOrder
};
