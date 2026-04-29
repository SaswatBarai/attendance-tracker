'use client';

import { useEffect, useState } from 'react';
import { userApiClient } from '@/lib/api-client';

interface Props {
  cohortId: string;
  cohortName: string;
  onClose: () => void;
  onAssigned: () => void;
}

type Tab = 'create' | 'assign';

interface AssignableUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  adminProfile: null | {
    cohort: {
      id: string;
      name: string;
    };
  };
}

export function AssignAdminModal({ cohortId, cohortName, onClose, onAssigned }: Props) {
  const [tab, setTab] = useState<Tab>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [userId, setUserId] = useState('');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    if (tab !== 'assign') return;

    const timeoutId = window.setTimeout(async () => {
      setUsersLoading(true);
      setError('');

      try {
        const query = search ? `?search=${encodeURIComponent(search)}` : '';
        const response = await userApiClient.get<{ success: boolean; data: AssignableUser[] }>(
          `/api/admins/assignable-users${query}`
        );
        setUsers(response.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setUsersLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search, tab]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await userApiClient.post('/api/admins', { name, email, password, cohortId });
      onAssigned();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await userApiClient.post('/api/admins/assign', { userId, cohortId });
      onAssigned();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to assign admin');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-[#121212]">Assign Admin</h2>
            <p className="text-[#6B7280] text-xs mt-0.5">for cohort: {cohortName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#121212] text-xl leading-none"
          >
            X
          </button>
        </div>

        <div className="flex gap-1 bg-[#F3F4F6] rounded-xl p-1 mb-5">
          {(['create', 'assign'] as Tab[]).map((currentTab) => (
            <button
              key={currentTab}
              onClick={() => {
                setTab(currentTab);
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                tab === currentTab
                  ? 'bg-white text-[#121212] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#121212]'
              }`}
            >
              {currentTab === 'create' ? 'Create New Admin' : 'Assign Existing'}
            </button>
          ))}
        </div>

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              className="w-full px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50 focus:border-[#FF6B00] transition"
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50 focus:border-[#FF6B00] transition"
            />
            <input
              type="password"
              placeholder="Password (min 8 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50 focus:border-[#FF6B00] transition"
            />
            {error && (
              <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#FF6B00] text-white text-sm font-semibold hover:bg-[#E55F00] transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create & Assign'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAssign} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">Find User</label>
              <input
                type="text"
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50 focus:border-[#FF6B00] transition"
              />
              <p className="text-[#9CA3AF] text-xs mt-1">
                Pick an existing user to promote or reassign as cohort admin
              </p>
            </div>

            <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
              <div className="max-h-56 overflow-y-auto divide-y divide-[#F3F4F6] bg-[#FCFCFC]">
                {usersLoading && (
                  <div className="px-4 py-6 text-sm text-[#6B7280]">Loading users...</div>
                )}

                {!usersLoading && users.length === 0 && (
                  <div className="px-4 py-6 text-sm text-[#6B7280]">No matching users found.</div>
                )}

                {!usersLoading &&
                  users.map((user) => {
                    const selected = userId === user.id;

                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => setUserId(user.id)}
                        className={`w-full px-4 py-3 text-left transition ${
                          selected ? 'bg-[#FFF3EC]' : 'hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#121212] truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-[#6B7280] truncate">{user.email}</p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              selected
                                ? 'bg-[#FF6B00] text-white'
                                : 'bg-[#F3F4F6] text-[#6B7280]'
                            }`}
                          >
                            {selected ? 'Selected' : user.role}
                          </span>
                        </div>
                        {user.adminProfile && (
                          <p className="mt-1 text-[11px] text-[#9CA3AF]">
                            Currently assigned to {user.adminProfile.cohort.name}
                          </p>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !userId}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#FF6B00] text-white text-sm font-semibold hover:bg-[#E55F00] transition disabled:opacity-50"
              >
                {loading ? 'Assigning...' : 'Assign Admin'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
