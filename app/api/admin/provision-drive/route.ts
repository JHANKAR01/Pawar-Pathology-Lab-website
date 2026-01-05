
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth-options';
import { provisionNextBatch } from '@/lib/googleDrive';
import dbConnect from '@/lib/dbConnect';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await dbConnect();

        // Optional: Manual trigger can specify days, default to 10
        let days = 10;
        try {
            const body = await request.json();
            if (body.days) days = body.days;
        } catch (e) {
            // Body might be empty
        }

        const result = await provisionNextBatch(days);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Provisioning API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
