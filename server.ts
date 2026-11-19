import 'dotenv/config';
import express from 'express';
import path from 'path';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import { checkDatabaseConnection, isDatabaseConfigured } from './src/db/index.ts';
import { runMigrations } from './src/db/migrate.ts';
import {
  createAcademicRequest,
  createAssignment,
  createCourse,
  createFocusSession,
  createTimetableSession,
  deleteAssignment,
  deleteCourse,
  deleteTimetableSession,
  getOrCreateUser,
  getWorkspaceData,
  updateAcademicRequestStatus,
  updateAssignment,
  updateCourse,
  updateUserProfile,
} from './src/db/queries.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get('/api/health', async (_req, res) => {
  const database = await checkDatabaseConnection();
  res.json({ ok: true, database });
});

async function resolveUser(req: AuthRequest) {
  const uid = req.user?.uid;
  if (!uid) {
    throw new Error('Authenticated user UID missing.');
  }
  const email = req.user?.email ?? `${uid}@academic-focus.app`;
  const name = typeof req.user?.name === 'string' ? req.user.name : undefined;
  return getOrCreateUser(uid, email, name);
}

app.get('/api/workspace', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const email = req.user!.email ?? `${uid}@academic-focus.app`;
    const name = typeof req.user!.name === 'string' ? req.user!.name : undefined;
    const data = await getWorkspaceData(uid, email, name);
    res.json(data);
  } catch (error: any) {
    console.error('GET /api/workspace failed:', error);
    res.status(500).json({ error: error.message || 'Failed to load workspace data.' });
  }
});

app.patch('/api/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await resolveUser(req);
    const updated = await updateUserProfile(user.id, req.body);
    res.json(updated);
  } catch (error: any) {
    console.error('PATCH /api/profile failed:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile.' });
  }
});

app.post('/api/courses', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await resolveUser(req);
    const created = await createCourse(user.id, req.body);
    res.status(201).json(created);
  } catch (error: any) {
    console.error('POST /api/courses failed:', error);
    res.status(500).json({ error: error.message || 'Failed to create course.' });
  }
});

app.patch('/api/courses/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await resolveUser(req);
    const id = Number(req.params.id);
    const updated = await updateCourse(user.id, id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Course not found.' });
    }
    res.json(updated);
  } catch (error: any) {
    console.error('PATCH /api/courses/:id failed:', error);
    res.status(500).json({ error: error.message || 'Failed to update course.' });
  }
});

app.delete('/api/courses/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await resolveUser(req);
    const id = Number(req.params.id);
    const ok = await deleteCourse(user.id, id);
    if (!ok) {
      return res.status(404).json({ error: 'Course not found.' });
    }
    res.json({ deleted: true });
  } catch (error: any) {
    console.error('DELETE /api/courses/:id failed:', error);
    res.status(500).json({ error: error.message || 'Failed to delete course.' });
  }
});

app.post('/api/assignments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await resolveUser(req);
    const created = await createAssignment(user.id, req.body);
    res.status(201).json(created);
  } catch (error: any) {
    console.error('POST /api/assignments failed:', error);
    res.status(500).json({ error: error.message || 'Failed to create assignment.' });
  }
});

app.patch('/api/assignments/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await resolveUser(req);
    const id = Number(req.params.id);
    const updated = await updateAssignment(user.id, id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }
    res.json(updated);
  } catch (error: any) {
    console.error('PATCH /api/assignments/:id failed:', error);
    res.status(500).json({ error: error.message || 'Failed to update assignment.' });
  }
});

app.delete('/api/assignments/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await resolveUser(req);
    const id = Number(req.params.id);
    const ok = await deleteAssignment(user.id, id);
    if (!ok) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }
    res.json({ deleted: true });
  } catch (error: any) {
    console.error('DELETE /api/assignments/:id failed:', error);
    res.status(500).json({ error: error.message || 'Failed to delete assignment.' });
  }
});

app.post('/api/timetable', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await resolveUser(req);
    const created = await createTimetableSession(user.id, req.body);
    res.status(201).json(created);
  } catch (error: any) {
    console.error('POST /api/timetable failed:', error);
    res.status(500).json({ error: error.message || 'Failed to add timetable session.' });
  }
});

app.delete('/api/timetable/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await resolveUser(req);
    const id = Number(req.params.id);
    const ok = await deleteTimetableSession(user.id, id);
    if (!ok) {
      return res.status(404).json({ error: 'Timetable session not found.' });
    }
    res.json({ deleted: true });
  } catch (error: any) {
    console.error('DELETE /api/timetable/:id failed:', error);
    res.status(500).json({ error: error.message || 'Failed to delete timetable session.' });
  }
});

app.post('/api/focus-sessions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await resolveUser(req);
    const created = await createFocusSession(user.id, req.body);
    res.status(201).json(created);
  } catch (error: any) {
    console.error('POST /api/focus-sessions failed:', error);
    res.status(500).json({ error: error.message || 'Failed to log focus session.' });
  }
});

app.post('/api/requests', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await resolveUser(req);
    const created = await createAcademicRequest(user.id, req.body);
    res.status(201).json(created);
  } catch (error: any) {
    console.error('POST /api/requests failed:', error);
    res.status(500).json({ error: error.message || 'Failed to submit academic request.' });
  }
});

app.patch('/api/requests/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await resolveUser(req);
    const id = Number(req.params.id);
    const updated = await updateAcademicRequestStatus(user.id, id, req.body.status);
    if (!updated) {
      return res.status(404).json({ error: 'Request not found.' });
    }
    res.json(updated);
  } catch (error: any) {
    console.error('PATCH /api/requests/:id failed:', error);
    res.status(500).json({ error: error.message || 'Failed to update academic request.' });
  }
});

async function startServer() {
  if (isDatabaseConfigured() && process.env.AUTO_MIGRATE !== 'false') {
    try {
      const { applied } = await runMigrations();
      if (applied.length > 0) {
        console.log(`Applied Supabase migrations on startup: ${applied.join(', ')}`);
      } else {
        console.log('Supabase database connected and schema verified.');
      }
    } catch (err: any) {
      console.warn('Database startup migration skipped or failed:', err?.message || err);
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const listenOnPort = (portToTry: number) => {
    const server = app.listen(portToTry, '0.0.0.0', () => {
      console.log(`Academic Focus server listening on http://localhost:${portToTry}`);
    });
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE' && !process.env.PORT) {
        console.warn(`Port ${portToTry} is already in use, trying port ${portToTry + 1}...`);
        listenOnPort(portToTry + 1);
      } else {
        console.error('Server failed to start:', err);
        process.exit(1);
      }
    });
  };

  listenOnPort(PORT);
}

startServer();
