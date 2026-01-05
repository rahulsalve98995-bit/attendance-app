'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Roster, ShiftType } from '@/types';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

interface Report {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  date: string;
  punchIn: string | null;
  punchOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  totalWorkingHours: number | null;
  punchInLatitude: number | null;
  punchInLongitude: number | null;
  punchOutLatitude: number | null;
  punchOutLongitude: number | null;
}

interface RosterGridProps {
  users: User[];
  roster: Roster[];
  onUpdate: (id: string, shift: string) => void;
  onRefresh: () => void;
  onError: (error: string) => void;
}

function RosterGrid({ users, roster, onUpdate, onRefresh, onError }: RosterGridProps) {
  // Generate dates for the current week (Sunday to Saturday)
  const getWeekDates = () => {
    const dates = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'long' }),
        display: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const getRosterForUserAndDate = (userId: string, date: string) => {
    return roster.find(r => r.employeeId === userId && r.date === date);
  };

  const handleShiftChange = async (userId: string, date: string, newShift: string) => {
    const existing = getRosterForUserAndDate(userId, date);
    if (newShift === 'Week Off') {
      if (existing) {
        // Delete the entry
        const res = await fetch(`/api/roster?id=${existing.id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (res.ok) await onRefresh();
        else onError('Failed to update roster');
      }
    } else {
      if (existing) {
        // Update
        await onUpdate(existing.id, newShift);
        await onRefresh();
      } else {
        // Create new
        const res = await fetch('/api/roster', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([{ employeeId: userId, date, shift: newShift }]),
          credentials: 'include'
        });
        if (res.ok) await onRefresh();
        else onError('Failed to update roster');
      }
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
            <th className="p-3 text-left">Engineer</th>
            {weekDates.map(({ date, day, display }) => (
              <th key={date} className="p-3 text-center">
                <div className="text-sm font-medium">{day}</div>
                <div className="text-xs">{display}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.filter(u => u.role === 'employee').map((user) => (
            <tr key={user.id} className="border-t hover:bg-slate-50 dark:hover:bg-gray-600 transition">
              <td className="p-3 font-medium">{user.name}</td>
              {weekDates.map(({ date }) => {
                const entry = getRosterForUserAndDate(user.id, date);
                return (
                  <td key={date} className="p-3 text-center">
                    <select
                      value={entry ? entry.shift : 'Week Off'}
                      onChange={(e) => handleShiftChange(user.id, date, e.target.value)}
                      className="w-full p-1 border rounded text-sm"
                    >
                      <option value="Week Off">Week Off</option>
                      <option value="Night Shift">Night Shift</option>
                      <option value="General Shift">General Shift</option>
                      <option value="Second Shift">Second Shift</option>
                      <option value="First Shift">First Shift</option>
                    </select>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [roster, setRoster] = useState<Roster[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  /* 🔐 Logout */
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  /* 📥 Fetch users */
  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    } else {
      router.push('/login');
    }
  }, [router]);

  /* 📥 Fetch current user */
  const fetchCurrentUser = useCallback(async () => {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      setCurrentUser(data.user);
    }
  }, []);

  /*  Fetch recent reports for map */
  const fetchReports = useCallback(async () => {
    const res = await fetch('/api/reports');
    if (res.ok) {
      const data = await res.json();
      setReports(data.reports.slice(0, 50)); // Limit to recent 50 for performance
    }
  }, []);

  /* 📅 Fetch roster */
  const fetchRoster = useCallback(async () => {
    const res = await fetch('/api/roster');
    if (res.ok) {
      const data = await res.json();
      setRoster(data.roster);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchReports();
    fetchCurrentUser();
    fetchRoster();
  }, [fetchUsers, fetchReports, fetchCurrentUser, fetchRoster]);

  /* ➕ Create user */
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });

    if (res.ok) {
      setName('');
      setEmail('');
      setPassword('');
      setRole('employee');
      fetchUsers();
    } else {
      const data = await res.json();
      setError(data.error);
    }
  };

  /* 🗑️ Delete user */
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    const res = await fetch(`/api/users?id=${userId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      fetchUsers();
    } else {
      const data = await res.json();
      setError(data.error);
    }
  };

  /* 🔄 Update shift */
  const handleUpdateShift = async (id: string, newShift: string) => {
    const res = await fetch('/api/roster', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, shift: newShift }),
      credentials: 'include'
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
    }
  };

  // Prepare locations for map
  const locations = reports.flatMap(report => {
    const locs = [];
    if (report.punchInLatitude && report.punchInLongitude) {
      locs.push({
        lat: report.punchInLatitude,
        lng: report.punchInLongitude,
        label: `${report.userName} - Punch In (${new Date(report.punchIn!).toLocaleString()})`,
        type: 'punchIn' as const,
      });
    }
    if (report.punchOutLatitude && report.punchOutLongitude) {
      locs.push({
        lat: report.punchOutLatitude,
        lng: report.punchOutLongitude,
        label: `${report.userName} - Punch Out (${new Date(report.punchOut!).toLocaleString()})`,
        type: 'punchOut' as const,
      });
    }
    return locs;
  });

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
            Admin Dashboard
          </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ➕ Add User Card */}
        <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Add New User</h2>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />

            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'employee')}
              className="w-full p-3 border rounded-lg"
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </p>
            )}

            <motion.button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Create User
            </motion.button>
          </form>
        </div>

        {/* 👥 Users Table */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-700 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Users</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t hover:bg-slate-50 dark:hover:bg-gray-600 transition"
                  >
                    <td className="p-3 font-medium">{user.name}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{user.email}</td>
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          user.role === 'admin'
                            ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                            : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3">
                      {currentUser && user.id !== currentUser.id && (
                        <motion.button
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Delete
                        </motion.button>
                      )}
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 📅 Roster Management */}
      <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Roster Management</h2>

        <RosterGrid users={users} roster={roster} onUpdate={handleUpdateShift} onRefresh={fetchRoster} onError={setError} />
      </div>

      {/* ️ Location Map */}
      <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Recent Attendance Locations</h2>
        {locations.length > 0 ? (
          <Map locations={locations} height="500px" />
        ) : (
          <p className="text-gray-500 text-center py-8">No location data available</p>
        )}
      </div>
      </div>
    </main>
  </div>
  );
}
