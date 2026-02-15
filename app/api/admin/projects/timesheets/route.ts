import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function POST(req: Request) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const {
            project_id,
            date,
            hours,
            description,
            billable
        } = body;

        const timesheet = await prisma.timesheetEntry.create({
            data: {
                project_id,
                user_id: user.id, // Employee submitting
                date: new Date(date),
                hours,
                description,
                billable: billable ?? true,
                status: 'submitted'
            }
        });

        return NextResponse.json(timesheet);

    } catch (error) {
        console.error('POST /api/admin/projects/timesheets ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const user = await getCurrentUser();
    // Only admins or project managers should approve
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { id, status } = body; // status: 'approved' | 'rejected'

        const timesheet = await prisma.timesheetEntry.update({
            where: { id },
            data: {
                status,
                approver_id: user.id
            }
        });

        // If approved, update Project Actual Cost
        if (status === 'approved') {
            // Calculate cost (Simplified: assume standard rate $50/hr for now, later fetch from Employee)
            const rate = 50;
            const cost = Number(timesheet.hours) * rate;

            await prisma.project.update({
                where: { id: timesheet.project_id },
                data: {
                    actual_cost: { increment: cost }
                }
            });
        }

        return NextResponse.json(timesheet);

    } catch (error) {
        console.error('PUT /api/admin/projects/timesheets ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
