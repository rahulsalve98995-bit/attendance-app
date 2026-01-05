export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  password: string; // hashed
  phone?: string;
  address?: string;
  department?: string;
  position?: string;
  avatar?: string; // URL to profile picture
}

export interface Attendance {
  id: string;
  userId: string;
  date: string;

  punchIn: string | null;
  punchOut: string | null;

  breakStart: string | null;
  breakEnd: string | null;

  totalWorkingHours: number | null;

  // 📍 NEW: Location fields
  punchInLatitude: number | null;
  punchInLongitude: number | null;

  punchOutLatitude: number | null;
  punchOutLongitude: number | null;
}


export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role: 'admin' | 'employee';
  password: string;
}

export type ShiftType = 'Night Shift' | 'General Shift' | 'Second Shift' | 'First Shift';

export interface Shift {
  type: ShiftType;
  startTime: string; // e.g., "22:00"
  endTime: string;   // e.g., "06:00"
}

export interface Roster {
  id: string;
  employeeId: string;
  date: string;
  shift: ShiftType;
  startTime?: string;
  endTime?: string;
}

export type LeaveType = 'sick' | 'vacation' | 'personal' | 'maternity' | 'paternity' | 'other';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  comments?: string;
}
