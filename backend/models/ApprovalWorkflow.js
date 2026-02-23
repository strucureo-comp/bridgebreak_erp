const mongoose = require('mongoose');

const approvalWorkflowSchema = new mongoose.Schema({
    title: { type: String, required: true },
    status: { type: String, enum: ['Active', 'Draft', 'Inactive'], default: 'Draft' },
    threshold: { type: String, default: 'All' },
    flow: [{
        role: { type: String, required: true },
        action: { type: String, required: true }
    }],
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('ApprovalWorkflow', approvalWorkflowSchema);
