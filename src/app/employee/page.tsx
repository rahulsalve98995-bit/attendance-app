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

  const handleAction = async (action: string) => {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });

    const data = await res.json();
    setMessage(res.ok ? data.message : data.error);
    fetchAttendance();
  };

  const status = !attendance?.punchIn
    ? 'Not Punched In'
    : attendance.punchOut
    ? 'Punched Out'
    : attendance.breakStart && !attendance.breakEnd
    ? 'On Break'
    : 'Working';

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">Employee Dashboard</h1>
          <button
            onClick={handleLogout}
            className="text-sm bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        {/* Status */}
        <div className="text-center mb-6">
          <span className="inline-block px-4 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
            {status}
          </span>
        </div>

        {/* Attendance Info */}
        <div className="space-y-2 text-sm text-gray-700 mb-6">
          {attendance?.punchIn && (
            <p>🟢 Punch In: {new Date(attendance.punchIn).toLocaleTimeString()}</p>
          )}
          {attendance?.breakStart && (
            <p>⏸ Break Start: {new Date(attendance.breakStart).toLocaleTimeString()}</p>
          )}
          {attendance?.breakEnd && (
            <p>▶️ Break End: {new Date(attendance.breakEnd).toLocaleTimeString()}</p>
          )}
          {attendance?.punchOut && (
            <p>🔴 Punch Out: {new Date(attendance.punchOut).toLocaleTimeString()}</p>
          )}
         {attendance && attendance.totalWorkingHours !== null && (
  <p className="font-semibold">
    Total working hours:{' '}
    {attendance.totalWorkingHours.toFixed(2)} hrs
  </p>
)}

        </div>

        {/* Buttons */}
        <div className="space-y-3">
          {!attendance?.punchIn && (
            <button
              onClick={() => handleAction('punch')}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold"
            >
              Punch In
            </button>
          )}

          {attendance?.punchIn && !attendance?.punchOut && (
            <button
              onClick={() => handleAction('punch')}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold"
            >
              Punch Out
            </button>
          )}

          {attendance?.punchIn && !attendance?.breakStart && (
            <button
              onClick={() => handleAction('break_start')}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-semibold"
            >
              Start Break
            </button>
          )}

          {attendance?.breakStart && !attendance?.breakEnd && (
            <button
              onClick={() => handleAction('break_end')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
            >
              End Break
            </button>
          )}
        </div>

        {message && (
          <p className="mt-4 text-center text-sm text-blue-600">{message}</p>
        )}
      </div>
    </main>
  );
}
