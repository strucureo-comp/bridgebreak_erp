require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const workflowRoutes = require('./routes/workflows');
const taxRoutes = require('./routes/tax');
const financeRoutes = require('./routes/finance');
const taxCenterRoutes = require('./routes/tax-center');
const approvalEngineRoutes = require('./routes/approval-engine');
const receivablesRoutes = require('./routes/receivables');
const payablesRoutes = require('./routes/payables');
const inventoryRoutes = require('./routes/inventory');
const projectRoutes = require('./routes/projects');
const hrmsRoutes = require('./routes/hrms');
const crmRoutes = require('./routes/crm');
const procurementRoutes = require('./routes/procurement');
const manufacturingRoutes = require('./routes/manufacturing');
const supportMeetingRoutes = require('./routes/support-meetings');
const fixedAssetsRoutes = require('./routes/fixed-assets');
const stockJournalRoutes = require('./routes/stock-journal');
const projectOpsRoutes = require('./routes/project-ops');
const miscRoutes = require('./routes/misc');
const seedCompleteData = require('./seed');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/tax', taxRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/tax-center', taxCenterRoutes);
app.use('/api/approval-engine', approvalEngineRoutes);
app.use('/api/receivables', receivablesRoutes);
app.use('/api/payables', payablesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/hrms', hrmsRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/manufacturing', manufacturingRoutes);
app.use('/api/support-meetings', supportMeetingRoutes);
app.use('/api/fixed-assets', fixedAssetsRoutes);
app.use('/api/stock-journal', stockJournalRoutes);
app.use('/api/project-ops', projectOpsRoutes);
app.use('/api/misc', miscRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function start() {
    await connectDB();
    // await seedCompleteData();

    app.listen(PORT, () => {
        console.log(`\n[Server] BridgeBreak API running on http://localhost:${PORT}`);
        console.log(`[Server] Health: http://localhost:${PORT}/api/health\n`);
    });
}

start().catch(err => {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
});
