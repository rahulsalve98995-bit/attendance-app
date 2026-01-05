'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in by fetching current user
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          if (data.user.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/employee');
          }
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <LoadingSpinner size={50} />
      <p className="text-lg text-gray-600 dark:text-gray-400 mt-4">
        Loading...
      </p>
    </main>
  );
}
