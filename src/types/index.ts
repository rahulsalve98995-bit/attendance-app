export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  password: string; // hashed
}

export interface Attendance {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  punchIn: string | null; // ISO timestamp
  punchOut: string | null; // ISO timestamp
  breakStart: string | null; // ISO timestamp
  breakEnd: string | null; // ISO timestamp
  totalWorkingHours: number | null; // in hours

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
