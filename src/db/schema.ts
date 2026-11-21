import { relations } from 'drizzle-orm';
import { integer, pgTable, real, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name').notNull().default('Elena Vance'),
  major: text('major').notNull().default('Computer Science & Cognitive Systems'),
  term: text('term').notNull().default('Fall 2026'),
  targetGpa: real('target_gpa').notNull().default(3.85),
  dailyFocusGoalMinutes: integer('daily_focus_goal_minutes').notNull().default(180),
  createdAt: timestamp('created_at').defaultNow(),
});

export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  code: text('code').notNull(),
  title: text('title').notNull(),
  instructor: text('instructor').notNull(),
  credits: integer('credits').notNull().default(3),
  semester: text('semester').notNull().default('Fall 2026'),
  color: text('color').notNull().default('#4F46E5'),
  gradePercent: real('grade_percent').notNull().default(92),
  attendedClasses: integer('attended_classes').notNull().default(20),
  totalClasses: integer('total_classes').notNull().default(22),
  createdAt: timestamp('created_at').defaultNow(),
});

export const assignments = pgTable('assignments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  courseId: integer('course_id')
    .references(() => courses.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  dueDate: text('due_date').notNull(),
  dueTime: text('due_time').notNull().default('23:59'),
  status: text('status').notNull().default('pending'),
  priority: text('priority').notNull().default('medium'),
  weightPercent: real('weight_percent').notNull().default(15),
  scorePercent: real('score_percent'),
  notes: text('notes').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

export const timetableSessions = pgTable('timetable_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  courseId: integer('course_id')
    .references(() => courses.id, { onDelete: 'cascade' })
    .notNull(),
  dayOfWeek: text('day_of_week').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  location: text('location').notNull(),
  sessionType: text('session_type').notNull().default('Lecture'),
});

export const focusSessions = pgTable('focus_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'set null' }),
  label: text('label').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  completedAt: text('completed_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const academicRequests = pgTable('academic_requests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'set null' }),
  requestType: text('request_type').notNull(),
  subject: text('subject').notNull(),
  status: text('status').notNull().default('pending'),
  submittedDate: text('submitted_date').notNull(),
  details: text('details').notNull(),
});

export const customerResponses = pgTable('customer_responses', {
  id: serial('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().default('default-workspace'),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  category: text('category').notNull().default('General Inquiry'),
  priority: text('priority').notNull().default('medium'),
  status: text('status').notNull().default('open'),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  responseText: text('response_text').notNull().default(''),
  respondedBy: text('responded_by').notNull().default(''),
  respondedAt: text('responded_at'),
  rating: integer('rating'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const knowledgeDocuments = pgTable('knowledge_documents', {
  id: serial('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().default('default-workspace'),
  title: text('title').notNull(),
  category: text('category').notNull().default('Course Syllabus'),
  courseCode: text('course_code').notNull().default('GENERAL'),
  source: text('source').notNull().default('University Knowledge Base'),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  courses: many(courses),
  assignments: many(assignments),
  timetableSessions: many(timetableSessions),
  focusSessions: many(focusSessions),
  academicRequests: many(academicRequests),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  user: one(users, {
    fields: [courses.userId],
    references: [users.id],
  }),
  assignments: many(assignments),
  timetableSessions: many(timetableSessions),
  focusSessions: many(focusSessions),
  academicRequests: many(academicRequests),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  user: one(users, {
    fields: [assignments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [assignments.courseId],
    references: [courses.id],
  }),
}));

export const timetableSessionsRelations = relations(timetableSessions, ({ one }) => ({
  user: one(users, {
    fields: [timetableSessions.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [timetableSessions.courseId],
    references: [courses.id],
  }),
}));

export const focusSessionsRelations = relations(focusSessions, ({ one }) => ({
  user: one(users, {
    fields: [focusSessions.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [focusSessions.courseId],
    references: [courses.id],
  }),
}));

export const academicRequestsRelations = relations(academicRequests, ({ one }) => ({
  user: one(users, {
    fields: [academicRequests.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [academicRequests.courseId],
    references: [courses.id],
  }),
}));
