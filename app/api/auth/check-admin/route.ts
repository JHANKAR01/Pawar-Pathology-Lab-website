import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, SECRET_KEY);

    const user = await User.findById(decoded.userId);
    if (user && user.role === 'admin') {
      return NextResponse.json({ isAdmin: true });
    }

    return NextResponse.json({ isAdmin: false }, { status: 403 });
  } catch (error) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }
}
