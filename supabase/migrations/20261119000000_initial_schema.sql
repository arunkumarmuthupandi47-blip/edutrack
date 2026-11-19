-- Supabase / PostgreSQL Initial Schema Migration for Academic Focus (EduTrack)
-- Matches Drizzle ORM schema in src/db/schema.ts with Foreign Key Indexes and RLS

BEGIN;

CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Elena Vance',
  major TEXT NOT NULL DEFAULT 'Computer Science & Cognitive Systems',
  term TEXT NOT NULL DEFAULT 'Fall 2026',
  target_gpa REAL NOT NULL DEFAULT 3.85,
  daily_focus_goal_minutes INTEGER NOT NULL DEFAULT 180,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.courses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  instructor TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 3,
  semester TEXT NOT NULL DEFAULT 'Fall 2026',
  color TEXT NOT NULL DEFAULT '#4F46E5',
  grade_percent REAL NOT NULL DEFAULT 92,
  attended_classes INTEGER NOT NULL DEFAULT 20,
  total_classes INTEGER NOT NULL DEFAULT 22,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assignments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date TEXT NOT NULL,
  due_time TEXT NOT NULL DEFAULT '23:59',
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  weight_percent REAL NOT NULL DEFAULT 15,
  score_percent REAL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.timetable_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  location TEXT NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'Lecture'
);

CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES public.courses(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.academic_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES public.courses(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_date TEXT NOT NULL,
  details TEXT NOT NULL
);

-- Indexes for foreign keys and frequent lookup columns
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON public.courses(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON public.assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_timetable_sessions_user_id ON public.timetable_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_timetable_sessions_course_id ON public.timetable_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON public.focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_course_id ON public.focus_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_academic_requests_user_id ON public.academic_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_academic_requests_course_id ON public.academic_requests(course_id);

-- Enable Row Level Security (RLS) on all public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public.users
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated
  USING (uid = (select auth.uid())::text);

DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (uid = (select auth.uid())::text);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (uid = (select auth.uid())::text)
  WITH CHECK (uid = (select auth.uid())::text);

DROP POLICY IF EXISTS "users_delete_own" ON public.users;
CREATE POLICY "users_delete_own" ON public.users
  FOR DELETE TO authenticated
  USING (uid = (select auth.uid())::text);

-- RLS Policies for public.courses
DROP POLICY IF EXISTS "courses_select_own" ON public.courses;
CREATE POLICY "courses_select_own" ON public.courses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.courses.user_id AND u.uid = (select auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "courses_insert_own" ON public.courses;
CREATE POLICY "courses_insert_own" ON public.courses
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.courses.user_id AND u.uid = (select auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "courses_update_own" ON public.courses;
CREATE POLICY "courses_update_own" ON public.courses
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.courses.user_id AND u.uid = (select auth.uid())::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.courses.user_id AND u.uid = (select auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "courses_delete_own" ON public.courses;
CREATE POLICY "courses_delete_own" ON public.courses
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.courses.user_id AND u.uid = (select auth.uid())::text
    )
  );

-- RLS Policies for public.assignments
DROP POLICY IF EXISTS "assignments_select_own" ON public.assignments;
CREATE POLICY "assignments_select_own" ON public.assignments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.assignments.user_id AND u.uid = (select auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "assignments_insert_own" ON public.assignments;
CREATE POLICY "assignments_insert_own" ON public.assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.assignments.user_id AND u.uid = (select auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "assignments_update_own" ON public.assignments;
CREATE POLICY "assignments_update_own" ON public.assignments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.assignments.user_id AND u.uid = (select auth.uid())::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.assignments.user_id AND u.uid = (select auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "assignments_delete_own" ON public.assignments;
CREATE POLICY "assignments_delete_own" ON public.assignments
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.assignments.user_id AND u.uid = (select auth.uid())::text
    )
  );

-- RLS Policies for public.timetable_sessions
DROP POLICY IF EXISTS "timetable_sessions_select_own" ON public.timetable_sessions;
CREATE POLICY "timetable_sessions_select_own" ON public.timetable_sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.timetable_sessions.user_id AND u.uid = (select auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "timetable_sessions_insert_own" ON public.timetable_sessions;
CREATE POLICY "timetable_sessions_insert_own" ON public.timetable_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.timetable_sessions.user_id AND u.uid = (select auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "timetable_sessions_update_own" ON public.timetable_sessions;
CREATE POLICY "timetable_sessions_update_own" ON public.timetable_sessions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.timetable_sessions.user_id AND u.uid = (select auth.uid())::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.timetable_sessions.user_id AND u.uid = (select auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "timetable_sessions_delete_own" ON public.timetable_sessions;
CREATE POLICY "timetable_sessions_delete_own" ON public.timetable_sessions
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.timetable_sessions.user_id AND u.uid = (select auth.uid())::text
    )
  );

-- RLS Policies for public.focus_sessions
DROP POLICY IF EXISTS "focus_sessions_select_own" ON public.focus_sessions;
CREATE POLICY "focus_sessions_select_own" ON public.focus_sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.focus_sessions.user_id AND u.uid = (select auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "focus_sessions_insert_own" ON public.focus_sessions;
CREATE POLICY "focus_sessions_insert_own" ON public.focus_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.focus_sessions.user_id AND u.uid = (select auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "focus_sessions_update_own" ON public.focus_sessions;
CREATE POLICY "focus_sessions_update_own" ON public.focus_sessions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.focus_sessions.user_id AND u.uid = (select auth.uid())::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.focus_sessions.user_id AND u.uid = (select auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "focus_sessions_delete_own" ON public.focus_sessions;
CREATE POLICY "focus_sessions_delete_own" ON public.focus_sessions
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.focus_sessions.user_id AND u.uid = (select auth.uid())::text
    )
  );

-- RLS Policies for public.academic_requests
DROP POLICY IF EXISTS "academic_requests_select_own" ON public.academic_requests;
CREATE POLICY "academic_requests_select_own" ON public.academic_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.academic_requests.user_id AND u.uid = (select auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "academic_requests_insert_own" ON public.academic_requests;
CREATE POLICY "academic_requests_insert_own" ON public.academic_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.academic_requests.user_id AND u.uid = (select auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "academic_requests_update_own" ON public.academic_requests;
CREATE POLICY "academic_requests_update_own" ON public.academic_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.academic_requests.user_id AND u.uid = (select auth.uid())::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.academic_requests.user_id AND u.uid = (select auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "academic_requests_delete_own" ON public.academic_requests;
CREATE POLICY "academic_requests_delete_own" ON public.academic_requests
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.academic_requests.user_id AND u.uid = (select auth.uid())::text
    )
  );

COMMIT;
