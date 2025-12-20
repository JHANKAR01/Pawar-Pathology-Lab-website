
'use client';

import dynamic from 'next/dynamic';

const Hero3D = dynamic(() => import('./Hero3D'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#050505] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-rose-600 rounded-full animate-spin border-t-transparent"></div>
    </div>
  ),
});

export default function Hero3DContainer() {
  return <Hero3D />;
}
