import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createInitialWorkspaceData } from '../data/seedData';
import type {
  AcademicRequest,
  Assignment,
  Course,
  FocusSession,
  TimetableSession,
  UserProfile,
  WorkspaceData,
} from '../types/academic';
import { useAuth } from './AuthContext';

const LOCAL_STORAGE_KEY = 'academic_focus_workspace_v1';

interface AcademicContextValue {
  workspace: WorkspaceData;
  loading: boolean;
  error: string | null;
  isAuthenticatedMode: boolean;
  dismissError: () => void;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  addCourse: (course: Omit<Course, 'id'>) => Promise<void>;
  updateCourse: (id: number, patch: Partial<Omit<Course, 'id'>>) => Promise<void>;
  deleteCourse: (id: number) => Promise<void>;
  addAssignment: (assignment: Omit<Assignment, 'id'>) => Promise<void>;
  updateAssignment: (id: number, patch: Partial<Omit<Assignment, 'id'>>) => Promise<void>;
  deleteAssignment: (id: number) => Promise<void>;
  addTimetableSession: (session: Omit<TimetableSession, 'id'>) => Promise<void>;
  deleteTimetableSession: (id: number) => Promise<void>;
  logFocusSession: (session: Omit<FocusSession, 'id'>) => Promise<void>;
  addAcademicRequest: (req: Omit<AcademicRequest, 'id'>) => Promise<void>;
  updateRequestStatus: (id: number, status: AcademicRequest['status']) => Promise<void>;
  resetLocalWorkspace: () => void;
}

const AcademicContext = createContext<AcademicContextValue | null>(null);

function loadLocalWorkspace(): WorkspaceData {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WorkspaceData;
      if (parsed && Array.isArray(parsed.courses) && parsed.profile) {
        return parsed;
      }
    }
  } catch {
    // Fall back to deterministic initial data if localStorage is unavailable
  }
  return createInitialWorkspaceData();
}

