'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Roster, User } from '@/types';
import Sidebar from '@/components/Sidebar';

export default function AdminRosterPage() {
  const [roster, setRoster] = useState<Roster[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [date, setDate] = useState('');
  const [shift, setShift] = useState('');
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  /* 🔐 Logout */
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  /* 📥 Fetch roster */
  const fetchRoster = useCallback(async () => {
    const res = await fetch('/api/roster');
    if (res.ok) {
      const data = await res.json();
      setRoster(data.roster);
    } else {
      router.push('/login');
    }
  }, [router]);

  /* 📥 Fetch users */
  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
  }, []);

  /* 📥 Fetch current user */
  const fetchCurrentUser = useCallback(async () => {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      setCurrentUser(data.user);
    }
  }, []);

  useEffect(() => {
    fetchRoster();
    fetchUsers();
    fetchCurrentUser();
  }, [fetchRoster, fetchUsers, fetchCurrentUser]);

  /* ➕ Create roster entry */
  const handleCreateRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/roster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: selectedUser,
        date,
        shift,
      }),
    });

    if (res.ok) {
      setSelectedUser('');
      setDate('');
      setShift('');
      fetchRoster();
    } else {
      const data = await res.json();
      setError(data.error);
    }
  };

  /* 🗑️ Delete roster entry */
  const handleDeleteRoster = async (rosterId: string) => {
    if (!confirm('Are you sure you want to delete this roster entry?')) return;

    const res = await fetch(`/api/roster?id=${rosterId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      fetchRoster();
    } else {
      const data = await res.json();
      setError(data.error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        userRole="admin"
        userName={currentUser?.name || 'Admin'}
        userAvatar={currentUser?.avatar}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Roster Management
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ➕ Add Roster Entry Card */}
            <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Add Roster Entry</h2>

              <form onSubmit={handleCreateRoster} className="space-y-4">
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Employee</option>
                  {users
                    .filter((user) => user.role === 'employee')
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                </select>

                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />

                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Shift</option>
                  <option value="First Shift">First Shift</option>
                  <option value="Second Shift">Second Shift</option>
                  <option value="General Shift">General Shift</option>
                  <option value="Night Shift">Night Shift</option>
                </select>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {error}
                  </p>
                )}

                <motion.button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Add Roster Entry
                </motion.button>
              </form>
            </div>

            {/* 📅 Roster Table */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-700 rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Roster Entries</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                      <th className="p-3">Employee</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Start Time</th>
                      <th className="p-3">End Time</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-t hover:bg-slate-50 dark:hover:bg-gray-600 transition"
                      >
                        <td className="p-3 font-medium">
                          {users.find((u) => u.id === entry.employeeId)?.name || 'Unknown'}
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">
                          {entry.startTime}
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">
                          {entry.endTime}
                        </td>
                        <td className="p-3">
                          <motion.button
                            onClick={() => handleDeleteRoster(entry.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Delete
                          </motion.button>
                        </td>
                      </tr>
                    ))}

                    {roster.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-500 dark:text-gray-400">
                          No roster entries found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}