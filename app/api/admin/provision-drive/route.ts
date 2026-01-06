
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth-options';
import { provisionMonthFolders } from '@/lib/googleDrive';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== 'admin' && session.user.role !== 'master')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { year, monthName, daysInMonth } = await request.json();

        if (!year || !monthName || !daysInMonth) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const result = await provisionMonthFolders(year, monthName, daysInMonth);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Provisioning API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
