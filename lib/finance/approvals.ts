import { prisma } from '@/lib/prisma';

export async function checkApprovalRequired(entityType: string, amount: number) {
    // Find applicable workflow
    const workflow = await prisma.approvalWorkflow.findFirst({
        where: {
            entity_type: entityType,
            is_active: true,
            min_amount: {
                lte: amount
            }
        },
        orderBy: {
            min_amount: 'desc' // Get the highest threshold rule that applies
        }
    });

    return workflow;
}

export async function submitForApproval(
    entityId: string,
    entityType: string,
    userId: string,
    amount: number
) {
    const workflow = await checkApprovalRequired(entityType, amount);

    if (!workflow) {
        return null; // No approval needed
    }

    // Create Approval Request
    const request = await prisma.approvalRequest.create({
        data: {
            entity_type: entityType,
            entity_id: entityId,
            status: 'pending',
            requested_by: userId
        }
    });

    return request;
}

export async function processApproval(
    requestId: string,
    userId: string,
    action: 'approve' | 'reject',
    comments?: string
) {
    const request = await prisma.approvalRequest.findUnique({
        where: { id: requestId },
        include: { requester: true }
    });

    if (!request) throw new Error("Request not found");
    if (request.status !== 'pending') throw new Error("Request already processed");

    // In a real app, verify user role against workflow rules here

    await prisma.approvalRequest.update({
        where: { id: requestId },
        data: {
            status: action === 'approve' ? 'approved' : 'rejected',
            approved_by: userId,
            comments: comments
        }
    });

    // Execute post-approval logic based on entity type
    if (action === 'approve') {
        if (request.entity_type === 'Invoice') {
            await prisma.invoice.update({
                where: { id: request.entity_id },
                data: { status: 'pending' } // Move from draft/review to pending payment
            });
        } else if (request.entity_type === 'PurchaseOrder') {
            await prisma.purchaseOrder.update({
                where: { id: request.entity_id },
                data: { status: 'approved' }
            });
        }
        // Add logic for other entities
    }

    return { success: true };
}
