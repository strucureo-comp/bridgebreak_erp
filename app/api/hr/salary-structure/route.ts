import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id');

    try {
        const where: any = {};
        if (employeeId) where.employee_id = employeeId;

        const structures = await prisma.salaryStructure.findMany({
            where,
            include: { employee: { select: { id: true, name: true, employee_id: true } } },
            orderBy: { effective_from: 'desc' },
        });
        const serialized = structures.map(s => ({
            ...s,
            basic: Number(s.basic),
            hra: Number(s.hra),
            da: Number(s.da),
            ta: Number(s.ta),
            special_allowance: Number(s.special_allowance),
            pf_employee: Number(s.pf_employee),
            pf_employer: Number(s.pf_employer),
            esi_employee: Number(s.esi_employee),
            esi_employer: Number(s.esi_employer),
            professional_tax: Number(s.professional_tax),
            tds: Number(s.tds),
            gross_salary: Number(s.gross_salary),
            net_salary: Number(s.net_salary),
        }));
        return NextResponse.json(serialized);
    } catch (error) {
        console.error('SalaryStructure GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();

        // Mark previous as not current
        await prisma.salaryStructure.updateMany({
            where: { employee_id: body.employee_id, is_current: true },
            data: { is_current: false }
        });

        const basic = parseFloat(body.basic) || 0;
        const hra = parseFloat(body.hra) || 0;
        const da = parseFloat(body.da) || 0;
        const ta = parseFloat(body.ta) || 0;
        const special_allowance = parseFloat(body.special_allowance) || 0;
        const pf_employee = parseFloat(body.pf_employee) || 0;
        const pf_employer = parseFloat(body.pf_employer) || 0;
        const esi_employee = parseFloat(body.esi_employee) || 0;
        const esi_employer = parseFloat(body.esi_employer) || 0;
        const professional_tax = parseFloat(body.professional_tax) || 0;
        const tds = parseFloat(body.tds) || 0;

        const gross_salary = basic + hra + da + ta + special_allowance;
        const total_deductions = pf_employee + esi_employee + professional_tax + tds;
        const net_salary = gross_salary - total_deductions;

        const structure = await prisma.salaryStructure.create({
            data: {
                employee_id: body.employee_id,
                effective_from: new Date(body.effective_from).toISOString(),
                basic, hra, da, ta, special_allowance,
                pf_employee, pf_employer, esi_employee, esi_employer,
                professional_tax, tds,
                gross_salary,
                net_salary,
                notes: body.notes || null,
            }
        });

        // Also update employee's basic_salary
        await prisma.employee.update({
            where: { id: body.employee_id },
            data: { basic_salary: gross_salary }
        });

        return NextResponse.json({
            ...structure,
            basic: Number(structure.basic),
            hra: Number(structure.hra),
            da: Number(structure.da),
            ta: Number(structure.ta),
            special_allowance: Number(structure.special_allowance),
            pf_employee: Number(structure.pf_employee),
            pf_employer: Number(structure.pf_employer),
            esi_employee: Number(structure.esi_employee),
            esi_employer: Number(structure.esi_employer),
            professional_tax: Number(structure.professional_tax),
            tds: Number(structure.tds),
            gross_salary: Number(structure.gross_salary),
            net_salary: Number(structure.net_salary),
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
