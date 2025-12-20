import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';
import React from 'react';

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
  title: 'Pawar Pathology Lab | Precision Diagnostics',
  description: 'Enterprise-grade clinical diagnostic platform for Betul\'s leading pathology laboratory.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans bg-slate-50 text-slate-900 selection:bg-rose-100 selection:text-rose-600 overflow-x-hidden">
        <div className="grain-overlay" />
        {children}
      </body>
    </html>
  );
}