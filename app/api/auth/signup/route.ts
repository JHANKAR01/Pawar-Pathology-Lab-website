
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import OTP from '@/models/OTP';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth-options';

import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();
    const { name, email, phone, password, role, operationalRole, otp } = body;

    const sanitizedEmail = email.toLowerCase().trim();

    // 1. Validate OTP (CRITICAL)
    if (!otp) {
      return NextResponse.json({ error: 'OTP is required' }, { status: 400 });
    }

    const otpRecord = await OTP.findOne({ email: sanitizedEmail, purpose: 'signup' });

    // Failure 1: No record or mismatch
    if (!otpRecord || otpRecord.code !== otp) {
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
    }

    // Failure 2: Expired 
    // Note: MongoDB TTL (expiresAt) auto-deletes, but we double check logic for strictness
    // or if the specialized 5 minute rule differs from DB TTL (10m in existing model).
    // Prompt says "compare createdAt with current time" but since we upserted and set expiresAt/createdAt, 
    // checking `createdAt` or just respecting the update time is simpler.
    // The previous tool created record with `expiresAt = 5 mins from now`.
    // Let's check `updatedAt` (from upsert) vs now > 5 mins.
    const now = new Date();
    const otpTime = new Date(otpRecord.updatedAt || otpRecord.createdAt); // Upsert updates `updatedAt`
    const fiveMinutesInMillis = 5 * 60 * 1000;

    if (now.getTime() - otpTime.getTime() > fiveMinutesInMillis) {
      return NextResponse.json({ error: 'OTP has expired. Please request a new one' }, { status: 400 });
    }

    // 2. Check Existing User
    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // Role security check
    if (role && role !== 'patient') {
      const session = await getServerSession(authOptions);
      if (!session || session.user.role?.toLowerCase() !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized to assign this role' }, { status: 403 });
      }
    }

    // 3. Hash password & Create User
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email: sanitizedEmail,
      phone,
      password: hashedPassword,
      role: role || 'patient',
      operationalRole: operationalRole || 'none',
      isVerified: true // OTP confirmed identity
    });

    // 4. Cleanup OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    return NextResponse.json({ message: 'Registration successful' }, { status: 201 });
  } catch (error: any) {
    console.error("Signup Error:", error);
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json({ error: messages[0] || 'Validation failed' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}
