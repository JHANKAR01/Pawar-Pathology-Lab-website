import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';
import { verifyToken } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    let userEmail: string | null = null;

    // Try NextAuth session first
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        userEmail = session.user.email;
      }
    } catch (e) {
      // NextAuth not available, try JWT token
    }

    // If no NextAuth session, try JWT token from Authorization header
    if (!userEmail) {
      const authResult = await verifyToken(request);
      if (authResult.isValid && authResult.decoded) {
        userEmail = authResult.decoded.email || null;
      }
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phone, address } = body;

    if (!phone || !address) {
      return NextResponse.json(
        { error: 'Phone number and address are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Update user profile
    const user = await User.findOneAndUpdate(
      { email: userEmail },
      { phone, address },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
        name: user.name,
        email: user.email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      token,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    console.error('Profile completion error:', error);
    return NextResponse.json(
      { error: 'Failed to complete profile' },
      { status: 500 }
    );
  }
}

