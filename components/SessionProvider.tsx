'use client';

import { SessionProvider as NextAuthSessionProvider, useSession } from 'next-auth/react';
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';

const ProfileWatcher = () => {
  const { data: sessionData } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (sessionData?.user?.phone === '0000000000' && pathname !== '/complete-profile') {
      router.push('/complete-profile');
    }
  }, [sessionData, pathname, router]);

  return null;
};

export default function SessionProvider({ children, session }: { children: React.ReactNode, session?: any }) {
  return (
    <NextAuthSessionProvider session={session}>
      <ProfileWatcher />
      {children}
    </NextAuthSessionProvider>
  );
}

