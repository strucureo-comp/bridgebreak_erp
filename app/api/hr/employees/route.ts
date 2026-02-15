import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const employees = await prisma.employee.findMany({
      orderBy: { name: 'asc' },
      include: {
        dept: { select: { id: true, name: true, code: true } },
        hr_role: { select: { id: true, title: true, code: true, grade: true } },
      }
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
        skill_type: body.skill_type || 'General',
        employment_type: body.employment_type,
        department: body.department,
        department_id: body.department_id || null,
        hr_role_id: body.hr_role_id || null,
        joining_date: new Date(body.joining_date).toISOString(),
        basic_salary: parseFloat(body.basic_salary) || 0,
        overtime_rate: parseFloat(body.overtime_rate) || 0,
        bank_details: body.bank_details,
        email: body.email || null,
        phone: body.phone || null,
        date_of_birth: body.date_of_birth ? new Date(body.date_of_birth).toISOString() : null,
        gender: body.gender || null,
        blood_group: body.blood_group || null,
        marital_status: body.marital_status || null,
        nationality: body.nationality || null,
        address: body.address || null,
        emergency_contact: body.emergency_contact || null,
        pf_number: body.pf_number || null,
        esi_number: body.esi_number || null,
        uan_number: body.uan_number || null,
        pan_number: body.pan_number || null,
        aadhar_number: body.aadhar_number || null,
      }
    });

    // Create a hiring event
    await prisma.hREvent.create({
      data: {
        employee_id: employee.id,
        type: 'hiring',
        title: `${body.name} hired as ${body.role}`,
        event_date: new Date(body.joining_date).toISOString(),
        created_by: user.id,
      }
    });

    return NextResponse.json({
      ...employee,
      basic_salary: Number(employee.basic_salary),
      overtime_rate: Number(employee.overtime_rate)
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Employee ID already exists' }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    // Clean up date fields
    if (updateData.joining_date) updateData.joining_date = new Date(updateData.joining_date).toISOString();
    if (updateData.date_of_birth) updateData.date_of_birth = new Date(updateData.date_of_birth).toISOString();
    if (updateData.confirmation_date) updateData.confirmation_date = new Date(updateData.confirmation_date).toISOString();
    if (updateData.resignation_date) updateData.resignation_date = new Date(updateData.resignation_date).toISOString();
    if (updateData.exit_date) updateData.exit_date = new Date(updateData.exit_date).toISOString();
    if (updateData.basic_salary) updateData.basic_salary = parseFloat(updateData.basic_salary);
    if (updateData.overtime_rate) updateData.overtime_rate = parseFloat(updateData.overtime_rate);

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
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
