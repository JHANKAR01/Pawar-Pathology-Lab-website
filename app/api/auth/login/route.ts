
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  await dbConnect();
  try {
    const { username, password } = await request.json();
    
    // Find user by username first
    const user = await User.findOne({ username });

    // If user exists and password matches (NOTE: In a real app, use bcrypt to compare hashed passwords)
    if (user && user.password === password) {
      
      // Create a sanitized user object to return
      const userForClient = {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      };

      // Create JWT token
      const token = jwt.sign(
        { userId: user._id, role: user.role, name: user.name },
        process.env.JWT_SECRET!, 
        { expiresIn: '1d' } // Token expires in 1 day
      );

      // Return token and sanitized user data
      return NextResponse.json({ token, user: userForClient });

    } else {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
