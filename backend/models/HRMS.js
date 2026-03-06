const mongoose = require('mongoose');

// ── DEPARTMENT ───────────────────────────────────────────────────────────────
const hrDepartmentSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    head_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'HRDepartment' },
    is_active: { type: Boolean, default: true },
    description: String
}, { timestamps: true });

// ── HR ROLE ──────────────────────────────────────────────────────────────────
const hrRoleSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    grade: String,
    min_salary: { type: Number, default: 0 },
    max_salary: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
    description: String
}, { timestamps: true });

// ── EMPLOYEE ──────────────────────────────────────────────────────────────────
const employeeSchema = new mongoose.Schema({
    employee_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    phone: String,
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional link to login account

    // Position Details
    department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'HRDepartment' },
    hr_role_id: { type: mongoose.Schema.Types.ObjectId, ref: 'HRRole' },
    skill_type: { type: String, default: 'unskilled' }, // skilled, semi-skilled, unskilled
    employment_type: { type: String, enum: ['full-time', 'contract', 'part-time'], default: 'full-time' },
    joining_date: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'inactive', 'on-leave', 'terminated'], default: 'active' },

    // Financials
    basic_salary: { type: Number, default: 0 },
    overtime_rate: { type: Number, default: 0 },
    bank_details: {
        account_name: String,
        account_number: String,
        bank_name: String,
        iban: String
    },

    // Personal Info
    date_of_birth: Date,
    gender: String,
    nationality: String,
    address: String,
    photo_url: String,

    lifecycle_status: { type: String, default: 'confirmed' }
}, { timestamps: true });

// ── ATTENDANCE ───────────────────────────────────────────────────────────────
const attendanceSchema = new mongoose.Schema({
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent', 'leave', 'holiday', 'half-day'], default: 'present' },
    check_in: String,
    check_out: String,
    overtime_hours: { type: Number, default: 0 },
    project_id: { type: String }, // Links to project if on site
    notes: String
}, { timestamps: true });

attendanceSchema.index({ employee_id: 1, date: 1 }, { unique: true });

// ── LEAVE ────────────────────────────────────────────────────────────────────
const leaveSchema = new mongoose.Schema({
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    leave_type: { type: String, required: true },
    from_date: { type: Date, required: true },
    to_date: { type: Date, required: true },
    days: { type: Number, required: true },
    reason: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
    approved_by: { type: String },
    remarks: String
}, { timestamps: true });

// ── PAYROLL ──────────────────────────────────────────────────────────────────
const payrollSchema = new mongoose.Schema({
    month: { type: String, required: true }, // YYYY-MM
    status: { type: String, enum: ['draft', 'pending', 'approved', 'processed', 'posted', 'paid'], default: 'draft' },
    total_gross: { type: Number, default: 0 },
    total_deductions: { type: Number, default: 0 },
    total_net: { type: Number, default: 0 },
    lines: [{
        employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        basic_pay: Number,
        overtime_pay: Number,
        allowances: Number,
        deductions: Number,
        net_pay: Number,
        status: String
    }]
}, { timestamps: true });

// Add unique index on month to prevent duplicate payroll cycles
payrollSchema.index({ month: 1 }, { unique: true });

// ── SALARY STRUCTURE ─────────────────────────────────────────────────────────
const salaryStructureSchema = new mongoose.Schema({
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    effective_from: { type: Date, required: true },
    basic: { type: Number, required: true, default: 0 },
    hra: { type: Number, default: 0 },
    da: { type: Number, default: 0 },
    ta: { type: Number, default: 0 },
    special_allowance: { type: Number, default: 0 },
    pf_employee: { type: Number, default: 0 },
    pf_employer: { type: Number, default: 0 },
    esi_employee: { type: Number, default: 0 },
    esi_employer: { type: Number, default: 0 },
    professional_tax: { type: Number, default: 0 },
    tds: { type: Number, default: 0 },
    gross_salary: { type: Number, default: 0 },
    net_salary: { type: Number, default: 0 },
    is_current: { type: Boolean, default: true },
    notes: String
}, { timestamps: true });

// Virtual fields for calculations
salaryStructureSchema.pre('save', function (next) {
    // Calculate gross salary (all earnings)
    this.gross_salary = this.basic + this.hra + this.da + this.ta + this.special_allowance;

    // Calculate net salary (gross - all deductions)
    this.net_salary = this.gross_salary - (this.pf_employee + this.esi_employee + this.professional_tax + this.tds);

    next();
});

// ── LEAVE TYPE ───────────────────────────────────────────────────────────────
const leaveTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    max_days: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
    description: String
}, { timestamps: true });

// ── HOLIDAY ──────────────────────────────────────────────────────────────────
const holidaySchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: Date, required: true },
    type: { type: String, enum: ['national', 'regional', 'company'], default: 'company' },
    description: String,
    is_active: { type: Boolean, default: true }
}, { timestamps: true });

const HRDepartment = mongoose.models.HRDepartment || mongoose.model('HRDepartment', hrDepartmentSchema);
const HRRole = mongoose.models.HRRole || mongoose.model('HRRole', hrRoleSchema);
const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
const Leave = mongoose.models.Leave || mongoose.model('Leave', leaveSchema);
const Payroll = mongoose.models.Payroll || mongoose.model('Payroll', payrollSchema);
const SalaryStructure = mongoose.models.SalaryStructure || mongoose.model('SalaryStructure', salaryStructureSchema);
const LeaveType = mongoose.models.LeaveType || mongoose.model('LeaveType', leaveTypeSchema);
const Holiday = mongoose.models.Holiday || mongoose.model('Holiday', holidaySchema);

module.exports = {
    HRDepartment,
    HRRole,
    Employee,
    Attendance,
    Leave,
    Payroll,
    SalaryStructure,
    LeaveType,
    Holiday
};