export function AcademicProvider({ children }: { children: React.ReactNode }) {
  const { user, authLoading, getIdToken } = useAuth();
  const [workspace, setWorkspace] = useState<WorkspaceData>(() => loadLocalWorkspace());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticatedMode = Boolean(user);

  const persistLocal = useCallback((next: WorkspaceData) => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const authFetch = useCallback(
    async <T,>(url: string, options?: RequestInit): Promise<T> => {
      const token = await getIdToken();
      if (!token) {
        throw new Error('Authentication session expired. Please sign in again.');
      }
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(options?.headers || {}),
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      return res.json() as Promise<T>;
    },
    [getIdToken]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setWorkspace(loadLocalWorkspace());
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    authFetch<WorkspaceData>('/api/workspace')
      .then((data) => {
        if (!cancelled) {
          setWorkspace(data);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err.message || 'Unable to load workspace.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, authFetch]);

  const updateLocal = useCallback(
    (updater: (prev: WorkspaceData) => WorkspaceData) => {
      setWorkspace((prev) => {
        const next = updater(prev);
        persistLocal(next);
        return next;
      });
    },
    [persistLocal]
  );

  const updateProfile = useCallback(
    async (patch: Partial<UserProfile>) => {
      setError(null);
      if (isAuthenticatedMode) {
        try {
          const updated = await authFetch<UserProfile>('/api/profile', {
            method: 'PATCH',
            body: JSON.stringify(patch),
          });
          setWorkspace((prev) => ({ ...prev, profile: { ...prev.profile, ...updated } }));
        } catch (err: any) {
          setError(err.message || 'Failed to update profile.');
        }
        return;
      }
      updateLocal((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...patch },
      }));
    },
    [isAuthenticatedMode, authFetch, updateLocal]
  );

  const addCourse = useCallback(
    async (course: Omit<Course, 'id'>) => {
      setError(null);
      if (isAuthenticatedMode) {
        try {
          const created = await authFetch<Course>('/api/courses', {
            method: 'POST',
            body: JSON.stringify(course),
          });
          setWorkspace((prev) => ({ ...prev, courses: [...prev.courses, created] }));
        } catch (err: any) {
          setError(err.message || 'Failed to create course.');
        }
        return;
      }
      const nextId = Date.now();
      updateLocal((prev) => ({
        ...prev,
        courses: [...prev.courses, { ...course, id: nextId }],
      }));
    },
    [isAuthenticatedMode, authFetch, updateLocal]
  );

  const updateCourse = useCallback(
    async (id: number, patch: Partial<Omit<Course, 'id'>>) => {
      setError(null);
      if (isAuthenticatedMode) {
        try {
          const updated = await authFetch<Course>(`/api/courses/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
          });
          setWorkspace((prev) => ({
            ...prev,
            courses: prev.courses.map((c) => (c.id === id ? updated : c)),
          }));
        } catch (err: any) {
          setError(err.message || 'Failed to update course.');
        }
        return;
      }
      updateLocal((prev) => ({
        ...prev,
        courses: prev.courses.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }));
    },
    [isAuthenticatedMode, authFetch, updateLocal]
  );

  const deleteCourse = useCallback(
    async (id: number) => {
      setError(null);
      if (isAuthenticatedMode) {
        try {
          await authFetch(`/api/courses/${id}`, { method: 'DELETE' });
          setWorkspace((prev) => ({
            ...prev,
            courses: prev.courses.filter((c) => c.id !== id),
            assignments: prev.assignments.filter((a) => a.courseId !== id),
            timetableSessions: prev.timetableSessions.filter((t) => t.courseId !== id),
          }));
        } catch (err: any) {
          setError(err.message || 'Failed to delete course.');
        }
        return;
      }
      updateLocal((prev) => ({
        ...prev,
        courses: prev.courses.filter((c) => c.id !== id),
        assignments: prev.assignments.filter((a) => a.courseId !== id),
        timetableSessions: prev.timetableSessions.filter((t) => t.courseId !== id),
      }));
    },
    [isAuthenticatedMode, authFetch, updateLocal]
  );

  const addAssignment = useCallback(
    async (assignment: Omit<Assignment, 'id'>) => {
      setError(null);
      if (isAuthenticatedMode) {
        try {
          const created = await authFetch<Assignment>('/api/assignments', {
            method: 'POST',
            body: JSON.stringify(assignment),
          });
          setWorkspace((prev) => ({
            ...prev,
            assignments: [created, ...prev.assignments],
          }));
        } catch (err: any) {
          setError(err.message || 'Failed to create assignment.');
        }
        return;
      }
      updateLocal((prev) => ({
        ...prev,
        assignments: [{ ...assignment, id: Date.now() }, ...prev.assignments],
      }));
    },
    [isAuthenticatedMode, authFetch, updateLocal]
  );

  const updateAssignment = useCallback(
    async (id: number, patch: Partial<Omit<Assignment, 'id'>>) => {
      setError(null);
      if (isAuthenticatedMode) {
        try {
          const updated = await authFetch<Assignment>(`/api/assignments/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
          });
          setWorkspace((prev) => ({
            ...prev,
            assignments: prev.assignments.map((a) => (a.id === id ? updated : a)),
          }));
        } catch (err: any) {
          setError(err.message || 'Failed to update assignment.');
        }
        return;
      }
      updateLocal((prev) => ({
        ...prev,
        assignments: prev.assignments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      }));
    },
    [isAuthenticatedMode, authFetch, updateLocal]
  );

  const deleteAssignment = useCallback(
    async (id: number) => {
      setError(null);
      if (isAuthenticatedMode) {
        try {
          await authFetch(`/api/assignments/${id}`, { method: 'DELETE' });
          setWorkspace((prev) => ({
            ...prev,
            assignments: prev.assignments.filter((a) => a.id !== id),
          }));
        } catch (err: any) {
          setError(err.message || 'Failed to delete assignment.');
        }
        return;
      }
      updateLocal((prev) => ({
        ...prev,
        assignments: prev.assignments.filter((a) => a.id !== id),
      }));
    },
    [isAuthenticatedMode, authFetch, updateLocal]
  );

  const addTimetableSession = useCallback(
    async (session: Omit<TimetableSession, 'id'>) => {
      setError(null);
      if (isAuthenticatedMode) {
        try {
          const created = await authFetch<TimetableSession>('/api/timetable', {
            method: 'POST',
            body: JSON.stringify(session),
          });
          setWorkspace((prev) => ({
            ...prev,
            timetableSessions: [...prev.timetableSessions, created],
          }));
        } catch (err: any) {
          setError(err.message || 'Failed to add timetable session.');
        }
        return;
      }
      updateLocal((prev) => ({
        ...prev,
        timetableSessions: [...prev.timetableSessions, { ...session, id: Date.now() }],
      }));
    },
    [isAuthenticatedMode, authFetch, updateLocal]
  );

  const deleteTimetableSession = useCallback(
    async (id: number) => {
      setError(null);
      if (isAuthenticatedMode) {
        try {
          await authFetch(`/api/timetable/${id}`, { method: 'DELETE' });
          setWorkspace((prev) => ({
            ...prev,
            timetableSessions: prev.timetableSessions.filter((t) => t.id !== id),
          }));
        } catch (err: any) {
          setError(err.message || 'Failed to remove timetable session.');
        }
        return;
      }
      updateLocal((prev) => ({
        ...prev,
        timetableSessions: prev.timetableSessions.filter((t) => t.id !== id),
      }));
    },
    [isAuthenticatedMode, authFetch, updateLocal]
  );

  const logFocusSession = useCallback(
    async (session: Omit<FocusSession, 'id'>) => {
      setError(null);
      if (isAuthenticatedMode) {
        try {
          const created = await authFetch<FocusSession>('/api/focus-sessions', {
            method: 'POST',
            body: JSON.stringify(session),
          });
          setWorkspace((prev) => ({
            ...prev,
            focusSessions: [created, ...prev.focusSessions],
          }));
        } catch (err: any) {
          setError(err.message || 'Failed to save focus session.');
        }
        return;
      }
      updateLocal((prev) => ({
        ...prev,
        focusSessions: [{ ...session, id: Date.now() }, ...prev.focusSessions],
      }));
    },
    [isAuthenticatedMode, authFetch, updateLocal]
  );

  const addAcademicRequest = useCallback(
    async (req: Omit<AcademicRequest, 'id'>) => {
      setError(null);
      if (isAuthenticatedMode) {
        try {
          const created = await authFetch<AcademicRequest>('/api/requests', {
            method: 'POST',
            body: JSON.stringify(req),
          });
          setWorkspace((prev) => ({
            ...prev,
            academicRequests: [created, ...prev.academicRequests],
          }));
        } catch (err: any) {
          setError(err.message || 'Failed to submit academic request.');
        }
        return;
      }
      updateLocal((prev) => ({
        ...prev,
        academicRequests: [{ ...req, id: Date.now() }, ...prev.academicRequests],
      }));
    },
    [isAuthenticatedMode, authFetch, updateLocal]
  );

  const updateRequestStatus = useCallback(
    async (id: number, status: AcademicRequest['status']) => {
      setError(null);
      if (isAuthenticatedMode) {
        try {
          const updated = await authFetch<AcademicRequest>(`/api/requests/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
          });
          setWorkspace((prev) => ({
            ...prev,
            academicRequests: prev.academicRequests.map((r) => (r.id === id ? updated : r)),
          }));
        } catch (err: any) {
          setError(err.message || 'Failed to update request status.');
        }
        return;
      }
      updateLocal((prev) => ({
        ...prev,
        academicRequests: prev.academicRequests.map((r) => (r.id === id ? { ...r, status } : r)),
      }));
    },
    [isAuthenticatedMode, authFetch, updateLocal]
  );

  const resetLocalWorkspace = useCallback(() => {
    const fresh = createInitialWorkspaceData();
    setWorkspace(fresh);
    persistLocal(fresh);
  }, [persistLocal]);

  const dismissError = useCallback(() => setError(null), []);

  return (
    <AcademicContext.Provider
      value={{
        workspace,
        loading,
        error,
        isAuthenticatedMode,
        dismissError,
        updateProfile,
        addCourse,
        updateCourse,
        deleteCourse,
        addAssignment,
        updateAssignment,
        deleteAssignment,
        addTimetableSession,
        deleteTimetableSession,
        logFocusSession,
        addAcademicRequest,
        updateRequestStatus,
        resetLocalWorkspace,
      }}
    >
      {children}
    </AcademicContext.Provider>
  );
}

export function useAcademic() {
  const ctx = useContext(AcademicContext);
  if (!ctx) {
    throw new Error('useAcademic must be used inside AcademicProvider');
  }
  return ctx;
}
