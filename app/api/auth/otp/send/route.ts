import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import OTP from '@/models/OTP';
import { sendSmartNotification } from '@/lib/notifications';

export async function POST(request: Request) {
    await dbConnect();
    try {
        const { email, name } = await request.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }

        const sanitizedEmail = email.toLowerCase().trim();

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Upsert OTP record
        // We update the existing record if it exists to reset the code and expiry
        await OTP.findOneAndUpdate(
            { email: sanitizedEmail, purpose: 'signup' },
            {
                code: otpCode,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
                verified: false
            },
            { upsert: true, new: true }
        );

        // Send Notification
        // We intentionally don't await this to speed up response, 
        // BUT for OTP reliability it's often better to await to ensure provider didn't fail.
        // Given the prompt requirement for reliability, we will await.
        await sendSmartNotification('OTP_VERIFICATION', {
            customerEmail: sanitizedEmail,
            customerName: name || 'User',
            otpCode: otpCode
        });

        return NextResponse.json({ message: 'OTP sent successfully' }, { status: 200 });

    } catch (error) {
        console.error('OTP Send Error:', error);
        return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
    }
}
