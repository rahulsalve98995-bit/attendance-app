'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Attendance } from '@/types';

export default function EmployeePage() {
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const fetchAttendance = useCallback(async () => {
    const res = await fetch('/api/attendance');
    if (res.ok) {
      const data = await res.json();
      setAttendance(data.attendance);
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handlePunch = async () => {
    const res = await fetch('/api/attendance', { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      setMessage(data.message);
      fetchAttendance();
    } else {
      setMessage(data.error);
    }
  };

  const getStatus = () => {
    if (!attendance) return 'Not punched in today';
    if (attendance.punchIn && !attendance.punchOut) return 'Punched in';
    if (attendance.punchIn && attendance.punchOut) return 'Punched out';
    return 'Not punched in today';
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-end mb-4">
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
        <h1 className="text-2xl font-bold mb-6">Employee Dashboard</h1>
        <div className="mb-6">
          <p className="text-lg">Status: {getStatus()}</p>
          {attendance?.punchIn && (
            <p>Punched in at: {new Date(attendance.punchIn).toLocaleTimeString()}</p>
          )}
          {attendance?.punchOut && (
            <p>Punched out at: {new Date(attendance.punchOut).toLocaleTimeString()}</p>
          )}
        </div>
        <button
          onClick={handlePunch}
          className="w-full bg-green-500 text-white p-4 rounded text-xl"
        >
          {attendance?.punchIn && !attendance?.punchOut ? 'Punch Out' : 'Punch In'}
        </button>
        {message && <p className="mt-4 text-blue-500">{message}</p>}
      </div>
    </main>
  );
}