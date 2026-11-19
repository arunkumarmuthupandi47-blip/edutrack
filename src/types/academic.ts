export type NavTab =
  | 'overview'
  | 'courses'
  | 'assignments'
  | 'timetable'
  | 'grades'
  | 'focus'
  | 'attendance'
  | 'settings';

export type AssignmentStatus = 'pending' | 'submitted';
export type AssignmentPriority = 'low' | 'medium' | 'high';
export type AssignmentUrgency = 'submitted' | 'overdue' | 'due-soon' | 'pending';
export type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
export type SessionType = 'Lecture' | 'Lab' | 'Seminar' | 'Tutorial';
export type RequestStatus = 'pending' | 'approved' | 'needs-review';
export type RequestType = 'Extension Request' | 'Lab Swap' | 'Grade Review' | 'Attendance Excuse';

export interface UserProfile {
  id?: number;
  uid?: string;
  email: string;
  name: string;
  major: string;
  term: string;
  targetGpa: number;
  dailyFocusGoalMinutes: number;
}

export interface Course {
  id: number;
  code: string;
  title: string;
  instructor: string;
  credits: number;
  semester: string;
  color: string;
  gradePercent: number;
  attendedClasses: number;
  totalClasses: number;
}

export interface Assignment {
  id: number;
  courseId: number;
  title: string;
  dueDate: string;
  dueTime: string;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  weightPercent: number;
  scorePercent: number | null;
  notes: string;
}

export interface TimetableSession {
  id: number;
  courseId: number;
  dayOfWeek: Weekday;
  startTime: string;
  endTime: string;
  location: string;
  sessionType: SessionType;
}

export interface FocusSession {
  id: number;
  courseId: number | null;
  label: string;
  durationMinutes: number;
  completedAt: string;
}

export interface AcademicRequest {
  id: number;
  courseId: number | null;
  requestType: RequestType;
  subject: string;
  status: RequestStatus;
  submittedDate: string;
  details: string;
}

export interface WorkspaceData {
  profile: UserProfile;
  courses: Course[];
  assignments: Assignment[];
  timetableSessions: TimetableSession[];
  focusSessions: FocusSession[];
  academicRequests: AcademicRequest[];
}
