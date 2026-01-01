'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Attendance } from '@/types';

export default function EmployeePage() {
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [message, setMessage] = useState('');
  const router = useRouter();

  /* 🔐 Logout */
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  /* 📥 Fetch today's attendance */
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

  /* 🟢 Punch In / Punch Out */
  const handlePunch = async () => {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'punch' }),
    });

    const data = await res.json();
    res.ok ? setMessage(data.message) : setMessage(data.error);
    fetchAttendance();
  };

  /* ⏸️ Start Break */
  const handleBreakStart = async () => {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'break_start' }),
    });

    const data = await res.json();
    res.ok ? setMessage(data.message) : setMessage(data.error);
    fetchAttendance();
  };

  /* ▶️ End Break */
  const handleBreakEnd = async () => {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'break_end' }),
    });

    const data = await res.json();
    res.ok ? setMessage(data.message) : setMessage(data.error);
    fetchAttendance();
  };

  /* 📊 Status text */
  const getStatus = () => {
    if (!attendance || !attendance.punchIn) return 'Not punched in';
    if (attendance.punchIn && !attendance.punchOut) {
      if (attendance.breakStart && !attendance.breakEnd) return 'On break';
      return 'Working';
    }
    return 'Punched out';
  };

  /* 🔘 Button visibility rules */
  const canPunchIn = !attendance || !attendance.punchIn;
  const canPunchOut = attendance?.punchIn && !attendance?.punchOut;
  const canStartBreak =
    attendance?.punchIn &&
    !attendance?.punchOut &&
    !attendance?.breakStart;
  const canEndBreak =
    attendance?.breakStart && !attendance?.breakEnd;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md text-center">

        {/* Logout */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-6">Employee Dashboard</h1>

        {/* 📄 Attendance Info */}
        <div className="mb-6 space-y-1">
          <p className="text-lg font-semibold">Status: {getStatus()}</p>

          {attendance?.punchIn && (
            <p>Punched in: {new Date(attendance.punchIn).toLocaleTimeString()}</p>
          )}

          {attendance?.breakStart && (
            <p>Break started: {new Date(attendance.breakStart).toLocaleTimeString()}</p>
          )}

          {attendance?.breakEnd && (
            <p>Break ended: {new Date(attendance.breakEnd).toLocaleTimeString()}</p>
          )}

          {attendance?.punchOut && (
            <p>Punched out: {new Date(attendance.punchOut).toLocaleTimeString()}</p>
          )}

          {attendance?.totalWorkingHours !== null &&
            attendance?.totalWorkingHours !== undefined && (
              <p className="font-semibold">
                Total working hours:{' '}
                {attendance.totalWorkingHours.toFixed(2)} hrs
              </p>
            )}
        </div>

        {/* 🔘 Action Buttons */}
        <div className="space-y-4">
          {(canPunchIn || canPunchOut) && (
            <button
              onClick={handlePunch}
              className="w-full bg-green-500 text-white p-4 rounded text-xl"
            >
              {canPunchOut ? 'Punch Out' : 'Punch In'}
            </button>
          )}

          {canStartBreak && (
            <button
              onClick={handleBreakStart}
              className="w-full bg-yellow-500 text-white p-4 rounded text-xl"
            >
              Start Break
            </button>
          )}

          {canEndBreak && (
            <button
              onClick={handleBreakEnd}
              className="w-full bg-blue-500 text-white p-4 rounded text-xl"
            >
              End Break
            </button>
          )}
        </div>

        {/* ℹ️ Message */}
        {message && <p className="mt-4 text-blue-600">{message}</p>}
      </div>
    </main>
  );
}
