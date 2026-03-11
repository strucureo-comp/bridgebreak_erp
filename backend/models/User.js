const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    tenant_id: { type: String, default: 'default', index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    full_name: { type: String, required: true, trim: true },
    // Role names are managed by the tenant roles settings module.
    role: { type: String, trim: true, default: 'Employee' },
    avatar_url: { type: String, default: null },
    is_active: { type: Boolean, default: true },
    status: { type: String, enum: ['active', 'pending', 'disabled'], default: 'active' },
    invited_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    invited_at: { type: Date },
    last_login: { type: Date },
    invitation_token: { type: String },
    invitation_expires: { type: Date },
    password_reset_token: { type: String },
    password_reset_expires: { type: Date },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
