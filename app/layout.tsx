import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';
import React from 'react';
import { ThemeProvider } from '../components/ThemeProvider';
import SessionProvider from '../components/SessionProvider';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Pawar Pathology Lab | Precision Diagnostics in Betul',
  description: 'Enterprise-grade clinical diagnostic platform for Betul\'s leading pathology laboratory.',
  icons: { icon: '/favicon.ico' }
};

import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Settings from '@/models/Settings';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { Toaster } from 'sonner';

export default async function RootLayout({
  children,
}: { children: React.ReactNode }) {
  // Production Guard: Security Headers & Maintenance Mode
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;
  const heads = headers();
  const pathname = heads.get('x-invoke-path') || '';

  // Skip maintenance check for login/admin to prevent lockout
  const isExcludedRoute = pathname.startsWith('/login') || pathname.startsWith('/admin') || pathname.startsWith('/maintenance');

  if (!isExcludedRoute) {
    await dbConnect();
    const settings = await Settings.getSingleton();

    // Check Granular Maintenance
    const isMaintenance =
      (settings.maintenanceMode) ||
      (userRole === 'patient' && settings.maintenanceModeUser) ||
      (userRole === 'partner' && settings.maintenanceModePartner) ||
      (!session && settings.maintenanceModeUser); // Block guests too if User blocked

    // Allow Admin to bypass
    if (isMaintenance && userRole !== 'admin') {
      redirect('/maintenance');
    }
  }

  return (
    <html lang="en" className={`${jakarta.variable} ${spaceGrotesk.variable} font-sans`}>
      <body>
        <SessionProvider session={session}>
          <ThemeProvider>
            <div className="grain-overlay" />
            {children}
            <Toaster position="top-center" richColors />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
