import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  academicRequests,
  assignments,
  courses,
  focusSessions,
  timetableSessions,
  users,
} from './schema.ts';
import { createInitialWorkspaceData } from '../data/seedData.ts';
import type {
  AcademicRequest,
  Assignment,
  Course,
  FocusSession,
  TimetableSession,
  UserProfile,
  WorkspaceData,
} from '../types/academic.ts';

export async function getOrCreateUser(uid: string, email: string, name?: string) {
  try {
    const cleanName = name && name.trim().length > 0 ? name.trim() : email.split('@')[0] || 'Student';
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        name: cleanName,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Unable to synchronize user profile.', { cause: error });
  }
}

async function seedStarterDataForUser(userId: number, email: string, name: string) {
  const existingCourses = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.userId, userId))
    .limit(1);

  if (existingCourses.length > 0) {
    return;
  }

  const starter = createInitialWorkspaceData({ email, name });
  const courseIdMap = new Map<number, number>();

  for (const c of starter.courses) {
    const [inserted] = await db
      .insert(courses)
      .values({
        userId,
        code: c.code,
        title: c.title,
        instructor: c.instructor,
        credits: c.credits,
        semester: c.semester,
        color: c.color,
        gradePercent: c.gradePercent,
        attendedClasses: c.attendedClasses,
        totalClasses: c.totalClasses,
      })
      .returning();
    courseIdMap.set(c.id, inserted.id);
  }

  for (const a of starter.assignments) {
    const mappedCourseId = courseIdMap.get(a.courseId);
    if (!mappedCourseId) continue;
    await db.insert(assignments).values({
      userId,
      courseId: mappedCourseId,
      title: a.title,
      dueDate: a.dueDate,
      dueTime: a.dueTime,
      status: a.status,
      priority: a.priority,
      weightPercent: a.weightPercent,
      scorePercent: a.scorePercent,
      notes: a.notes,
    });
  }

  for (const t of starter.timetableSessions) {
    const mappedCourseId = courseIdMap.get(t.courseId);
    if (!mappedCourseId) continue;
    await db.insert(timetableSessions).values({
      userId,
      courseId: mappedCourseId,
      dayOfWeek: t.dayOfWeek,
      startTime: t.startTime,
      endTime: t.endTime,
      location: t.location,
      sessionType: t.sessionType,
    });
  }

  for (const f of starter.focusSessions) {
    const mappedCourseId = f.courseId ? courseIdMap.get(f.courseId) ?? null : null;
    await db.insert(focusSessions).values({
      userId,
      courseId: mappedCourseId,
      label: f.label,
      durationMinutes: f.durationMinutes,
      completedAt: f.completedAt,
    });
  }

  for (const r of starter.academicRequests) {
    const mappedCourseId = r.courseId ? courseIdMap.get(r.courseId) ?? null : null;
    await db.insert(academicRequests).values({
      userId,
      courseId: mappedCourseId,
      requestType: r.requestType,
      subject: r.subject,
      status: r.status,
      submittedDate: r.submittedDate,
      details: r.details,
    });
  }
}

