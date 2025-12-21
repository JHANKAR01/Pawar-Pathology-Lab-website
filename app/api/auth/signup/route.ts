
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function POST(request: Request) {
  await dbConnect();
  try {
    const { name, username, email, phone, role, operationalRole } = await request.json();
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }

    const newUser = await User.create({
      name,
      username,
      email,
      phone,
      password: username, // Password = Username for your setup
      role: role || 'patient',
      operationalRole: operationalRole || 'none',
    });

    return NextResponse.json({ message: 'Registration successful' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}
