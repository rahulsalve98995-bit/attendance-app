'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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

  const chartDataRaw = reports.reduce((acc, r) => {
    const user = acc.find(u => u.name === r.userName);
    if (user) {
      user.hours += r.totalWorkingHours || 0;
    } else {
      acc.push({ name: r.userName, hours: r.totalWorkingHours || 0 });
    }
    return acc;
  }, [] as { name: string; hours: number }[]);

  const chartData = {
    labels: chartDataRaw.map(d => d.name),
    datasets: [
      {
        label: 'Hours Worked',
        data: chartDataRaw.map(d => d.hours),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Prepare locations for map
  const locations = reports.flatMap(report => {
    const locs = [];
    if (report.punchInLatitude && report.punchInLongitude && report.punchIn) {
      locs.push({
        lat: report.punchInLatitude,
        lng: report.punchInLongitude,
        label: `${report.userName} - Punch In (${new Date(report.punchIn).toLocaleString()})`,
        type: 'punchIn' as const,
      });
    }
    if (report.punchOutLatitude && report.punchOutLongitude && report.punchOut) {
      locs.push({
        lat: report.punchOutLatitude,
        lng: report.punchOutLongitude,
        label: `${report.userName} - Punch Out (${new Date(report.punchOut).toLocaleString()})`,
        type: 'punchOut' as const,
      });
    }
    return locs;
  });

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-800 p-6">
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
          <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Working Hours</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {totalHours.toFixed(2)} hrs
            </p>
          </div>
        </div>

        {/* 📈 Hours per Employee Chart */}
        {chartDataRaw.length > 0 && (
          <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Hours per Employee</h2>
            <div style={{ height: '300px' }}>
              <Bar data={chartData} />
            </div>
          </div>
        )}

        {/* ️ Location History Map */}
        <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Location History</h2>
          {locations.length > 0 ? (
            <Map locations={locations} height="400px" />
          ) : (
            <p className="text-gray-500 text-center py-8">No location data available for the selected period</p>
          )}
        </div>

        {/* 🔍 Filters */}
        <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-6 mb-6">
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
        <div className="bg-white dark:bg-gray-700 rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-200 sticky top-0">
              <tr>
                <th className="p-3 text-left">Employee</th>
                <th className="p-3">Date</th>
                <th className="p-3">Punch In</th>
                <th className="p-3">Punch In Location</th>
                <th className="p-3">Break Start</th>
                <th className="p-3">Break End</th>
                <th className="p-3">Punch Out</th>
                <th className="p-3">Punch Out Location</th>
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
                  <td className="p-3 text-center text-xs">
                    {r.punchInLatitude && r.punchInLongitude
                      ? `${r.punchInLatitude.toFixed(6)}, ${r.punchInLongitude.toFixed(6)}`
                      : '-'}
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
                  <td className="p-3 text-center text-xs">
                    {r.punchOutLatitude && r.punchOutLongitude
                      ? `${r.punchOutLatitude.toFixed(6)}, ${r.punchOutLongitude.toFixed(6)}`
                      : '-'}
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