export async function getWorkspaceData(
  uid: string,
  email: string,
  name?: string
): Promise<WorkspaceData> {
  try {
    const userRow = await getOrCreateUser(uid, email, name);
    await seedStarterDataForUser(userRow.id, userRow.email, userRow.name);

    const [courseRows, assignmentRows, timetableRows, focusRows, requestRows] = await Promise.all([
      db.select().from(courses).where(eq(courses.userId, userRow.id)).orderBy(asc(courses.id)),
      db.select().from(assignments).where(eq(assignments.userId, userRow.id)).orderBy(asc(assignments.dueDate)),
      db.select().from(timetableSessions).where(eq(timetableSessions.userId, userRow.id)).orderBy(asc(timetableSessions.startTime)),
      db.select().from(focusSessions).where(eq(focusSessions.userId, userRow.id)).orderBy(desc(focusSessions.id)),
      db.select().from(academicRequests).where(eq(academicRequests.userId, userRow.id)).orderBy(desc(academicRequests.id)),
    ]);

    return {
      profile: {
        id: userRow.id,
        uid: userRow.uid,
        email: userRow.email,
        name: userRow.name,
        major: userRow.major,
        term: userRow.term,
        targetGpa: userRow.targetGpa,
        dailyFocusGoalMinutes: userRow.dailyFocusGoalMinutes,
      },
      courses: courseRows.map((c) => ({
        id: c.id,
        code: c.code,
        title: c.title,
        instructor: c.instructor,
        credits: c.credits,
        semester: c.semester,
        color: c.color,
        gradePercent: c.gradePercent,
        attendedClasses: c.attendedClasses,
        totalClasses: c.totalClasses,
      })),
      assignments: assignmentRows.map((a) => ({
        id: a.id,
        courseId: a.courseId,
        title: a.title,
        dueDate: a.dueDate,
        dueTime: a.dueTime,
        status: a.status as Assignment['status'],
        priority: a.priority as Assignment['priority'],
        weightPercent: a.weightPercent,
        scorePercent: a.scorePercent,
        notes: a.notes,
      })),
      timetableSessions: timetableRows.map((t) => ({
        id: t.id,
        courseId: t.courseId,
        dayOfWeek: t.dayOfWeek as TimetableSession['dayOfWeek'],
        startTime: t.startTime,
        endTime: t.endTime,
        location: t.location,
        sessionType: t.sessionType as TimetableSession['sessionType'],
      })),
      focusSessions: focusRows.map((f) => ({
        id: f.id,
        courseId: f.courseId,
        label: f.label,
        durationMinutes: f.durationMinutes,
        completedAt: f.completedAt,
      })),
      academicRequests: requestRows.map((r) => ({
        id: r.id,
        courseId: r.courseId,
        requestType: r.requestType as AcademicRequest['requestType'],
        subject: r.subject,
        status: r.status as AcademicRequest['status'],
        submittedDate: r.submittedDate,
        details: r.details,
      })),
      customerResponses: createInitialWorkspaceData({
        email: userRow.email,
        name: userRow.name,
      }).customerResponses,
      knowledgeDocuments: createInitialWorkspaceData({
        email: userRow.email,
        name: userRow.name,
      }).knowledgeDocuments,
    };
  } catch (error) {
    console.error('Database query failed in getWorkspaceData:', error);
    throw new Error('Failed to load workspace data from database.', { cause: error });
  }
}

