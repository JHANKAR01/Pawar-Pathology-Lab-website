
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Test from '@/models/Test';

export async function GET(request: Request) {
  await dbConnect();
  try {
    const tests = await Test.find({}).sort({ title: 1 });
    return NextResponse.json(tests);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
  }
}
