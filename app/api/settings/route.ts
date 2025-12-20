
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Settings from '@/models/Settings';

export async function GET() {
  await dbConnect();
  const settings = await Settings.getSingleton();
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
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
