
// lib/seedDatabase.ts
import mongoose from 'mongoose';
import dbConnect from './dbConnect.js'; // Added .js extension
import User from '../models/User.js';    // Added .js extension
import Test from '../models/Test.js';    // Added .js extension
import Booking from '../models/Booking.js';
import Settings from '../models/Settings.js';
import { UserRole, BookingStatus } from '../types.js';

async function seed() {
  await dbConnect();
  console.log('Clearing existing clinical data...');
  
  await Promise.all([
    User.deleteMany({}),
    Test.deleteMany({}),
    Booking.deleteMany({}),
    Settings.deleteMany({}),
  ]);

  console.log('Seeding 16 Authorized Users...');
  const users = await User.create([
    { username: 'jhankar', password: 'jhankar', name: 'Jhankar', role: 'admin' },
    { username: 'keshav', password: 'keshav', name: 'Keshav', role: 'admin' },
    { username: 'vishal', password: 'vishal', name: 'Vishal', role: 'partner' },
    { username: 'manoj', password: 'manoj', name: 'Manoj', role: 'partner' },
    { username: 'shubham', password: 'shubham', name: 'Shubham', role: 'partner' },
    { username: 'shankar', password: 'shankar', name: 'Shankar', role: 'partner' },
    ...Array.from({ length: 10 }, (_, i) => ({
      username: `user${i + 1}`,
      password: `user${i + 1}`,
      name: `Patient ${i + 1}`,
      role: 'patient',
    })),
  ]);

  console.log('Seeding Lab Test Directory...');
  const tests = await Test.create([
    { title: 'CBC - Hematology Profile', price: 350, category: 'Hematology' },
    { title: 'Diabetes Screen (HbA1c)', price: 500, category: 'Biochemistry' },
    { title: 'Thyroid Profile (T3, T4, TSH)', price: 450, category: 'Endocrinology' },
    { title: 'Liver Function Test (LFT)', price: 800, category: 'Biochemistry' },
  ]);

  console.log('Setting Default Referral logic...');
  await Booking.create({
    patientName: 'Seed Patient',
    bookedByEmail: 'user1',
    userId: users.find(u => u.username === 'user1')?._id,
    tests: [tests[0]],
    totalAmount: 350,
    balanceAmount: 0,
    amountTaken: 350,
    status: 'completed',
    referredBy: 'Self', // Verified default
    scheduledDate: new Date(),
  });

  console.log('Seeding Global Settings...');
  await Settings.create({ requireVerification: true, maintenanceMode: false });

  console.log('Database Seeded Successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding Failed:', err);
  process.exit(1);
});
