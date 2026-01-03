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
  title: {
    default: 'Pawar Pathology Lab | Precision Diagnostics in Betul',
    template: '%s | Pawar Pathology Lab'
  },
  metadataBase: new URL('https://pawarlab.com'),
  description: 'Enterprise-grade clinical diagnostic platform in Betul. Precision analysis since 1998.',
  keywords: ['Pathology Lab Betul', 'Blood Test Betul', 'Diagnostic Center', 'Pawar Lab', 'Medical Lab Betul', 'Thyroid Test Betul', 'Sugar Test Betul'],
  authors: [{ name: 'Pawar Pathology Lab' }],
  creator: 'Pawar Pathology Lab',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://pawarlab.com',
    siteName: 'Pawar Pathology Lab',
    title: 'Pawar Pathology Lab | Precision Diagnostics',
    description: 'Leading diagnostic intelligence provider in Madhya Pradesh. NABH Accredited Lab.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Pawar Lab Diagnostics' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pawar Pathology Lab',
    description: 'Precision Diagnostics in Betul. Book blood tests online.',
    images: ['/og-image.jpg'],
  },
  icons: { icon: '/favicon.ico' },
  alternates: {
    canonical: 'https://pawarlab.com'
  }
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
