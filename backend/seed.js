const User = require('./models/User');

async function seedSuperAdmin() {
    const email = process.env.SUPERADMIN_EMAIL;
    const password = process.env.SUPERADMIN_PASSWORD;
    const name = process.env.SUPERADMIN_NAME || 'Super Admin';

    if (!email || !password) {
        console.log('[Seed] No SUPERADMIN credentials in .env, skipping seed.');
        return;
    }

    const existingAdmin = await User.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
        console.log(`[Seed] SuperAdmin already exists: ${email}`);
        return;
    }

    await User.create({
        email: email.toLowerCase(),
        password,
        full_name: name,
        role: 'superadmin',
        is_active: true
    });

    console.log(`[Seed] SuperAdmin created: ${email}`);
}

module.exports = seedSuperAdmin;
