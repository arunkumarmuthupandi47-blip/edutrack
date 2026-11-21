import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createInitialWorkspaceData } from '../data/seedData';
import { supabase } from '../lib/supabase';
import type {
  AcademicRequest,
  Assignment,
  Course,
  CustomerResponse,
  CustomerResponseCategory,
  CustomerResponsePriority,
  CustomerResponseStatus,
  FocusSession,
  KnowledgeDocument,
  KnowledgeDocumentCategory,
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
  supabaseConnected: boolean;
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
  addCustomerResponse: (
    data: Pick<
      CustomerResponse,
      'customerName' | 'customerEmail' | 'category' | 'priority' | 'subject' | 'message'
    >
  ) => Promise<void>;
  replyToCustomerResponse: (
    id: number,
    patch: {
      responseText: string;
      respondedBy: string;
      status: CustomerResponseStatus;
      rating?: number | null;
    }
  ) => Promise<void>;
  deleteCustomerResponse: (id: number) => Promise<void>;
  refreshCustomerResponses: () => Promise<void>;
  addKnowledgeDocument: (
    doc: Pick<KnowledgeDocument, 'title' | 'category' | 'courseCode' | 'source' | 'tags' | 'content'>
  ) => Promise<void>;
  deleteKnowledgeDocument: (id: number) => Promise<void>;
  refreshKnowledgeDocuments: () => Promise<void>;
  resetLocalWorkspace: () => void;
}

const AcademicContext = createContext<AcademicContextValue | null>(null);

function loadLocalWorkspace(): WorkspaceData {
  const initial = createInitialWorkspaceData();
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WorkspaceData;
      if (parsed && Array.isArray(parsed.courses) && parsed.profile) {
        return {
          ...initial,
          ...parsed,
          customerResponses: Array.isArray(parsed.customerResponses)
            ? parsed.customerResponses
            : initial.customerResponses,
          knowledgeDocuments: Array.isArray(parsed.knowledgeDocuments)
            ? parsed.knowledgeDocuments
            : initial.knowledgeDocuments,
        };
      }
    }
  } catch {
    // Fall back to deterministic initial data if localStorage is unavailable
  }
  return initial;
}

