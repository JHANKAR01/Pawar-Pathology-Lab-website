import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  role: string;
  name: string;
  email?: string;
}

export async function verifyMaster(request: Request): Promise<{ isMaster: boolean, response?: NextResponse }> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isMaster: false, response: NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 }) };
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;

    if (decoded.role === 'master') {
      return { isMaster: true };
    } else {
      return { isMaster: false, response: NextResponse.json({ error: 'Forbidden: Master access required' }, { status: 403 }) };
    }
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return { isMaster: false, response: NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 }) };
    }
    return { isMaster: false, response: NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) };
  }
}

export async function verifyAdmin(request: Request): Promise<{ isAdmin: boolean, response?: NextResponse }> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isAdmin: false, response: NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 }) };
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;

    // Master role has inherited admin access
    if (decoded.role === 'master' || decoded.role === 'admin') {
      return { isAdmin: true };
    } else {
      return { isAdmin: false, response: NextResponse.json({ error: 'Forbidden: Not an admin' }, { status: 403 }) };
    }
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return { isAdmin: false, response: NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 }) };
    }
    return { isAdmin: false, response: NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) };
  }
}

export async function verifyToken(request: Request): Promise<{ isValid: boolean, decoded?: DecodedToken, response?: NextResponse }> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isValid: false, response: NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 }) };
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;

    return { isValid: true, decoded };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return { isValid: false, response: NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 }) };
    }
    console.error('Token verification error:', error);
    return { isValid: false, response: NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) };
  }
}