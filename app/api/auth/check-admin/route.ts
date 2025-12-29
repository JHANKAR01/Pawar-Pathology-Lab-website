import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  role: string;
  name: string;
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;

    // Return role information for both admin and partner verification
    if (decoded.role === 'admin') {
      return NextResponse.json({ isAdmin: true, role: decoded.role, message: 'Admin verified' });
    } else if (decoded.role === 'partner') {
      return NextResponse.json({ isAdmin: false, role: decoded.role, message: 'Partner verified' });
    } else {
      return NextResponse.json({ error: 'Forbidden: Invalid role' }, { status: 403 });
    }

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    console.error('Check admin error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
