const express = require('express');
const router = express.Router();
const { Employee, HRDepartment, HRRole, Attendance, Leave, Payroll } = require('../models/HRMS');
const { auth } = require('../middleware/auth');

// ── EMPLOYEES ───────────────────────────────────────────────────────────────
router.get('/employees', auth, async (req, res) => {
    try {
        const employees = await Employee.find()
            .populate('department_id', 'name')
            .populate('hr_role_id', 'title')
            .sort({ employee_id: 1 });
        res.json(employees);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

router.post('/employees', auth, async (req, res) => {
    try {
        const employee = new Employee(req.body);
        await employee.save();
        res.status(201).json(employee);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create employee', detail: err.message });
    }
});

router.put('/employees/:id', auth, async (req, res) => {
    try {
        const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });
        res.json(employee);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update employee' });
    }
});

// ── DEPARTMENTS ─────────────────────────────────────────────────────────────
router.get('/departments', auth, async (req, res) => {
    try {
        const depts = await HRDepartment.find().sort({ name: 1 });
        res.json(depts);
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
        res.json(records);
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
        res.json(record);
    } catch (err) {
        res.status(500).json({ error: 'Failed to mark attendance' });
    }
});

// ── LEAVES ──────────────────────────────────────────────────────────────────
router.get('/leaves', auth, async (req, res) => {
    try {
        const leaves = await Leave.find().populate('employee_id', 'name employee_id').sort({ createdAt: -1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch leaves' });
    }
});

router.post('/leaves', auth, async (req, res) => {
    try {
        const leave = new Leave(req.body);
        await leave.save();
        res.status(201).json(leave);
    } catch (err) {
        res.status(500).json({ error: 'Failed to apply for leave' });
    }
});

// ── PAYROLL ─────────────────────────────────────────────────────────────────
router.get('/payrolls', auth, async (req, res) => {
    try {
        const payrolls = await Payroll.find().sort({ month: -1 });
        res.json(payrolls);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch payrolls' });
    }
});

module.exports = router;
