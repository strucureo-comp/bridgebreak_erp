import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const employees = await prisma.employee.findMany({
      orderBy: { name: 'asc' }
    });

    const serializedEmployees = employees.map(emp => ({
      ...emp,
      basic_salary: Number(emp.basic_salary),
      overtime_rate: Number(emp.overtime_rate)
    }));

    return NextResponse.json(serializedEmployees);
  } catch (error) {
    console.error('Employees GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const employee = await prisma.employee.create({
      data: {
        employee_id: body.employee_id,
        name: body.name,
        role: body.role,
        skill_type: body.skill_type,
        employment_type: body.employment_type,
        department: body.department,
        joining_date: new Date(body.joining_date).toISOString(),
        basic_salary: parseFloat(body.basic_salary),
        overtime_rate: parseFloat(body.overtime_rate),
        bank_details: body.bank_details,
      }
    });
    return NextResponse.json({
      ...employee,
      basic_salary: Number(employee.basic_salary),
      overtime_rate: Number(employee.overtime_rate)
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
