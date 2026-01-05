
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import OTP from '@/models/OTP';
import Settings from '@/models/Settings';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth-options';

import bcrypt from 'bcryptjs';

import { withRateLimit } from '@/lib/withRateLimit';
import { sanitizeInput } from '@/lib/sanitize';

async function handler(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();
    const { name, email, phone, password, role, operationalRole, otp, address } = body;

    const sanitizedName = sanitizeInput(name || '');
    const sanitizedEmail = email.toLowerCase().trim();

    // 0. Check Settings requirements
    const settings = await Settings.getSingleton();

    // 1. Validate OTP (if required)
    if (settings.appControl?.requireVerification) {
      if (!otp) {
        return NextResponse.json({ error: 'OTP is required' }, { status: 400 });
      }

      const otpRecord = await OTP.findOne({ email: sanitizedEmail, purpose: 'signup' });

      // Failure 1: No record or mismatch
      if (!otpRecord || otpRecord.code !== otp) {
        return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
      }

      // Failure 2: Expired 
      const now = new Date();
      const otpTime = new Date(otpRecord.updatedAt || otpRecord.createdAt);
      const fiveMinutesInMillis = 5 * 60 * 1000;

      if (now.getTime() - otpTime.getTime() > fiveMinutesInMillis) {
        return NextResponse.json({ error: 'OTP has expired. Please request a new one' }, { status: 400 });
      }

      // Cleanup OTP
      await OTP.deleteOne({ _id: otpRecord._id });
    }

    // 2. Check Existing User
    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
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
      name: sanitizedName,
      email: sanitizedEmail,
      phone,
      address, // Added address
      password: hashedPassword,
      role: role || 'patient',
      operationalRole: operationalRole || 'none',
      isVerified: true, // OTP confirmed identity
      needsProfileCompletion: false // No separate profile completion step needed
    });

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

export const POST = withRateLimit(handler);
