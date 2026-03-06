const express = require('express');
const Settings = require('../models/Settings');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Public settings that don't require auth
const PUBLIC_SETTINGS = ['branding_config', 'company_profile', 'tenant_status'];

// GET /api/settings/:key
router.get('/:key', async (req, res) => {
    try {
        const setting = await Settings.findOne({ key: req.params.key });
        if (!setting) {
            return res.json({ data: null });
        }
        res.json({ data: setting.value });
    } catch (error) {
        console.error('[Settings] Get Error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// PUT /api/settings/:key (requires auth)
router.put('/:key', auth, adminOnly, async (req, res) => {
    try {
        const { value } = req.body;
        if (value === undefined) {
            return res.status(400).json({ error: 'Value is required' });
        }

        const setting = await Settings.findOneAndUpdate(
            { key: req.params.key },
            { value, updated_by: req.user._id },
            { upsert: true, new: true, runValidators: true }
        );

        res.json({ data: setting.value, message: 'Settings saved' });
    } catch (error) {
        console.error('[Settings] Save Error:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

// GET /api/settings (all settings as object - requires auth)
router.get('/', auth, async (req, res) => {
    try {
        const settings = await Settings.find({});
        const result = {};
        settings.forEach(s => { result[s.key] = s.value; });
        res.json({ data: result });
    } catch (error) {
        console.error('[Settings] GetAll Error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

module.exports = router;
