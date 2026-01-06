'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Attendance, Roster, User } from '@/types';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Notification from '@/components/Notification';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface RosterChartProps {
  roster: Roster[];
}

function RosterChart({ roster }: RosterChartProps) {
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

  const getShiftForDate = (date: string) => {
    const entry = roster.find(r => r.date === date);
    return entry ? `${entry.shift} (${entry.startTime} - ${entry.endTime})` : 'Week Off';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-gray-50 dark:bg-gray-600 rounded">
        <thead>
          <tr className="bg-slate-100 dark:bg-gray-500 text-gray-600 dark:text-gray-300">
            {weekDates.map(({ date, day, display }) => (
              <th key={date} className="p-3 text-center">
                <div className="text-sm font-medium">{day}</div>
                <div className="text-xs">{display}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {weekDates.map(({ date }) => (
              <td key={date} className="p-3 text-center text-sm">
                {getShiftForDate(date)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function EmployeePage() {
    const [attendance, setAttendance] = useState<Attendance | null>(null);
    const [roster, setRoster] = useState<Roster[]>([]);
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 📍 Live location state (MANDATORY)
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [locationError, setLocationError] = useState('');

  const router = useRouter();

  /* 🔐 Logout */
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  /* 📥 Fetch attendance */
  const fetchAttendance = useCallback(async () => {
  const res = await fetch('/api/attendance', {
    credentials: 'include', // 🔥 REQUIRED
  });

  if (res.ok) {
    const data = await res.json();
    setAttendance(data.attendance);
  } else {
    router.push('/login');
  }
}, [router]);

  /* 👤 Fetch user profile */
  const fetchUserProfile = useCallback(async () => {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      setUserProfile(data.user);
    }
  }, []);

  /*  Fetch roster */
  const fetchRoster = useCallback(async () => {
    const res = await fetch('/api/roster');
    if (res.ok) {
      const data = await res.json();
      setRoster(data.roster);
    }
  }, []);


  useEffect(() => {
    fetchAttendance();
    fetchUserProfile();
    fetchRoster();
    getLiveLocation(); // 👈 page load hote hi location lena

    // Check if profile was updated
    if (sessionStorage.getItem('profileUpdated') === 'true') {
      sessionStorage.removeItem('profileUpdated');
      fetchUserProfile(); // Refetch to get updated data
    }

    // Refetch user profile when page becomes visible (e.g., returning from profile page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUserProfile();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchAttendance, fetchUserProfile, fetchRoster]);

  /* 📍 STEP 1: Browser se live location lena */
  const getLiveLocation = () => {
    // ❌ Agar browser support nahi karta
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // ✅ Location mil gayi
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationError('');
      },
      (error) => {
        // ❌ User ne deny kar diya
        setLocation(null);
        setLocationError('Location permission is required to punch in/out');
        console.error(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  /* 🟢 Punch / Break / Punch Out (Location mandatory) */
  const handleAction = async (action: string) => {
  if (!location) {
    setNotification({ message: '❌ Please allow location to continue', type: 'error' });
    getLiveLocation();
    return;
  }

    const res = await fetch('/api/attendance', {
    method: 'POST',
    credentials: 'include', // 🔥 VERY IMPORTANT (cookie/session)
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      location,
    }),
  });

    const data = await res.json();
    setNotification({ message: res.ok ? data.message : data.error, type: res.ok ? 'success' : 'error' });
    fetchAttendance();

    // Auto close after 5 seconds
    setTimeout(() => setNotification(null), 5000);
  };

  /* 📊 Status */
  const status = !attendance?.punchIn
    ? 'Not Punched In'
    : attendance.punchOut
    ? 'Punched Out'
    : 'Working';

  // Prepare locations for map
  const locations = [];
  if (attendance?.punchInLatitude && attendance?.punchInLongitude && attendance?.punchIn) {
    locations.push({
      lat: attendance.punchInLatitude,
      lng: attendance.punchInLongitude,
      label: `Punch In - ${new Date(attendance.punchIn).toLocaleString()}`,
      type: 'punchIn' as const,
    });
  }
  if (attendance?.punchOutLatitude && attendance?.punchOutLongitude && attendance?.punchOut) {
    locations.push({
      lat: attendance.punchOutLatitude,
      lng: attendance.punchOutLongitude,
      label: `Punch Out - ${new Date(attendance.punchOut).toLocaleString()}`,
      type: 'punchOut' as const,
    });
  }
  // Add current live location if available
  if (location) {
    locations.push({
      lat: location.latitude,
      lng: location.longitude,
      label: `Current Location - Live`,
      type: 'punchIn' as const, // Use green for current
    });
  }

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-gray-700 rounded-2xl shadow-xl p-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            {userProfile?.avatar ? (
              <Image
                src={userProfile.avatar}
                alt="Profile"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-300"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">Employee Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {userProfile?.name || 'User'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <motion.button
              onClick={() => router.push('/profile')}
              className="text-sm bg-blue-500 text-white px-3 py-1.5 rounded shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Profile
            </motion.button>
            <motion.button
              onClick={handleLogout}
              className="text-sm bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Logout
            </motion.button>
          </div>
        </div>

        {/* Status */}
        <div className="text-center mb-4">
          <span className="inline-block px-4 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
            {status}
          </span>
        </div>

        {/* 📍 Location Status */}
        <div className="text-center mb-4 text-sm">
          {location ? (
            <p className="text-green-600">
              📍 Location Captured
            </p>
          ) : (
            <p className="text-red-600">
              {locationError || 'Location required'}
            </p>
          )}
        </div>

        {/* Attendance Info */}
        <div className="space-y-2 text-sm text-gray-700 mb-6">
          {attendance?.punchIn && (
            <p>🟢 Punch In: {new Date(attendance.punchIn).toLocaleTimeString()}</p>
          )}
          {attendance?.punchInLatitude && attendance?.punchInLongitude && (
            <p>📍 Punch In Location: {attendance.punchInLatitude.toFixed(6)}, {attendance.punchInLongitude.toFixed(6)}</p>
          )}
          {attendance?.punchOut && (
            <p>🔴 Punch Out: {new Date(attendance.punchOut).toLocaleTimeString()}</p>
          )}
          {attendance?.punchOutLatitude && attendance?.punchOutLongitude && (
            <p>📍 Punch Out Location: {attendance.punchOutLatitude.toFixed(6)}, {attendance.punchOutLongitude.toFixed(6)}</p>
          )}
          {attendance && attendance.totalWorkingHours !== null && (
            <p className="font-semibold">
              Total Working Hours: {attendance.totalWorkingHours.toFixed(2)} hrs
            </p>
          )}
        </div>

        {/* 📅 My Roster */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">My Weekly Roster</h3>
          <RosterChart roster={roster} />
        </div>

        {/* ️ Location Map */}
        {locations.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Today's Locations</h3>
            <Map
              locations={locations}
              center={location ? [location.latitude, location.longitude] : undefined}
              height="300px"
            />
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3">
          {!attendance?.punchIn && (
            <motion.button
              onClick={() => handleAction('punch')}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Punch In
            </motion.button>
          )}

          {attendance?.punchIn && !attendance?.punchOut && (
            <motion.button
              onClick={() => handleAction('punch')}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-lg font-semibold shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Punch Out
            </motion.button>
          )}
        </div>
      </div>

      <Notification
        message={notification?.message || ''}
        type={notification?.type || 'info'}
        onClose={() => setNotification(null)}
      />
    </main>
  );
}
