'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`/api/reports?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
      } else {
        router.push('/login');
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [startDate, endDate, router]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const totalHours = reports.reduce(
    (sum, r) => sum + (r.totalWorkingHours || 0),
    0
  );

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* 🔝 Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Attendance Reports
          </h1>

          <button
            onClick={() => router.push('/admin')}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            ← Back
          </button>
        </div>

        {/* 📊 Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-500">Total Working Hours</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {totalHours.toFixed(2)} hrs
            </p>
          </div>
        </div>

        {/* 🔍 Filters */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block mt-1 border rounded-lg p-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block mt-1 border rounded-lg p-2"
              />
            </div>

            <button
              onClick={fetchReports}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              {loading ? 'Loading...' : 'Apply Filter'}
            </button>
          </div>
        </div>

        {/* 📋 Table */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-200 sticky top-0">
              <tr>
                <th className="p-3 text-left">Employee</th>
                <th className="p-3">Date</th>
                <th className="p-3">Punch In</th>
                <th className="p-3">Break Start</th>
                <th className="p-3">Break End</th>
                <th className="p-3">Punch Out</th>
                <th className="p-3">Hours</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-t hover:bg-slate-50">
                  <td className="p-3">
                    <div className="font-semibold">{r.userName}</div>
                    <div className="text-xs text-gray-500">{r.userEmail}</div>
                  </td>
                  <td className="p-3 text-center">{r.date}</td>
                  <td className="p-3 text-center">
                    {r.punchIn ? new Date(r.punchIn).toLocaleTimeString() : '-'}
                  </td>
                  <td className="p-3 text-center">
                    {r.breakStart ? new Date(r.breakStart).toLocaleTimeString() : '-'}
                  </td>
                  <td className="p-3 text-center">
                    {r.breakEnd ? new Date(r.breakEnd).toLocaleTimeString() : '-'}
                  </td>
                  <td className="p-3 text-center">
                    {r.punchOut ? new Date(r.punchOut).toLocaleTimeString() : '-'}
                  </td>
                  <td className="p-3 text-center font-semibold text-blue-600">
                    {r.totalWorkingHours
                      ? `${r.totalWorkingHours.toFixed(2)}h`
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {reports.length === 0 && !loading && (
            <p className="text-center text-gray-500 py-10">
              No attendance records found
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
