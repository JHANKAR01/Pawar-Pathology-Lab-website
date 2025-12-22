import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';

export async function GET(req: NextRequest) {
  await dbConnect();

  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ isAdmin: false, message: 'Authorization token missing' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables.');
    return NextResponse.json({ isAdmin: false, message: 'Server configuration error' }, { status: 500 });
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from DB to ensure they still exist and check role
    const user = await User.findById(decoded.id);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ isAdmin: false, message: 'Not authorized as admin' }, { status: 403 });
    }

    return NextResponse.json({ isAdmin: true, message: 'Admin verified' }, { status: 200 });

  } catch (error: any) {
    console.error('JWT verification failed:', error.message);
    return NextResponse.json({ isAdmin: false, message: 'Invalid or expired token' }, { status: 401 });
  }
}
