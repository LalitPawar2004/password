'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VaultPanel from '@/components/VaultPanel';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to login so users see the auth screen first
    router.push('/login');
  }, [router]);
  // Render nothing because we immediately redirect to /login
  return null;
}
