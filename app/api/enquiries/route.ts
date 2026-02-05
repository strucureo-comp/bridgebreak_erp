
import { NextResponse } from 'next/server';
import { createEnquiry } from '@/lib/api';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, subject, message, phone } = body;

        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const enquiryId = await createEnquiry({
            name,
            email,
            subject: subject || 'New Website Enquiry',
            message,
            phone: phone || '',
            status: 'new',
        });

        if (!enquiryId) {
            throw new Error('Failed to create enquiry');
        }

        return NextResponse.json({ success: true, id: enquiryId });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
