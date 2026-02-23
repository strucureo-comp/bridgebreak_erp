require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const workflowRoutes = require('./routes/workflows');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/workflows', workflowRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function start() {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`\n[Server] BridgeBreak API running on http://localhost:${PORT}`);
        console.log(`[Server] Health: http://localhost:${PORT}/api/health\n`);
    });
}

start().catch(err => {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
});
