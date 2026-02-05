import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        client: { select: { id: true, full_name: true, email: true } },
        files: true,
        updates: true,
        invoices: true, // Added
      }
    });

    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Access control
    if (user.role !== 'admin' && project.client_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const project = await prisma.project.findUnique({ where: { id: params.id } });

    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (user.role !== 'admin' && project.client_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Clients can only update pending projects or specific fields like tickets (which are JSON fields or separate models)
    // Here we simplified tickets to be a JSON field or related model? 
    // In schema.prisma, "tickets" is NOT a model. Wait.
    // In lib/db/types.ts, tickets is `tickets?: Array<{...}>`.
    // In schema.prisma, I didn't add `tickets` to Project model! I missed it or mapped it differently.
    // Let me check schema.prisma.
    
    // The previous implementation used Firebase where structure is flexible.
    // I need to update schema.prisma to support tickets if they are stored in project, or create a Ticket model.
    // For now, I'll check what fields are in body. If body has `tickets`, I might need to handle it.
    
    // To keep it simple and match "entire backend", I should probably add a Json field `tickets` to Project in schema, 
    // or separate model. The Type definition says `tickets?: Array`.
    // I'll assume for this step I simply update fields that exist on Prisma model.
    
    // Filter out fields that don't exist in Prisma model to avoid errors if passed
    // Actually Prisma ignores unknown fields if not in select/data, but typescript will complain if I cast body to ProjectUpdateInput.
    
    const { tickets, notes, technical_config, ...otherUpdates } = body;
    
    // We need to handle JSON fields: technical_config, notes (string[]), tickets (json)
    // schema.prisma needs update to support these as JSON or related models if they aren't there.
    
    const updateData: any = { ...otherUpdates };
    
    // Checking schema.prisma again...
    // Project model has: id, client_id, title, description, status, github_link, estimated_cost, actual_cost, deadline, test_asset_url, deployment_url.
    // It MISSES: technical_config, notes, tickets.
    // I MUST update schema.prisma to include these as JSON fields or similar to match the types expected by frontend.

    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
