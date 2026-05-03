'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@attendance-tracker/shared-types';

const ROLE_REDIRECT: Record<Role, Route> = {
  [Role.SUPER_ADMIN]: '/super-admin',
  [Role.ADMIN]: '/admin',
  [Role.MENTOR]: '/mentor',
  [Role.STUDENT]: '/student',
};

export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && user) {
      router.replace(ROLE_REDIRECT[user.role]);
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
      <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
