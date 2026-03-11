const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { email, password, full_name } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const user = await User.create({
            email: email.toLowerCase(),
            password,
            full_name,
            role: 'user'
        });

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            user: user.toJSON(),
            token
        });
    } catch (error) {
        console.error('[Auth] Signup Error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (!user.is_active || user.status === 'disabled') {
            return res.status(401).json({ error: 'Account is deactivated' });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Update last login
        user.last_login = new Date();
        user.status = 'active';
        await user.save();

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            user: user.toJSON(),
            token
        });
    } catch (error) {
        console.error('[Auth] Login Error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

router.get('/me', auth, async (req, res) => {
    res.json({ user: req.user.toJSON() });
});

// GET /api/auth/users
router.get('/users', auth, async (req, res) => {
    try {
        const tenant_id = req.user?.tenant_id || 'default';
        const users = await User.find({ tenant_id })
            .select('-password')
            .populate('invited_by', 'full_name')
            .sort({ full_name: 1 });
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
});

// POST /api/auth/users/invite - Invite new user
router.post('/users/invite', auth, adminOnly, async (req, res) => {
    try {
        const { email, role } = req.body;
        const tenant_id = req.user?.tenant_id || 'default';

        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'User with this email already exists' });
        }

        // Generate invitation token
        const invitationToken = crypto.randomBytes(32).toString('hex');
        const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Create user with pending status
        const user = await User.create({
            tenant_id,
            email: email.toLowerCase(),
            password: crypto.randomBytes(16).toString('hex'), // Temporary password
            full_name: '',
            role: role || 'user',
            status: 'pending',
            invited_by: req.user._id,
            invited_at: new Date(),
            invitation_token: invitationToken,
            invitation_expires: invitationExpires
        });

        // TODO: Send invitation email with token link
        // const inviteLink = `${process.env.APP_URL}/accept-invite/${invitationToken}`;
        // await sendInvitationEmail(email, inviteLink);

        res.status(201).json({
            success: true,
            data: user.toJSON(),
            message: `Invitation sent to ${email}`
        });
    } catch (error) {
        console.error('Error inviting user:', error);
        res.status(500).json({ success: false, error: 'Failed to invite user' });
    }
});

// PUT /api/auth/users/:id - Update user
router.put('/users/:id', auth, adminOnly, async (req, res) => {
    try {
        const tenant_id = req.user?.tenant_id || 'default';
        const { full_name, email, role, status } = req.body;

        const user = await User.findOne({ _id: req.params.id, tenant_id });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Update fields
        if (full_name) user.full_name = full_name;
        if (email) user.email = email.toLowerCase();
        if (role) user.role = role;
        if (status) user.status = status;

        await user.save();

        res.json({
            success: true,
            data: user.toJSON(),
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

// DELETE /api/auth/users/:id - Delete user
router.delete('/users/:id', auth, adminOnly, async (req, res) => {
    try {
        const tenant_id = req.user?.tenant_id || 'default';

        // Prevent self-deletion
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
        }

        const user = await User.findOneAndDelete({ _id: req.params.id, tenant_id });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, error: 'Failed to delete user' });
    }
});

// PUT /api/auth/users/:id/toggle-status - Enable/disable user
router.put('/users/:id/toggle-status', auth, adminOnly, async (req, res) => {
    try {
        const tenant_id = req.user?.tenant_id || 'default';
        const { status } = req.body;

        // Prevent self-disabling
        if (req.params.id === req.user._id.toString() && status === 'disabled') {
            return res.status(400).json({ success: false, error: 'Cannot disable your own account' });
        }

        const user = await User.findOne({ _id: req.params.id, tenant_id });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        user.status = status;
        user.is_active = status === 'active';
        await user.save();

        res.json({
            success: true,
            data: user.toJSON(),
            message: `User ${status === 'active' ? 'enabled' : 'disabled'} successfully`
        });
    } catch (error) {
        console.error('Error toggling user status:', error);
        res.status(500).json({ success: false, error: 'Failed to update user status' });
    }
});

// POST /api/auth/users/:id/reset-password - Send password reset
router.post('/users/:id/reset-password', auth, adminOnly, async (req, res) => {
    try {
        const tenant_id = req.user?.tenant_id || 'default';

        const user = await User.findOne({ _id: req.params.id, tenant_id });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.password_reset_token = resetToken;
        user.password_reset_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await user.save();

        // TODO: Send password reset email
        // const resetLink = `${process.env.APP_URL}/reset-password/${resetToken}`;
        // await sendPasswordResetEmail(user.email, resetLink);

        res.json({
            success: true,
            message: `Password reset link sent to ${user.email}`
        });
    } catch (error) {
        console.error('Error sending password reset:', error);
        res.status(500).json({ success: false, error: 'Failed to send password reset' });
    }
});

// PUT /api/auth/users/:id/change-role - Change user role
router.put('/users/:id/change-role', auth, adminOnly, async (req, res) => {
    try {
        const tenant_id = req.user?.tenant_id || 'default';
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({ success: false, error: 'Role is required' });
        }

        const user = await User.findOne({ _id: req.params.id, tenant_id });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        user.role = role;
        await user.save();

        res.json({
            success: true,
            data: user.toJSON(),
            message: `User role changed to ${role}`
        });
    } catch (error) {
        console.error('Error changing user role:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

module.exports = router;
