import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Coupon from '@/models/Coupon';
import { verifyAdmin } from '@/lib/auth';

// DELETE /api/coupons/[id] - Delete a coupon (Admin only)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await verifyAdmin(request);
  if (authResult.response) {
    return authResult.response;
  }

  await dbConnect();
  const { id } = params;

  try {
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Coupon deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}

