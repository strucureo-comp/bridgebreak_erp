const express = require('express');
const router = express.Router();
const { Employee, HRDepartment, HRRole, Attendance, Leave, Payroll, SalaryStructure, LeaveType, Holiday } = require('../models/HRMS');
const { auth } = require('../middleware/auth');

// Helper to transform MongoDB documents to include id field (alias for _id)
const transformDoc = (doc) => {
    if (!doc) return doc;
    const obj = doc.toObject ? doc.toObject() : doc;
    const transformed = { ...obj, id: obj._id };

    // Rename employee_id to employee if populated (for leaves, attendance, etc.)
    if (transformed.employee_id && typeof transformed.employee_id === 'object') {
        transformed.employee = transformed.employee_id;
        delete transformed.employee_id;
    }

    return transformed;
};

const transformArray = (arr) => arr.map(transformDoc);

// ── EMPLOYEES ───────────────────────────────────────────────────────────────
router.get('/employees', auth, async (req, res) => {
    try {
        const employees = await Employee.find()
            .populate('department_id', 'name')
            .populate('hr_role_id', 'title')
            .sort({ employee_id: 1 });
        res.json(transformArray(employees));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

router.post('/employees', auth, async (req, res) => {
    try {
        const employeeData = { ...req.body };

        // If role is provided as string/title, find the corresponding HR Role
        if (employeeData.role && !employeeData.hr_role_id) {
            const roleDoc = await HRRole.findOne({
                $or: [{ title: employeeData.role }, { _id: employeeData.role }]
            });
            if (roleDoc) {
                employeeData.hr_role_id = roleDoc._id;
            }
        }

        // Clean up if role field exists (it's not a direct schema field)
        delete employeeData.role;

        const employee = new Employee(employeeData);
        await employee.save();

        // Populate references before sending response
        await employee.populate(['department_id', 'hr_role_id']);

        res.status(201).json(transformDoc(employee));
    } catch (err) {
        res.status(500).json({ error: 'Failed to create employee', detail: err.message });
    }
});

router.put('/employees/:id', auth, async (req, res) => {
    try {
        const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });
        res.json(transformDoc(employee));
    } catch (err) {
        res.status(500).json({ error: 'Failed to update employee' });
    }
});

// ── DEPARTMENTS ─────────────────────────────────────────────────────────────
router.get('/departments', auth, async (req, res) => {
    try {
        const depts = await HRDepartment.find().sort({ name: 1 });
        res.json(transformArray(depts));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

router.post('/departments', auth, async (req, res) => {
    try {
        const dept = new HRDepartment(req.body);
        await dept.save();
        res.status(201).json(dept);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create department' });
    }
});

// ── ATTENDANCE ──────────────────────────────────────────────────────────────
router.get('/attendance', auth, async (req, res) => {
    try {
        const { date } = req.query;
        const query = date ? { date: new Date(date) } : {};
        const records = await Attendance.find(query).populate('employee_id', 'name employee_id');
        res.json(transformArray(records));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
});

router.post('/attendance', auth, async (req, res) => {
    try {
        const { employee_id, date, status, check_in, check_out, overtime_hours, project_id } = req.body;
        const record = await Attendance.findOneAndUpdate(
            { employee_id, date: new Date(date) },
            { status, check_in, check_out, overtime_hours, project_id },
            { upsert: true, new: true }
        );
        res.json(transformDoc(record));
    } catch (err) {
        res.status(500).json({ error: 'Failed to mark attendance' });
    }
});

// ── LEAVES ──────────────────────────────────────────────────────────────────
router.get('/leaves', auth, async (req, res) => {
    try {
        const leaves = await Leave.find()
            .populate('employee_id', 'name employee_id')
            .sort({ createdAt: -1 });
        res.json(transformArray(leaves));
    } catch (err) {
        console.error("GET /leaves error", err);
        res.status(500).json({ error: 'Failed to fetch leaves' });
    }
});

router.post('/leaves', auth, async (req, res) => {
    try {
        console.log('[POST /leaves] body:', JSON.stringify(req.body));
        const leave = new Leave(req.body);
        await leave.save();
        res.status(201).json(transformDoc(leave));
    } catch (err) {
        console.error('[POST /leaves] error:', err.message);
        res.status(500).json({ error: 'Failed to apply for leave', detail: err.message });
    }
});

router.put('/leaves/:id', auth, async (req, res) => {
    try {
        const leave = await Leave.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!leave) return res.status(404).json({ error: 'Leave not found' });
        res.json(transformDoc(leave));
    } catch (err) {
        res.status(500).json({ error: 'Failed to update leave status' });
    }
});

// ── PAYROLL ─────────────────────────────────────────────────────────────────
router.get('/payrolls', auth, async (req, res) => {
    try {
        const payrolls = await Payroll.find()
            .populate({
                path: 'lines.employee_id',
                select: 'name employee_id'
            })
            .sort({ month: -1 });

        // Transform payrolls to rename employee_id to employee in lines
        const transformed = payrolls.map(p => {
            const payrollObj = transformDoc(p);
            if (payrollObj.lines) {
                payrollObj.lines = payrollObj.lines.map(line => ({
                    ...line,
                    employee: line.employee_id,
                    id: line._id
                }));
            }
            // Add computed posted_to_finance field based on status
            payrollObj.posted_to_finance = payrollObj.status === 'posted' || payrollObj.status === 'paid';
            // Use total_net for total_amount if needed
            payrollObj.total_amount = payrollObj.total_net;
            return payrollObj;
        });

        res.json(transformed);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch payrolls' });
    }
});

// Preview payroll before generation
router.post('/payrolls/preview', auth, async (req, res) => {
    try {
        const { month } = req.body;

        // Check if payroll already exists for this month
        const existing = await Payroll.findOne({ month });

        // Get all active salary structures
        const structures = await SalaryStructure.find({ is_current: true })
            .populate('employee_id', 'name employee_id status');

        // Filter active employees only
        const activeStructures = structures.filter(s => s.employee_id?.status === 'active');

        if (activeStructures.length === 0) {
            return res.status(400).json({
                error: 'No active employees with salary structures found',
                canGenerate: false
            });
        }

        const total_gross = activeStructures.reduce((sum, s) => sum + (s.basic + s.hra + s.da + s.ta + s.special_allowance), 0);
        const total_deductions = activeStructures.reduce((sum, s) => sum + (s.pf_employee + s.esi_employee + s.professional_tax + s.tds), 0);
        const total_net = activeStructures.reduce((sum, s) => sum + s.net_salary, 0);

        res.json({
            month,
            employeeCount: activeStructures.length,
            total_gross,
            total_deductions,
            total_net,
            exists: !!existing,
            canGenerate: true,
            employees: activeStructures.map(s => ({
                name: s.employee_id.name,
                net_pay: s.net_salary
            }))
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to preview payroll', detail: err.message });
    }
});

router.post('/payrolls/generate', auth, async (req, res) => {
    try {
        const { month, force } = req.body; // Format: YYYY-MM

        // Check if payroll already exists
        const existing = await Payroll.findOne({ month });
        if (existing && !force) {
            return res.status(409).json({
                error: 'Payroll cycle already exists for this month',
                code: 'DUPLICATE_CYCLE',
                existingId: existing._id
            });
        }

        // Get all active salary structures
        const structures = await SalaryStructure.find({ is_current: true })
            .populate('employee_id', 'name employee_id status');

        // Filter active employees only
        const activeStructures = structures.filter(s => s.employee_id?.status === 'active');

        if (activeStructures.length === 0) {
            return res.status(400).json({
                error: 'No active employees with salary structures found'
            });
        }

        // Create payroll lines
        const lines = activeStructures.map(s => ({
            employee_id: s.employee_id._id,
            basic_pay: s.basic,
            overtime_pay: 0,
            allowances: s.hra + s.da + s.ta + s.special_allowance,
            deductions: s.pf_employee + s.esi_employee + s.professional_tax + s.tds,
            net_pay: s.net_salary,
            status: 'pending'
        }));

        const total_gross = lines.reduce((sum, l) => sum + l.basic_pay + l.allowances, 0);
        const total_deductions = lines.reduce((sum, l) => sum + l.deductions, 0);
        const total_net = lines.reduce((sum, l) => sum + l.net_pay, 0);

        // If force replace, delete existing
        if (existing && force) {
            await Payroll.findByIdAndDelete(existing._id);
        }

        const payroll = new Payroll({
            month,
            status: 'processed',
            total_gross,
            total_deductions,
            total_net,
            lines
        });

        await payroll.save();
        res.status(201).json({ message: 'Payroll generated successfully', data: transformDoc(payroll) });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({
                error: 'Payroll cycle already exists for this month',
                code: 'DUPLICATE_CYCLE'
            });
        }
        res.status(500).json({ error: 'Failed to generate payroll', detail: err.message });
    }
});

router.post('/payrolls/:id/post', auth, async (req, res) => {
    try {
        const payroll = await Payroll.findById(req.params.id);
        if (!payroll) return res.status(404).json({ error: 'Payroll not found' });

        // Update payroll status
        payroll.status = 'posted';
        await payroll.save();

        // TODO: Create journal entry in Finance module
        // This would post the payroll expense to the general ledger

        res.json({ message: 'Payroll posted to finance successfully', data: transformDoc(payroll) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to post payroll', detail: err.message });
    }
});

// ── SALARY STRUCTURES ───────────────────────────────────────────────────────
router.get('/salary-structures', auth, async (req, res) => {
    try {
        const structures = await SalaryStructure.find()
            .populate('employee_id', 'name employee_id')
            .sort({ effective_from: -1 });
        res.json(transformArray(structures));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch salary structures' });
    }
});

router.post('/salary-structures', auth, async (req, res) => {
    try {
        // Mark all previous structures for this employee as not current
        await SalaryStructure.updateMany(
            { employee_id: req.body.employee_id },
            { is_current: false }
        );

        // Create new structure
        const structure = new SalaryStructure(req.body);
        await structure.save();

        res.status(201).json(transformDoc(structure));
    } catch (err) {
        res.status(500).json({ error: 'Failed to create salary structure', detail: err.message });
    }
});

// ── HR ROLES ─────────────────────────────────────────────────────────────────
router.get('/roles', auth, async (req, res) => {
    try {
        const roles = await HRRole.find().sort({ title: 1 });
        res.json(transformArray(roles));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
});

router.post('/roles', auth, async (req, res) => {
    try {
        const role = new HRRole(req.body);
        await role.save();
        res.status(201).json(transformDoc(role));
    } catch (err) {
        res.status(500).json({ error: 'Failed to create role', detail: err.message });
    }
});

router.put('/roles/:id', auth, async (req, res) => {
    try {
        const role = await HRRole.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!role) return res.status(404).json({ error: 'Role not found' });
        res.json(transformDoc(role));
    } catch (err) {
        res.status(500).json({ error: 'Failed to update role' });
    }
});

// ── LEAVE TYPES ──────────────────────────────────────────────────────────────
router.get('/leave-types', auth, async (req, res) => {
    try {
        const leaveTypes = await LeaveType.find().sort({ name: 1 });
        res.json(transformArray(leaveTypes));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch leave types' });
    }
});

router.post('/leave-types', auth, async (req, res) => {
    try {
        const leaveType = new LeaveType(req.body);
        await leaveType.save();
        res.status(201).json(transformDoc(leaveType));
    } catch (err) {
        res.status(500).json({ error: 'Failed to create leave type', detail: err.message });
    }
});

// ── HOLIDAYS ─────────────────────────────────────────────────────────────────
router.get('/holidays', auth, async (req, res) => {
    try {
        const holidays = await Holiday.find({ is_active: true }).sort({ date: 1 });
        res.json(transformArray(holidays));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch holidays' });
    }
});

router.post('/holidays', auth, async (req, res) => {
    try {
        const holiday = new Holiday(req.body);
        await holiday.save();
        res.status(201).json(transformDoc(holiday));
    } catch (err) {
        res.status(500).json({ error: 'Failed to create holiday', detail: err.message });
    }
});

router.delete('/holidays/:id', auth, async (req, res) => {
    try {
        await Holiday.findByIdAndDelete(req.params.id);
        res.json({ message: 'Holiday deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete holiday' });
    }
});

module.exports = router;
