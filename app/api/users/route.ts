
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth-options';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role?.toLowerCase();

  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    const filter = role ? { role } : {};

    const users = await User.find(filter).select('-password');
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role?.toLowerCase() !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  await dbConnect();
  try {
    const body = await request.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Security: Only allow updating specific fields
    const allowedUpdates = ['name', 'email', 'phone', 'operationalRole', 'telegramChatId'];
    const safeUpdate: any = {};

    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        safeUpdate[key] = updateData[key];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(_id, safeUpdate, { new: true }).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Update User Error:", error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role?.toLowerCase() !== 'admin' && session.user.role?.toLowerCase() !== 'master')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Soft Delete: Set isActive to false
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deactivated successfully', user: updatedUser });
  } catch (error) {
    console.error("Delete User Error:", error);
    return NextResponse.json({ error: 'Failed to deactivate user' }, { status: 500 });
  }
}
