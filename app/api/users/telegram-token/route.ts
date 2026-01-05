import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth-options';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import crypto from 'crypto';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    try {
        // Generate a secure random token
        const token = crypto.randomBytes(16).toString('hex');

        // Save to user
        await User.findByIdAndUpdate(session.user.id, {
            telegramSyncToken: token
        });

        const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'PawarPathologyLabBetulBot';

        return NextResponse.json({
            token,
            botUsername
        });
    } catch (error) {
        console.error("Token Generation Error:", error);
        return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
    }
}
