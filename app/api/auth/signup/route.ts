
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';

import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();
    const { name, email, phone, password, role, operationalRole } = body;

    const sanitizedEmail = email.toLowerCase().trim();

    // Remove username check, check strict email uniqueness
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email: sanitizedEmail,
      phone,
      password: hashedPassword,
      role: role || 'patient',
      operationalRole: operationalRole || 'none',
    });

    return NextResponse.json({ message: 'Registration successful' }, { status: 201 });
  } catch (error: any) {
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      // Extract the first validation message
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json({ error: messages[0] || 'Validation failed' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}
