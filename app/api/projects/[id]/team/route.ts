import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

/**
 * GET /api/projects/[id]/team-and-costs
 * Get all team members allocated to project + their costs
 * Real-time labour cost aggregation
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const projectId = params.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check access
    if (user.role !== 'admin' && project.client_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get labour allocations
    const allocations = await prisma.labourAllocation.findMany({
      where: { project_id: projectId },
      include: {
        employee: {
          include: {
            attendance: {
              where: { project_id: projectId }
            }
          }
        }
      }
    });

    // Get attendance for the project
    const attendance = await prisma.attendance.findMany({
      where: { project_id: projectId },
      include: {
        employee: true
      }
    });

    // Calculate costs per employee
    const teamWithCosts = allocations.map(alloc => {
      const empAttendance = alloc.employee.attendance;
      
      // Calculate labour cost
      let labourCost = 0;
      let workDays = 0;
      let overtimeHours = 0;

      empAttendance.forEach(att => {
        if (att.status === 'present') workDays++;
        if (att.status === 'half_day') workDays += 0.5;
        overtimeHours += att.overtime_hours;
      });

      // Daily rate = basic_salary / 26
      const dailyRate = Number(alloc.employee.basic_salary) / 26;
      const regularPay = workDays * dailyRate;
      const overtimePay = overtimeHours * Number(alloc.employee.overtime_rate);
      labourCost = regularPay + overtimePay;

      return {
        employeeId: alloc.employee.id,
        employeeCode: alloc.employee.employee_id,
        name: alloc.employee.name,
        role: alloc.employee.role,
        skillType: alloc.employee.skill_type,
        employmentType: alloc.employee.employment_type,
        allocation: {
          startDate: alloc.start_date,
          endDate: alloc.end_date,
          status: alloc.status,
          allocationId: alloc.id
        },
        attendance: {
          workDays,
          halfDays: empAttendance.filter(a => a.status === 'half_day').length,
          absentDays: empAttendance.filter(a => a.status === 'absent').length,
          overtimeHours,
          totalDays: empAttendance.length
        },
        salary: {
          basicSalary: alloc.employee.basic_salary,
          dailyRate,
          overtimeRate: alloc.employee.overtime_rate,
          regularPay,
          overtimePay,
          totalCost: labourCost
        }
      };
    });

    // Summary
    const totalLabourCost = teamWithCosts.reduce((sum, emp) => sum + emp.salary.totalCost, 0);
    const totalWorkDays = teamWithCosts.reduce((sum, emp) => sum + emp.attendance.workDays, 0);
    const totalOvertimeHours = teamWithCosts.reduce((sum, emp) => sum + emp.attendance.overtimeHours, 0);
    const avgCostPerDay = totalWorkDays > 0 ? totalLabourCost / totalWorkDays : 0;

    return NextResponse.json({
      project: {
        id: project.id,
        title: project.title
      },
      team: teamWithCosts,
      summary: {
        totalTeamMembers: teamWithCosts.length,
        totalLabourCost,
        totalWorkDays,
        totalOvertimeHours,
        avgCostPerDay: avgCostPerDay.toFixed(2),
        costBreakdown: {
          regularPay: teamWithCosts.reduce((sum, emp) => sum + Number(emp.salary.regularPay), 0),
          overtimePay: teamWithCosts.reduce((sum, emp) => sum + Number(emp.salary.overtimePay), 0)
        }
      }
    });
  } catch (error) {
    console.error('Team and costs error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/projects/[id]/allocate-staff
 * Allocate employee to project
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const projectId = params.id;
    const body = await request.json();
    const { employeeId, startDate, endDate } = body;

    // Check project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Create allocation
    const allocation = await prisma.labourAllocation.create({
      data: {
        employee_id: employeeId,
        project_id: projectId,
        start_date: new Date(startDate),
        end_date: endDate ? new Date(endDate) : null,
        status: 'active'
      },
      include: {
        employee: { select: { name: true, basic_salary: true } }
      }
    });

    return NextResponse.json({
      success: true,
      message: `${employee.name} allocated to project`,
      allocation
    });
  } catch (error) {
    console.error('Allocation error:', error);
    return NextResponse.json({ error: 'Failed to allocate staff' }, { status: 400 });
  }
}
