
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Settings from '@/models/Settings';

export async function GET() {
  await dbConnect();
  const settings = await Settings.getSingleton();
  return NextResponse.json(settings);
}

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth-options';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role?.toLowerCase();

  if (!session || (role !== 'admin' && role !== 'master')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const body = await request.json();

  // Update the singleton document
  const settings = await Settings.findOneAndUpdate({}, body, {
    new: true,
    upsert: true, // Create if doesn't exist
    setDefaultsOnInsert: true
  });

  return NextResponse.json(settings);
}
