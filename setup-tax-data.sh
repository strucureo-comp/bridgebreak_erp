#!/bin/bash
# APILayer Tax Data Integration - Quick Setup Script
# Run this to quickly set up tax data collection

set -e

echo "=================================================="
echo "APILayer Tax Data Integration - Quick Setup"
echo "=================================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found!"
    echo "Please create .env.local file with your APILayer API key:"
    echo ""
    echo "  APILAYER_API_KEY=your_api_key_here"
    echo ""
    exit 1
fi

# Check if API key is set
if ! grep -q "APILAYER_API_KEY" .env.local; then
    echo "❌ APILAYER_API_KEY not found in .env.local!"
    echo "Please add: APILAYER_API_KEY=your_api_key_here"
    exit 1
fi

echo "✅ Environment configuration found"
echo ""

# Run database migrations
echo "Setting up database..."
npx prisma db push --skip-generate

echo ""
echo "✅ Database ready"
echo ""

echo "=================================================="
echo "✅ Setup Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start your dev server:"
echo "   npm run dev"
echo ""
echo "2. Trigger initial tax data collection:"
echo "   curl -X POST http://localhost:3000/api/admin/tax-management?action=run-job"
echo ""
echo "3. Verify collection succeeded:"
echo "   curl http://localhost:3000/api/settings/tax-data"
echo ""
echo "4. View available countries:"
echo "   curl http://localhost:3000/api/settings/tax-data?action=countries"
echo ""
echo "5. Add TaxDataManagement component to admin dashboard:"
echo "   import { TaxDataManagement } from '@/components/admin/tax-data-management';"
echo ""
echo "For detailed documentation, see: TAX_DATA_SETUP.md"
echo ""
