/**
 * MOCK DATA REPOSITORY - SSE ERP
 * Used for UI-First Development & Prototyping
 */

export const MOCK_PROJECTS = [
    {
        id: 'p1',
        title: 'Structure Bridge A-10',
        description: 'Main span steel fabrication and on-site installation for the highway expansion project.',
        status: 'in_progress',
        client_id: 'c1',
        created_at: new Date().toISOString(),
        progress: 65
    },
    {
        id: 'p2',
        title: 'Logistics Hub Zone 4',
        description: 'Warehouse roofing and mezzanine floor construction.',
        status: 'accepted',
        client_id: 'c2',
        created_at: new Date().toISOString(),
        progress: 25
    },
    {
        id: 'p3',
        title: 'Marina Walk Handrails',
        description: 'Stainless steel handrail installation for the waterfront development.',
        status: 'completed',
        client_id: 'c3',
        created_at: new Date().toISOString(),
        progress: 100
    }
];

export const MOCK_EMPLOYEES = [
    {
        id: 'e1',
        employee_id: 'SSE-001',
        name: 'Ahmed Mansoor',
        role: 'Senior Project Manager',
        department: 'Engineering',
        joining_date: '2024-01-15',
        basic_salary: 25000,
        status: 'active',
        email: 'ahmed@systemsteel.ae',
        phone: '+971 50 123 4567'
    },
    {
        id: 'e2',
        employee_id: 'SSE-042',
        name: 'Rajesh Kumar',
        role: 'Lead Fabricator',
        department: 'Production',
        joining_date: '2024-03-10',
        basic_salary: 8500,
        status: 'active',
        email: 'rajesh@systemsteel.ae',
        phone: '+971 55 987 6543'
    }
];

export const MOCK_FINANCE = {
    revenue: 1250500,
    expenses: 840200,
    profit: 410300,
    assets: 2500000,
    liabilities: 450000,
    equity: 2050000,
    transactions: [
        { id: 't1', type: 'income', category: 'Project Billing', amount: 45000, date: '2026-02-18', description: 'Bridge A-10 Milestone 2' },
        { id: 't2', type: 'expense', category: 'Material Purchase', amount: 12000, date: '2026-02-17', description: 'Steel H-Beams Batch 4' },
        { id: 't3', type: 'expense', category: 'Payroll', amount: 85000, date: '2026-02-01', description: 'Jan 2026 Salary Batch' }
    ]
};

export const MOCK_CRM = {
    leads: [
        { id: 'l1', first_name: 'John', last_name: 'Smith', company: 'BuildCorp UAE', email: 'john@buildcorp.ae', status: 'new', potential_value: 150000 },
        { id: 'l2', first_name: 'Sara', last_name: 'Ali', company: 'Dubai Marina Dev', email: 'sara@dmdev.com', status: 'qualified', potential_value: 450000 }
    ],
    opportunities: [
        { id: 'o1', name: 'Zone 5 Steel Works', amount: 850000, stage: 'proposal', account: { name: 'Emaar Properties' } },
        { id: 'o2', name: 'Refinery Maintenance', amount: 120000, stage: 'negotiation', account: { name: 'ADNOC' } }
    ],
    customers: [
        { id: 'c1', name: 'Emaar Properties', industry: 'Real Estate', website: 'emaar.com' },
        { id: 'c2', name: 'ADNOC', industry: 'Oil & Gas', website: 'adnoc.ae' }
    ]
};

export const MOCK_INVENTORY = [
    { id: 'i1', name: 'Structural Steel H-Beam', category: 'Raw Materials', totalStock: 450, uom: 'mtr', avgCost: 125, variants: [{ sku: 'STL-H-001' }] },
    { id: 'i2', name: 'Welding Rods E6013', category: 'Consumables', totalStock: 12, uom: 'pkt', avgCost: 45, variants: [{ sku: 'WLD-RD-60' }] },
    { id: 'i3', name: 'Industrial Primer Gray', category: 'Paints', totalStock: 85, uom: 'l', avgCost: 18, variants: [{ sku: 'PNT-PR-GR' }] }
];

export const MOCK_PROCUREMENT = {
    requests: [
        { id: 'mr1', item_name: '12mm Rebar', quantity: 500, unit: 'pcs', status: 'pending', project: { title: 'Bridge A-10' }, requester: { full_name: 'Rajesh Kumar' } }
    ],
    orders: [
        { id: 'po1', po_number: 'PO-2026-442', vendor_id: 'v1', total_amount: 15400, status: 'ordered', created_at: '2026-02-15' }
    ],
    vendors: [
        { id: 'v1', name: 'Emirates Steel Industries', contact_person: 'Mustafa Ali', email: 'sales@emiratessteel.com' }
    ]
};

export const MOCK_MANUFACTURING = {
    boms: [
        { id: 'b1', name: 'Standard H-Beam Assembly', output_item: 'Steel H-Beam (Finished)', components: 5, active: true },
        { id: 'b2', name: 'Handrail Unit - SS316', output_item: 'SS Handrail (1m)', components: 3, active: true }
    ],
    orders: [
        { id: 'mo1', order_no: 'MO-2026-001', item: 'H-Beam Assembly', quantity: 150, status: 'in_progress', priority: 'high', start_date: '2026-02-10' },
        { id: 'mo2', order_no: 'MO-2026-042', item: 'SS Handrail', quantity: 50, status: 'planned', priority: 'medium', start_date: '2026-02-20' }
    ]
};
