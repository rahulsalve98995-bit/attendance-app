'use client';

import { useEffect, useState } from 'react';
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

  const fetchReports = async () => {
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
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleFilter = () => {
    fetchReports();
  };

  const totalHours = reports.reduce((sum, report) => sum + (report.totalWorkingHours || 0), 0);

  return (
    <main className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Attendance Reports</h1>
        <button
          onClick={() => router.push('/admin')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Back to Admin
        </button>
      </div>

      <div className="mb-6 flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-2 border rounded"
          />
        </div>
        <button
          onClick={handleFilter}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Filter'}
        </button>
      </div>

      <div className="mb-4">
        <p className="text-lg font-semibold">Total Working Hours: {totalHours.toFixed(2)} hours</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">Employee</th>
              <th className="border border-gray-300 p-2">Date</th>
              <th className="border border-gray-300 p-2">Punch In</th>
              <th className="border border-gray-300 p-2">Break Start</th>
              <th className="border border-gray-300 p-2">Break End</th>
              <th className="border border-gray-300 p-2">Punch Out</th>
              <th className="border border-gray-300 p-2">Working Hours</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td className="border border-gray-300 p-2">
                  <div>
                    <div className="font-medium">{report.userName}</div>
                    <div className="text-sm text-gray-500">{report.userEmail}</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2">{report.date}</td>
                <td className="border border-gray-300 p-2">
                  {report.punchIn ? new Date(report.punchIn).toLocaleTimeString() : '-'}
                </td>
                <td className="border border-gray-300 p-2">
                  {report.breakStart ? new Date(report.breakStart).toLocaleTimeString() : '-'}
                </td>
                <td className="border border-gray-300 p-2">
                  {report.breakEnd ? new Date(report.breakEnd).toLocaleTimeString() : '-'}
                </td>
                <td className="border border-gray-300 p-2">
                  {report.punchOut ? new Date(report.punchOut).toLocaleTimeString() : '-'}
                </td>
                <td className="border border-gray-300 p-2">
                  {report.totalWorkingHours ? `${report.totalWorkingHours.toFixed(2)}h` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reports.length === 0 && !loading && (
        <p className="text-center text-gray-500 mt-8">No attendance records found.</p>
      )}
    </main>
  );
}