export function AcademicProvider({ children }: { children: React.ReactNode }) {
  const { user, authLoading, getIdToken } = useAuth();
  const [workspace, setWorkspace] = useState<WorkspaceData>(() => loadLocalWorkspace());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState(false);

  const isAuthenticatedMode = Boolean(user);

  const persistLocal = useCallback((next: WorkspaceData) => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const refreshCustomerResponses = useCallback(async () => {
    try {
      const { data, error: sbError } = await supabase
        .from('customer_responses')
        .select('*')
        .order('id', { ascending: false });

      if (sbError) {
        setSupabaseConnected(false);
        return;
      }

      setSupabaseConnected(true);
      if (data && data.length > 0) {
        const mapped: CustomerResponse[] = data.map((row) => ({
          id: row.id,
          customerName: row.customer_name,
          customerEmail: row.customer_email,
          category: row.category as CustomerResponseCategory,
          priority: row.priority as CustomerResponsePriority,
          status: row.status as CustomerResponseStatus,
          subject: row.subject,
          message: row.message,
          responseText: row.response_text,
          respondedBy: row.responded_by,
          respondedAt: row.responded_at,
          rating: row.rating,
          createdAt: row.created_at
            ? row.created_at.replace('T', ' ').slice(0, 16)
            : undefined,
        }));

        setWorkspace((prev) => {
          const next = { ...prev, customerResponses: mapped };
          persistLocal(next);
          return next;
        });
      }
    } catch {
      setSupabaseConnected(false);
    }
  }, [persistLocal]);

  const refreshKnowledgeDocuments = useCallback(async () => {
    try {
      const { data, error: sbError } = await supabase
        .from('knowledge_documents')
        .select('*')
        .order('id', { ascending: true });

      if (sbError) {
        return;
      }

      setSupabaseConnected(true);
      if (data && data.length > 0) {
        const mapped: KnowledgeDocument[] = data.map((row) => ({
          id: row.id,
          title: row.title,
          category: row.category as KnowledgeDocumentCategory,
          courseCode: row.course_code,
          source: row.source,
          tags: row.tags || [],
          content: row.content,
          createdAt: row.created_at
            ? row.created_at.replace('T', ' ').slice(0, 16)
            : undefined,
        }));

        setWorkspace((prev) => {
          const next = { ...prev, knowledgeDocuments: mapped };
          persistLocal(next);
          return next;
        });
      }
    } catch {
      // Ignore if offline
    }
  }, [persistLocal]);

  useEffect(() => {
    refreshCustomerResponses();
    refreshKnowledgeDocuments();
  }, [refreshCustomerResponses, refreshKnowledgeDocuments]);

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

  const addCustomerResponse = useCallback(
    async (
      data: Pick<
        CustomerResponse,
        'customerName' | 'customerEmail' | 'category' | 'priority' | 'subject' | 'message'
      >
    ) => {
      setError(null);
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

      try {
        const { data: inserted, error: sbError } = await supabase
          .from('customer_responses')
          .insert({
            workspace_id: 'default-workspace',
            customer_name: data.customerName,
            customer_email: data.customerEmail,
            category: data.category,
            priority: data.priority,
            status: 'open',
            subject: data.subject,
            message: data.message,
            response_text: '',
            responded_by: '',
          })
          .select('*')
          .single();

        if (!sbError && inserted) {
          setSupabaseConnected(true);
          const createdItem: CustomerResponse = {
            id: inserted.id,
            customerName: inserted.customer_name,
            customerEmail: inserted.customer_email,
            category: inserted.category as CustomerResponseCategory,
            priority: inserted.priority as CustomerResponsePriority,
            status: inserted.status as CustomerResponseStatus,
            subject: inserted.subject,
            message: inserted.message,
            responseText: inserted.response_text,
            respondedBy: inserted.responded_by,
            respondedAt: inserted.responded_at,
            rating: inserted.rating,
            createdAt: inserted.created_at
              ? inserted.created_at.replace('T', ' ').slice(0, 16)
              : nowStr,
          };
          updateLocal((prev) => ({
            ...prev,
            customerResponses: [createdItem, ...prev.customerResponses],
          }));
          return;
        }
      } catch {
        // Fall through to local update if offline
      }

      const fallbackItem: CustomerResponse = {
        id: Date.now(),
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        category: data.category,
        priority: data.priority,
        status: 'open',
        subject: data.subject,
        message: data.message,
        responseText: '',
        respondedBy: '',
        respondedAt: null,
        rating: null,
        createdAt: nowStr,
      };
      updateLocal((prev) => ({
        ...prev,
        customerResponses: [fallbackItem, ...prev.customerResponses],
      }));
    },
    [updateLocal]
  );

  const replyToCustomerResponse = useCallback(
    async (
      id: number,
      patch: {
        responseText: string;
        respondedBy: string;
        status: CustomerResponseStatus;
        rating?: number | null;
      }
    ) => {
      setError(null);
      const respondedAt = new Date().toISOString().replace('T', ' ').slice(0, 16);

      try {
        const { error: sbError } = await supabase
          .from('customer_responses')
          .update({
            response_text: patch.responseText,
            responded_by: patch.respondedBy,
            responded_at: respondedAt,
            status: patch.status,
            ...(patch.rating !== undefined ? { rating: patch.rating } : {}),
          })
          .eq('id', id);

        if (!sbError) {
          setSupabaseConnected(true);
        }
      } catch {
        // Fall back to local persistence
      }

      updateLocal((prev) => ({
        ...prev,
        customerResponses: prev.customerResponses.map((item) =>
          item.id === id
            ? {
                ...item,
                responseText: patch.responseText,
                respondedBy: patch.respondedBy,
                respondedAt,
                status: patch.status,
                rating: patch.rating !== undefined ? patch.rating : item.rating,
              }
            : item
        ),
      }));
    },
    [updateLocal]
  );

  const deleteCustomerResponse = useCallback(
    async (id: number) => {
      setError(null);
      try {
        await supabase.from('customer_responses').delete().eq('id', id);
      } catch {
        // Ignore if offline
      }
      updateLocal((prev) => ({
        ...prev,
        customerResponses: prev.customerResponses.filter((item) => item.id !== id),
      }));
    },
    [updateLocal]
  );

  const addKnowledgeDocument = useCallback(
    async (
      doc: Pick<KnowledgeDocument, 'title' | 'category' | 'courseCode' | 'source' | 'tags' | 'content'>
    ) => {
      setError(null);
      try {
        const { data: inserted, error: sbError } = await supabase
          .from('knowledge_documents')
          .insert({
            workspace_id: 'default-workspace',
            title: doc.title,
            category: doc.category,
            course_code: doc.courseCode,
            source: doc.source,
            tags: doc.tags,
            content: doc.content,
          })
          .select('*')
          .single();

        if (!sbError && inserted) {
          setSupabaseConnected(true);
          const createdDoc: KnowledgeDocument = {
            id: inserted.id,
            title: inserted.title,
            category: inserted.category as KnowledgeDocumentCategory,
            courseCode: inserted.course_code,
            source: inserted.source,
            tags: inserted.tags || [],
            content: inserted.content,
          };
          updateLocal((prev) => ({
            ...prev,
            knowledgeDocuments: [createdDoc, ...(prev.knowledgeDocuments || [])],
          }));
          return;
        }
      } catch {
        // Fallback to local update if offline
      }

      const fallbackDoc: KnowledgeDocument = {
        id: Date.now(),
        title: doc.title,
        category: doc.category,
        courseCode: doc.courseCode,
        source: doc.source,
        tags: doc.tags,
        content: doc.content,
      };
      updateLocal((prev) => ({
        ...prev,
        knowledgeDocuments: [fallbackDoc, ...(prev.knowledgeDocuments || [])],
      }));
    },
    [updateLocal]
  );

  const deleteKnowledgeDocument = useCallback(
    async (id: number) => {
      setError(null);
      try {
        await supabase.from('knowledge_documents').delete().eq('id', id);
      } catch {
        // Ignore if offline
      }
      updateLocal((prev) => ({
        ...prev,
        knowledgeDocuments: (prev.knowledgeDocuments || []).filter((d) => d.id !== id),
      }));
    },
    [updateLocal]
  );

  const resetLocalWorkspace = useCallback(() => {
    const fresh = createInitialWorkspaceData();
    setWorkspace(fresh);
    persistLocal(fresh);
    refreshCustomerResponses();
    refreshKnowledgeDocuments();
  }, [persistLocal, refreshCustomerResponses, refreshKnowledgeDocuments]);

  const dismissError = useCallback(() => setError(null), []);

  return (
    <AcademicContext.Provider
      value={{
        workspace,
        loading,
        error,
        isAuthenticatedMode,
        supabaseConnected,
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
        addCustomerResponse,
        replyToCustomerResponse,
        deleteCustomerResponse,
        refreshCustomerResponses,
        addKnowledgeDocument,
        deleteKnowledgeDocument,
        refreshKnowledgeDocuments,
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