export async function updateUserProfile(
  userId: number,
  patch: Partial<Pick<UserProfile, 'name' | 'major' | 'term' | 'targetGpa' | 'dailyFocusGoalMinutes'>>
) {
  try {
    const [updated] = await db
      .update(users)
      .set({
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.major !== undefined ? { major: patch.major } : {}),
        ...(patch.term !== undefined ? { term: patch.term } : {}),
        ...(patch.targetGpa !== undefined ? { targetGpa: patch.targetGpa } : {}),
        ...(patch.dailyFocusGoalMinutes !== undefined
          ? { dailyFocusGoalMinutes: patch.dailyFocusGoalMinutes }
          : {}),
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  } catch (error) {
    console.error('Database query failed in updateUserProfile:', error);
    throw new Error('Failed to update user profile.', { cause: error });
  }
}

export async function createCourse(userId: number, data: Omit<Course, 'id'>): Promise<Course> {
  try {
    const [inserted] = await db
      .insert(courses)
      .values({
        userId,
        code: data.code,
        title: data.title,
        instructor: data.instructor,
        credits: data.credits,
        semester: data.semester,
        color: data.color,
        gradePercent: data.gradePercent,
        attendedClasses: data.attendedClasses,
        totalClasses: data.totalClasses,
      })
      .returning();
    return {
      id: inserted.id,
      code: inserted.code,
      title: inserted.title,
      instructor: inserted.instructor,
      credits: inserted.credits,
      semester: inserted.semester,
      color: inserted.color,
      gradePercent: inserted.gradePercent,
      attendedClasses: inserted.attendedClasses,
      totalClasses: inserted.totalClasses,
    };
  } catch (error) {
    console.error('Database query failed in createCourse:', error);
    throw new Error('Failed to create course.', { cause: error });
  }
}

export async function updateCourse(
  userId: number,
  courseId: number,
  patch: Partial<Omit<Course, 'id'>>
): Promise<Course | null> {
  try {
    const [updated] = await db
      .update(courses)
      .set(patch)
      .where(and(eq(courses.id, courseId), eq(courses.userId, userId)))
      .returning();
    if (!updated) return null;
    return {
      id: updated.id,
      code: updated.code,
      title: updated.title,
      instructor: updated.instructor,
      credits: updated.credits,
      semester: updated.semester,
      color: updated.color,
      gradePercent: updated.gradePercent,
      attendedClasses: updated.attendedClasses,
      totalClasses: updated.totalClasses,
    };
  } catch (error) {
    console.error('Database query failed in updateCourse:', error);
    throw new Error('Failed to update course.', { cause: error });
  }
}

export async function deleteCourse(userId: number, courseId: number): Promise<boolean> {
  try {
    const deleted = await db
      .delete(courses)
      .where(and(eq(courses.id, courseId), eq(courses.userId, userId)))
      .returning({ id: courses.id });
    return deleted.length > 0;
  } catch (error) {
    console.error('Database query failed in deleteCourse:', error);
    throw new Error('Failed to delete course.', { cause: error });
  }
}

export async function createAssignment(
  userId: number,
  data: Omit<Assignment, 'id'>
): Promise<Assignment> {
  try {
    const [inserted] = await db
      .insert(assignments)
      .values({
        userId,
        courseId: data.courseId,
        title: data.title,
        dueDate: data.dueDate,
        dueTime: data.dueTime,
        status: data.status,
        priority: data.priority,
        weightPercent: data.weightPercent,
        scorePercent: data.scorePercent,
        notes: data.notes,
      })
      .returning();
    return {
      id: inserted.id,
      courseId: inserted.courseId,
      title: inserted.title,
      dueDate: inserted.dueDate,
      dueTime: inserted.dueTime,
      status: inserted.status as Assignment['status'],
      priority: inserted.priority as Assignment['priority'],
      weightPercent: inserted.weightPercent,
      scorePercent: inserted.scorePercent,
      notes: inserted.notes,
    };
  } catch (error) {
    console.error('Database query failed in createAssignment:', error);
    throw new Error('Failed to create assignment.', { cause: error });
  }
}

export async function updateAssignment(
  userId: number,
  assignmentId: number,
  patch: Partial<Omit<Assignment, 'id'>>
): Promise<Assignment | null> {
  try {
    const [updated] = await db
      .update(assignments)
      .set(patch)
      .where(and(eq(assignments.id, assignmentId), eq(assignments.userId, userId)))
      .returning();
    if (!updated) return null;
    return {
      id: updated.id,
      courseId: updated.courseId,
      title: updated.title,
      dueDate: updated.dueDate,
      dueTime: updated.dueTime,
      status: updated.status as Assignment['status'],
      priority: updated.priority as Assignment['priority'],
      weightPercent: updated.weightPercent,
      scorePercent: updated.scorePercent,
      notes: updated.notes,
    };
  } catch (error) {
    console.error('Database query failed in updateAssignment:', error);
    throw new Error('Failed to update assignment.', { cause: error });
  }
}

export async function deleteAssignment(userId: number, assignmentId: number): Promise<boolean> {
  try {
    const deleted = await db
      .delete(assignments)
      .where(and(eq(assignments.id, assignmentId), eq(assignments.userId, userId)))
      .returning({ id: assignments.id });
    return deleted.length > 0;
  } catch (error) {
    console.error('Database query failed in deleteAssignment:', error);
    throw new Error('Failed to delete assignment.', { cause: error });
  }
}

export async function createTimetableSession(
  userId: number,
  data: Omit<TimetableSession, 'id'>
): Promise<TimetableSession> {
  try {
    const [inserted] = await db
      .insert(timetableSessions)
      .values({
        userId,
        courseId: data.courseId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        sessionType: data.sessionType,
      })
      .returning();
    return {
      id: inserted.id,
      courseId: inserted.courseId,
      dayOfWeek: inserted.dayOfWeek as TimetableSession['dayOfWeek'],
      startTime: inserted.startTime,
      endTime: inserted.endTime,
      location: inserted.location,
      sessionType: inserted.sessionType as TimetableSession['sessionType'],
    };
  } catch (error) {
    console.error('Database query failed in createTimetableSession:', error);
    throw new Error('Failed to create timetable session.', { cause: error });
  }
}

export async function deleteTimetableSession(userId: number, sessionId: number): Promise<boolean> {
  try {
    const deleted = await db
      .delete(timetableSessions)
      .where(and(eq(timetableSessions.id, sessionId), eq(timetableSessions.userId, userId)))
      .returning({ id: timetableSessions.id });
    return deleted.length > 0;
  } catch (error) {
    console.error('Database query failed in deleteTimetableSession:', error);
    throw new Error('Failed to delete timetable session.', { cause: error });
  }
}

export async function createFocusSession(
  userId: number,
  data: Omit<FocusSession, 'id'>
): Promise<FocusSession> {
  try {
    const [inserted] = await db
      .insert(focusSessions)
      .values({
        userId,
        courseId: data.courseId,
        label: data.label,
        durationMinutes: data.durationMinutes,
        completedAt: data.completedAt,
      })
      .returning();
    return {
      id: inserted.id,
      courseId: inserted.courseId,
      label: inserted.label,
      durationMinutes: inserted.durationMinutes,
      completedAt: inserted.completedAt,
    };
  } catch (error) {
    console.error('Database query failed in createFocusSession:', error);
    throw new Error('Failed to record focus session.', { cause: error });
  }
}

export async function createAcademicRequest(
  userId: number,
  data: Omit<AcademicRequest, 'id'>
): Promise<AcademicRequest> {
  try {
    const [inserted] = await db
      .insert(academicRequests)
      .values({
        userId,
        courseId: data.courseId,
        requestType: data.requestType,
        subject: data.subject,
        status: data.status,
        submittedDate: data.submittedDate,
        details: data.details,
      })
      .returning();
    return {
      id: inserted.id,
      courseId: inserted.courseId,
      requestType: inserted.requestType as AcademicRequest['requestType'],
      subject: inserted.subject,
      status: inserted.status as AcademicRequest['status'],
      submittedDate: inserted.submittedDate,
      details: inserted.details,
    };
  } catch (error) {
    console.error('Database query failed in createAcademicRequest:', error);
    throw new Error('Failed to submit academic request.', { cause: error });
  }
}

export async function updateAcademicRequestStatus(
  userId: number,
  requestId: number,
  status: AcademicRequest['status']
): Promise<AcademicRequest | null> {
  try {
    const [updated] = await db
      .update(academicRequests)
      .set({ status })
      .where(and(eq(academicRequests.id, requestId), eq(academicRequests.userId, userId)))
      .returning();
    if (!updated) return null;
    return {
      id: updated.id,
      courseId: updated.courseId,
      requestType: updated.requestType as AcademicRequest['requestType'],
      subject: updated.subject,
      status: updated.status as AcademicRequest['status'],
      submittedDate: updated.submittedDate,
      details: updated.details,
    };
  } catch (error) {
    console.error('Database query failed in updateAcademicRequestStatus:', error);
    throw new Error('Failed to update academic request status.', { cause: error });
  }
}
