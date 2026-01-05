
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth-options';
import { sanitizeInput } from '@/lib/sanitize';

export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    try {
        const body = await request.json();
        const { phone, address } = body;

        if (!phone || !address) {
            return NextResponse.json({ error: 'Phone and Address are required' }, { status: 400 });
        }

        if (phone.length !== 10) {
            return NextResponse.json({ error: 'Phone must be 10 digits' }, { status: 400 });
        }

        const userId = session.user.id;

        // Sanitize
        const safeAddress = sanitizeInput(address);
        const safePhone = sanitizeInput(phone).replace(/\D/g, '');

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                phone: safePhone,
                address: safeAddress,
                // Ensure we mark them as having completed profile if we had a flag, 
                // but here checking phone !== '0000000000' is the flag.
            },
            { new: true }
        ).select('-password');

        return NextResponse.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error("Profile Update Error:", error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
