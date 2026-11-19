import type { AssignmentUrgency } from '../types/academic';

export function percentToGradePoint(percent: number): number {
  const clamped = Math.max(0, Math.min(100, percent));
  if (clamped >= 93) return 4.0;
  if (clamped >= 90) return 3.7;
  if (clamped >= 87) return 3.3;
  if (clamped >= 83) return 3.0;
  if (clamped >= 80) return 2.7;
  if (clamped >= 77) return 2.3;
  if (clamped >= 73) return 2.0;
  if (clamped >= 70) return 1.7;
  if (clamped >= 67) return 1.3;
  if (clamped >= 60) return 1.0;
  return 0.0;
}

export function percentToLetterGrade(percent: number): string {
  const clamped = Math.max(0, Math.min(100, percent));
  if (clamped >= 93) return 'A';
  if (clamped >= 90) return 'A-';
  if (clamped >= 87) return 'B+';
  if (clamped >= 83) return 'B';
  if (clamped >= 80) return 'B-';
  if (clamped >= 77) return 'C+';
  if (clamped >= 73) return 'C';
  if (clamped >= 70) return 'C-';
  if (clamped >= 67) return 'D+';
  if (clamped >= 60) return 'D';
  return 'F';
}

export function calculateWeightedGpa(
  courses: Array<{ credits: number; gradePercent: number }>
): number {
  const validCourses = courses.filter((c) => c.credits > 0);
  if (validCourses.length === 0) return 0;

  let totalQualityPoints = 0;
  let totalCredits = 0;

  for (const course of validCourses) {
    totalQualityPoints += percentToGradePoint(course.gradePercent) * course.credits;
    totalCredits += course.credits;
  }

  if (totalCredits === 0) return 0;
  return Math.round((totalQualityPoints / totalCredits) * 100) / 100;
}

export function calculateAttendanceRate(
  attendedClasses: number,
  totalClasses: number
): { percentage: number; status: 'on-track' | 'warning' | 'critical' } {
  if (totalClasses <= 0) {
    return { percentage: 100, status: 'on-track' };
  }
  const safeAttended = Math.max(0, Math.min(attendedClasses, totalClasses));
  const percentage = Math.round((safeAttended / totalClasses) * 100);
  if (percentage >= 85) return { percentage, status: 'on-track' };
  if (percentage >= 75) return { percentage, status: 'warning' };
  return { percentage, status: 'critical' };
}

export function classifyAssignmentUrgency(
  assignment: { status: string; dueDate: string },
  referenceDateStr: string
): AssignmentUrgency {
  if (assignment.status === 'submitted') {
    return 'submitted';
  }

  const dueMs = Date.parse(`${assignment.dueDate}T00:00:00Z`);
  const refMs = Date.parse(`${referenceDateStr}T00:00:00Z`);
  if (Number.isNaN(dueMs) || Number.isNaN(refMs)) {
    return 'pending';
  }

  const diffDays = Math.round((dueMs - refMs) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 1) return 'due-soon';
  return 'pending';
}

export function formatFocusDuration(totalMinutes: number): string {
  const safeMinutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatClockTime(secondsLeft: number): string {
  const safe = Math.max(0, Math.floor(secondsLeft));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function validateCourseInput(input: {
  code: string;
  title: string;
  instructor: string;
  credits: number;
  gradePercent: number;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!input.code.trim()) errors.code = 'Course code is required.';
  if (!input.title.trim()) errors.title = 'Course title is required.';
  if (!input.instructor.trim()) errors.instructor = 'Instructor name is required.';
  if (!Number.isFinite(input.credits) || input.credits < 1 || input.credits > 6) {
    errors.credits = 'Credits must be between 1 and 6.';
  }
  if (!Number.isFinite(input.gradePercent) || input.gradePercent < 0 || input.gradePercent > 100) {
    errors.gradePercent = 'Grade must be between 0 and 100.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateAssignmentInput(input: {
  title: string;
  courseId: number | null;
  dueDate: string;
  weightPercent: number;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!input.title.trim()) errors.title = 'Assignment title is required.';
  if (!input.courseId) errors.courseId = 'Please select a course.';
  if (!input.dueDate.trim()) errors.dueDate = 'Due date is required.';
  if (!Number.isFinite(input.weightPercent) || input.weightPercent < 0 || input.weightPercent > 100) {
    errors.weightPercent = 'Weight must be between 0% and 100%.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateTimetableInput(input: {
  courseId: number | null;
  startTime: string;
  endTime: string;
  location: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!input.courseId) errors.courseId = 'Please select a course.';
  if (!input.startTime.trim()) errors.startTime = 'Start time is required.';
  if (!input.endTime.trim()) errors.endTime = 'End time is required.';
  if (input.startTime && input.endTime && input.endTime <= input.startTime) {
    errors.endTime = 'End time must be after start time.';
  }
  if (!input.location.trim()) errors.location = 'Room or location is required.';
  return { valid: Object.keys(errors).length === 0, errors };
}
