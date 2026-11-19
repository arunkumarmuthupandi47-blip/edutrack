import test from 'node:test';
import assert from 'node:assert/strict';
import {
  percentToGradePoint,
  percentToLetterGrade,
  calculateWeightedGpa,
  calculateAttendanceRate,
  classifyAssignmentUrgency,
  formatFocusDuration,
  formatClockTime,
  validateCourseInput,
  validateAssignmentInput,
  validateTimetableInput,
} from './academicMath';

test('percentToGradePoint and percentToLetterGrade map boundaries accurately', () => {
  assert.equal(percentToGradePoint(96), 4.0);
  assert.equal(percentToLetterGrade(96), 'A');
  assert.equal(percentToGradePoint(91), 3.7);
  assert.equal(percentToLetterGrade(91), 'A-');
  assert.equal(percentToGradePoint(84), 3.0);
  assert.equal(percentToLetterGrade(84), 'B');
  assert.equal(percentToGradePoint(55), 0.0);
  assert.equal(percentToLetterGrade(55), 'F');
});

test('calculateWeightedGpa weights quality points by credits', () => {
  const gpa = calculateWeightedGpa([
    { credits: 4, gradePercent: 95 }, // 4.0 * 4 = 16
    { credits: 3, gradePercent: 85 }, // 3.0 * 3 = 9
    { credits: 3, gradePercent: 91 }, // 3.7 * 3 = 11.1
  ]);
  // (16 + 9 + 11.1) / 10 = 3.61
  assert.equal(gpa, 3.61);
  assert.equal(calculateWeightedGpa([]), 0);
});

test('calculateAttendanceRate returns percentage and semantic status', () => {
  assert.deepEqual(calculateAttendanceRate(19, 20), { percentage: 95, status: 'on-track' });
  assert.deepEqual(calculateAttendanceRate(16, 20), { percentage: 80, status: 'warning' });
  assert.deepEqual(calculateAttendanceRate(12, 20), { percentage: 60, status: 'critical' });
});

test('classifyAssignmentUrgency separates submitted, overdue, due-soon, and pending', () => {
  const ref = '2026-11-18';
  assert.equal(classifyAssignmentUrgency({ status: 'submitted', dueDate: '2026-11-10' }, ref), 'submitted');
  assert.equal(classifyAssignmentUrgency({ status: 'pending', dueDate: '2026-11-16' }, ref), 'overdue');
  assert.equal(classifyAssignmentUrgency({ status: 'pending', dueDate: '2026-11-18' }, ref), 'due-soon');
  assert.equal(classifyAssignmentUrgency({ status: 'pending', dueDate: '2026-11-19' }, ref), 'due-soon');
  assert.equal(classifyAssignmentUrgency({ status: 'pending', dueDate: '2026-11-24' }, ref), 'pending');
});

test('formatFocusDuration and formatClockTime format cleanly', () => {
  assert.equal(formatFocusDuration(45), '45m');
  assert.equal(formatFocusDuration(120), '2h');
  assert.equal(formatFocusDuration(145), '2h 25m');
  assert.equal(formatClockTime(1500), '25:00');
  assert.equal(formatClockTime(65), '01:05');
});

test('form validators reject invalid inputs and accept valid records', () => {
  const badCourse = validateCourseInput({
    code: '',
    title: '',
    instructor: 'Dr. Lee',
    credits: 8,
    gradePercent: 105,
  });
  assert.equal(badCourse.valid, false);
  assert.ok(badCourse.errors.code);
  assert.ok(badCourse.errors.title);
  assert.ok(badCourse.errors.credits);

  const badAssignment = validateAssignmentInput({
    title: '  ',
    courseId: null,
    dueDate: '',
    weightPercent: 120,
  });
  assert.equal(badAssignment.valid, false);
  assert.ok(badAssignment.errors.title);
  assert.ok(badAssignment.errors.courseId);

  const badSlot = validateTimetableInput({
    courseId: 1,
    startTime: '14:00',
    endTime: '13:00',
    location: '',
  });
  assert.equal(badSlot.valid, false);
  assert.ok(badSlot.errors.endTime);
  assert.ok(badSlot.errors.location);
});
