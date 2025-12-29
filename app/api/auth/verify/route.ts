import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  const authResult = await verifyToken(request);
  if (authResult.response) {
    return authResult.response;
  }

  // This allows the frontend to see the role (admin or partner)
  return NextResponse.json({ 
    isValid: true, 
    role: authResult.decoded?.role,
    userId: authResult.decoded?.userId,
    name: authResult.decoded?.name
  });
}

