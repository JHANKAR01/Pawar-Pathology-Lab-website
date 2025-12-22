import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import BlackoutDate from '@/models/BlackoutDate';
import { verifyAdmin } from '@/lib/auth';

// GET handler
export async function GET() {
  await dbConnect();
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Cleanup old dates
    await BlackoutDate.deleteMany({ endDate: { $lt: today } });

    const blackoutDates = await BlackoutDate.find({ isActive: true }).sort({ startDate: 1 });
    return NextResponse.json(blackoutDates);
  } catch (error) {
    console.error('Blackout GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch blackout dates' }, { status: 500 });
  }
}

// POST handler
export async function POST(request: Request) {
  const authResult = await verifyAdmin(request);
  if (authResult.response) {
    return authResult.response;
  }

  await dbConnect();
  try {
    const { reason, startDate, endDate } = await request.json();
    if (!reason || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const newBlackout = await BlackoutDate.create({ reason, startDate, endDate });
    return NextResponse.json(newBlackout, { status: 201 });
  } catch (error) {
    console.error('Blackout POST Error:', error);
    return NextResponse.json({ error: 'Failed to create blackout date' }, { status: 500 });
  }
}

// DELETE handler
export async function DELETE(request: Request) {
    const authResult = await verifyAdmin(request);
    if (authResult.response) {
        return authResult.response;
    }
    
    await dbConnect();
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'Missing blackout date ID' }, { status: 400 });
        }
        await BlackoutDate.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Blackout date deleted' }, { status: 200 });
    } catch (error) {
        console.error('Blackout DELETE Error:', error);
        return NextResponse.json({ error: 'Failed to delete blackout date' }, { status: 500 });
    }
}
