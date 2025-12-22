import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';
import React from 'react';
import { ThemeProvider } from '../components/ThemeProvider'; // Import ThemeProvider

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
    <html lang="en" className={`${jakarta.variable} ${spaceGrotesk.variable} font-sans`}>
      <body>
        <ThemeProvider> {/* Wrap children with ThemeProvider */}
          <div className="bg-[#050505] min-h-screen text-white">
            <div className="grain-overlay" />
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}