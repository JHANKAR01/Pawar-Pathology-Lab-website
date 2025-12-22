import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  role: string;
  name: string;
}

export async function verifyAdmin(request: Request): Promise<{ isAdmin: boolean, response?: NextResponse }> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isAdmin: false, response: NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 }) };
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;

    if (decoded.role === 'admin') {
      return { isAdmin: true };
    } else {
      return { isAdmin: false, response: NextResponse.json({ error: 'Forbidden: Not an admin' }, { status: 403 }) };
    }
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return { isAdmin: false, response: NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 }) };
    }
    console.error('Auth verification error:', error);
    return { isAdmin: false, response: NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) };
  }
}
