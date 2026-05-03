'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import type { Role } from '@attendance-tracker/shared-types';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  SUPER_ADMIN: [
    { label: 'Overview', href: '/super-admin', icon: '[]' },
    { label: 'Cohorts', href: '/super-admin/cohorts', icon: 'C' },
    { label: 'Admins', href: '/super-admin/admins', icon: 'A' },
  ],
  ADMIN: [
    { label: 'Overview', href: '/admin', icon: '[]' },
    { label: 'Students', href: '/admin/students', icon: 'S' },
    { label: 'Batches', href: '/admin/batches', icon: 'B' },
    { label: 'Schedules', href: '/admin/schedules', icon: 'Sch' },
    { label: 'Reports', href: '/admin/reports', icon: 'R' },
  ],
  MENTOR: [
    { label: 'Overview', href: '/mentor', icon: '[]' },
    { label: 'Attendance', href: '/mentor/attendance', icon: 'Att' },
    { label: 'Schedule', href: '/mentor/schedule', icon: 'Sch' },
    { label: 'Batches', href: '/mentor/batches', icon: 'B' },
  ],
  STUDENT: [
    { label: 'Dashboard', href: '/student', icon: '[]' },
    { label: 'My QR Code', href: '/student/attendance', icon: 'QR' },
    { label: 'Schedule', href: '/student/schedule', icon: 'Sch' },
    { label: 'History', href: '/student/attendance/history', icon: 'H' },
  ],
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const navItems = NAV_ITEMS[user.role] ?? [];

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  function renderNav() {
    return (
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href as Route}
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm"
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#FAF7F2]">
      <div className="lg:hidden fixed top-0 inset-x-0 z-20 flex items-center justify-between px-4 py-3 bg-[#121212] border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF6B00] flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Attendance Tracker</p>
            <p className="text-white/50 text-[11px]">{user.role.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white"
        >
          Menu
        </button>
      </div>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMenuOpen(false)}>
          <aside
            className="w-72 max-w-[85vw] h-full bg-[#121212] flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-white/10">
              <div className="min-w-0">
                <p className="text-white/90 text-sm font-medium truncate">{user.name}</p>
                <p className="text-white/50 text-xs truncate">{user.email}</p>
              </div>
              <button onClick={() => setMenuOpen(false)} className="text-white/70 text-lg leading-none">
                X
              </button>
            </div>
            {renderNav()}
            <div className="px-3 py-4 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm"
              >
                <span>{'->'}</span> Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      <aside className="hidden lg:flex w-64 bg-[#121212] flex-col fixed inset-y-0 left-0 z-10">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-[#FF6B00] flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-white font-semibold text-sm">Attendance Tracker</span>
        </div>

        <div className="px-6 py-4 border-b border-white/10">
          <p className="text-white/90 text-sm font-medium truncate">{user.name}</p>
          <p className="text-white/50 text-xs truncate">{user.email}</p>
          <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-[#FF6B00]/20 text-[#FF6B00] text-xs font-medium">
            {user.role.replace('_', ' ')}
          </span>
        </div>

        {renderNav()}

        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm"
          >
            <span>{'->'}</span> Sign out
          </button>
        </div>
      </aside>

      <main className="lg:ml-64 flex-1 min-h-screen pt-[72px] lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
