'use client';

import { SessionProvider as NextAuthSessionProvider, useSession } from 'next-auth/react';
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function SessionProvider({ children, session }: { children: React.ReactNode, session?: any }) {
  // Check for incomplete profile (Google Login default phone)
  const { data: sessionData } = useSession(); // Corrected usage
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (sessionData?.user?.phone === '0000000000' && pathname !== '/complete-profile') {
      router.push('/complete-profile');
    }
  }, [sessionData, pathname, router]);

  return <NextAuthSessionProvider session={session}>{children}</NextAuthSessionProvider>;
}

