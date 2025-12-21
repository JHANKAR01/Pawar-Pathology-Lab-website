import mongoose from 'mongoose';
import dbConnect from './dbConnect';
import User from '../models/User';
import Test from '../models/Test';
import Booking from '../models/Booking';
import Settings from '../models/Settings';
import { UserRole, BookingStatus, CollectionType } from '../types';

async function seed() {
  await dbConnect();

  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Test.deleteMany({}),
    Booking.deleteMany({}),
    Settings.deleteMany({}),
  ]);

  console.log('Seeding Users...');
  const users = await User.create([
    { username: 'jhankar', password: 'jhankar', name: 'Jhankar', role: UserRole.ADMIN },
    { username: 'keshav', password: 'keshav', name: 'Keshav', role: UserRole.ADMIN },
    { username: 'vishal', password: 'vishal', name: 'Vishal', role: UserRole.PARTNER },
    { username: 'manoj', password: 'manoj', name: 'Manoj', role: UserRole.PARTNER },
    { username: 'shubham', password: 'shubham', name: 'Shubham', role: UserRole.PARTNER },
    { username: 'shankar', password: 'shankar', name: 'Shankar', role: UserRole.PARTNER },
    ...Array.from({ length: 10 }, (_, i) => ({
      username: `user${i + 1}`,
      password: `user${i + 1}`,
      name: `Patient ${i + 1}`,
      role: UserRole.PATIENT,
    })),
  ]);

  console.log('Seeding Tests...');
  const tests = await Test.create([
    { title: 'CBC - Hematology Profile', price: 350, category: 'Hematology' },
    { title: 'Diabetes Screen (HbA1c)', price: 500, category: 'Biochemistry' },
    { title: 'Lipid Profile', price: 650, category: 'Biochemistry' },
    { title: 'Thyroid Profile (T3, T4, TSH)', price: 450, category: 'Endocrinology' },
    { title: 'Liver Function Test (LFT)', price: 800, category: 'Biochemistry' },
    { title: 'Kidney Function Test (KFT)', price: 900, category: 'Biochemistry' },
  ]);

  console.log('Seeding Settings...');
  await Settings.create({ requireVerification: true, maintenanceMode: false });

  console.log('Seeding Sample Bookings...');
  const patient1 = users.find(u => u.username === 'user1');
  const patient2 = users.find(u => u.username === 'user2');

  await Booking.create([
    {
      patientName: patient1?.name,
      bookedByEmail: patient1?.username,
      userId: patient1?._id, // Foreign Key to Users
      tests: [tests[0]],      // Reference to CBC Test
      totalAmount: tests[0].price,
      balanceAmount: 0,
      amountTaken: tests[0].price,
      status: BookingStatus.COMPLETED,
      referredBy: 'Self',     // Default Referral
      scheduledDate: new Date(),
    },
    {
      patientName: patient1?.name,
      bookedByEmail: patient1?.username,
      userId: patient1?._id,
      tests: [tests[0]],
      totalAmount: tests[0].price,
      balanceAmount: tests[0].price,
      amountTaken: 0,
      status: BookingStatus.PENDING,
      referredBy: 'Dr. Sameer', // Doctor Referral
      scheduledDate: new Date(),
    },
    {
      patientName: patient2?.name,
      bookedByEmail: patient2?.username,
      userId: patient2?._id,
      tests: [tests[3]],
      totalAmount: tests[3].price,
      balanceAmount: 0,
      amountTaken: tests[3].price,
      status: BookingStatus.COMPLETED,
      referredBy: 'Self',
      scheduledDate: new Date(),
    }
  ]);

  console.log('Database Seeded Successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});