import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const payrolls = await prisma.payroll.findMany({
      orderBy: { month: 'desc' },
      include: { lines: { include: { employee: true } } }
    }) as Array<any>;

    const serializedPayrolls = payrolls.map(pay => ({
      ...pay,
      total_amount: Number(pay.total_amount),
      lines: pay.lines.map((line: any) => ({
        ...line,
        basic_pay: Number(line.basic_pay),
        overtime_pay: Number(line.overtime_pay),
        deductions: Number(line.deductions),
        total_pay: Number(line.total_pay),
        employee: {
          ...line.employee,
          basic_salary: Number(line.employee.basic_salary),
          overtime_rate: Number(line.employee.overtime_rate)
        }
      }))
    }));

    return NextResponse.json(serializedPayrolls);
  } catch (error) {
    console.error('Payroll GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { month } = await request.json();
    
    // Check if exists
    const existing = await prisma.payroll.findUnique({ where: { month } });
    if (existing) return NextResponse.json({ error: 'Payroll already exists for this month' }, { status: 400 });

    // Calculate Payroll
    const employees = await prisma.employee.findMany({ where: { status: 'active' } });
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(new Date(startDate).setMonth(startDate.getMonth() + 1));

    const payrollLines = [];
    let totalAmount = 0;

    for (const emp of employees) {
      const attendance = await prisma.attendance.findMany({
        where: {
          employee_id: emp.id,
          date: { gte: startDate, lt: endDate }
        }
      });

      const presentDays = attendance.filter(a => a.status === 'present').length;
      const halfDays = attendance.filter(a => a.status === 'half_day').length;
      const totalOvertime = attendance.reduce((sum, a) => sum + a.overtime_hours, 0);

      // Simple calculation logic (can be complex)
      const dailyRate = Number(emp.basic_salary) / 30; // Assuming monthly salary
      const basicPay = (presentDays * dailyRate) + (halfDays * dailyRate * 0.5);
      const overtimePay = totalOvertime * Number(emp.overtime_rate);
      const totalPay = basicPay + overtimePay;

      if (totalPay > 0) {
        payrollLines.push({
          employee_id: emp.id,
          basic_pay: basicPay,
          overtime_pay: overtimePay,
          deductions: 0,
          total_pay: totalPay,
          status: 'pending'
        });
        totalAmount += totalPay;
      }
    }

    const payroll = await prisma.payroll.create({
      data: {
        month,
        status: 'draft',
        total_amount: totalAmount,
        lines: {
          create: payrollLines
        }
      },
      include: { lines: true }
    });

    return NextResponse.json({
      ...payroll,
      total_amount: Number(payroll.total_amount),
      lines: payroll.lines.map(line => ({
        ...line,
        basic_pay: Number(line.basic_pay),
        overtime_pay: Number(line.overtime_pay),
        deductions: Number(line.deductions),
        total_pay: Number(line.total_pay)
      }))
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
