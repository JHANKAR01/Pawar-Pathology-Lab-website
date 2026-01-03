// lib/seedDatabase.ts
import 'dotenv/config';
import mongoose from 'mongoose';
import dbConnect from './dbConnect.js';
import User from '../models/User.js';
import Test from '../models/Test.js';
import Booking from '../models/Booking.js';
import Settings from '../models/Settings.js';
import bcrypt from 'bcryptjs'; // Needed to hash passwords

async function seed() {
  await dbConnect();
  console.log('Clearing existing data...');

  await Promise.all([
    User.deleteMany({}),
    Test.deleteMany({}),
    Booking.deleteMany({}),
    Settings.deleteMany({}),
  ]);

  const hashedPassword = await bcrypt.hash('password123', 10);

  console.log('Seeding Secure Users...');
  const users = await User.create([
    {
      email: 'admin@gmail.com',
      password: hashedPassword,
      name: 'Jhankar Admin',
      role: 'admin',
      phone: '9999999999'
    },
    {
      email: 'partner@gmail.com',
      password: hashedPassword,
      name: 'Vishal Partner',
      role: 'partner',
      phone: '8888888888'
    },
    {
      email: 'user1@gmail.com',
      password: hashedPassword,
      name: 'Patient One',
      role: 'patient',
      phone: '7777777777'
    }
  ]);

  console.log('Seeding Directory & Settings...');
  const tests = await Test.create([
    { title: 'CBC - Hematology Profile', price: 350, category: 'Hematology' },
    { title: 'Diabetes Screen (HbA1c)', price: 500, category: 'Biochemistry' },
  ]);

  await Settings.create({
    requireVerification: true,
    maintenanceMode: false,
    smsEnabled: true,
    emailEnabled: true,
    serviceRadius: 10
  });

  console.log('Database Seeded Successfully! Use admin@gmail.com / password123 to login.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding Failed:', err);
  process.exit(1);
});
