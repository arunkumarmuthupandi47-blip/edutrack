import { GoogleGenAI } from '@google/genai';
import { supabase } from './supabase';
import type {
  KnowledgeDocument,
  KnowledgeDocumentCategory,
  RagChatMessage,
  WorkspaceData,
} from '../types/academic';
import { calculateWeightedGpa } from '../utils/academicMath';

const GEMINI_KEY_STORAGE = 'academic_focus_gemini_api_key';

export function getStoredGeminiApiKey(): string {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(GEMINI_KEY_STORAGE);
    if (stored && stored.trim().length > 0) {
      return stored.trim();
    }
  }
  try {
    const metaEnv = (import.meta as any)?.env;
    const envKey =
      metaEnv?.VITE_GEMINI_API_KEY ||
      metaEnv?.NEXT_PUBLIC_GEMINI_API_KEY ||
      metaEnv?.GEMINI_API_KEY;
    if (envKey && envKey !== 'MY_GEMINI_API_KEY') {
      return String(envKey).trim();
    }
  } catch {
    // Ignore when import.meta is unavailable
  }
  return '';
}

export function setStoredGeminiApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    if (key.trim()) {
      window.localStorage.setItem(GEMINI_KEY_STORAGE, key.trim());
    } else {
      window.localStorage.removeItem(GEMINI_KEY_STORAGE);
    }
  }
}

function scoreDocumentLocally(doc: KnowledgeDocument, query: string): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0.5;

  const tokens = q
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);

  if (tokens.length === 0) return 0.4;

  const titleLower = doc.title.toLowerCase();
  const codeLower = doc.courseCode.toLowerCase();
  const catLower = doc.category.toLowerCase();
  const contentLower = doc.content.toLowerCase();
  const tagsLower = (doc.tags || []).map((t) => t.toLowerCase());

  let hits = 0;
  for (const token of tokens) {
    if (titleLower.includes(token)) hits += 3.0;
    if (codeLower.includes(token)) hits += 3.5;
    if (tagsLower.some((t) => t.includes(token))) hits += 2.5;
    if (catLower.includes(token)) hits += 1.5;
    if (contentLower.includes(token)) hits += 1.2;
  }

  if (hits === 0) return 0.1;
  return Math.min(0.99, Number((0.35 + (hits / (tokens.length * 4)) * 0.64).toFixed(2)));
}

export async function retrieveSupabaseRagDocuments(
  query: string,
  fallbackDocs: KnowledgeDocument[],
  limit = 3
): Promise<KnowledgeDocument[]> {
  try {
    const { data, error } = await supabase.rpc('search_knowledge_documents', {
      query_text: query,
      match_limit: limit,
    });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((row) => ({
        id: row.id,
        title: row.title,
        category: row.category as KnowledgeDocumentCategory,
        courseCode: row.course_code,
        source: row.source,
        tags: row.tags || [],
        content: row.content,
        similarity: Number((row.similarity ?? 0.85).toFixed(2)),
      }));
    }
  } catch {
    // Fall back to local scoring if RPC fails or offline
  }

  return [...fallbackDocs]
    .map((doc) => ({
      ...doc,
      similarity: scoreDocumentLocally(doc, query),
    }))
    .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
    .slice(0, limit);
}

function synthesizeGroundedRagFallback(
  query: string,
  retrievedDocs: KnowledgeDocument[],
  workspace: WorkspaceData
): string {
  const q = query.toLowerCase();
  const gpa = calculateWeightedGpa(workspace.courses).toFixed(2);
  const pendingTasks = workspace.assignments.filter((a) => a.status !== 'submitted');
  const openTickets = (workspace.customerResponses || []).filter(
    (r) => r.status === 'open' || r.status === 'in-progress'
  );

  const lines: string[] = [];

  if (retrievedDocs.length > 0) {
    const primary = retrievedDocs[0];
    lines.push(
      `Based on **${primary.title}** (\`${primary.courseCode}\` · *${primary.source}*):`
    );
    lines.push('');
    lines.push(`> ${primary.content}`);

    if (retrievedDocs.length > 1) {
      const secondary = retrievedDocs[1];
      if ((secondary.similarity ?? 0) >= 0.45) {
        lines.push('');
        lines.push(
          `**Additional Retrieved Context — ${secondary.title} (\`${secondary.courseCode}\`):**`
        );
        lines.push(`${secondary.content}`);
      }
    }
  }

  if (q.includes('gpa') || q.includes('grade') || q.includes('credit')) {
    lines.push('');
    lines.push(
      `**Live Workspace Snapshot:** Your current weighted GPA across **${workspace.courses.length} active courses** is **${gpa}** (Target GPA: **${workspace.profile.targetGpa.toFixed(2)}**).`
    );
  } else if (q.includes('deadline') || q.includes('assignment') || q.includes('due')) {
    lines.push('');
    lines.push(
      `**Upcoming Deadlines (${pendingTasks.length} pending):** ${pendingTasks
        .slice(0, 3)
        .map((a) => `*${a.title}* (due ${a.dueDate})`)
        .join(', ')}.`
    );
  } else if (q.includes('customer') || q.includes('inquiry') || q.includes('support') || q.includes('ticket')) {
    lines.push('');
    lines.push(
      `**Customer Response Queue:** There are currently **${openTickets.length} open/in-progress customer inquiries** synced with Supabase.`
    );
  }

  return lines.join('\n');
}

export async function generateRagAnswer({
  query,
  history,
  workspace,
  customApiKey,
}: {
  query: string;
  history: RagChatMessage[];
  workspace: WorkspaceData;
  customApiKey?: string;
}): Promise<{
  answer: string;
  engine: 'gemini-4-hydrogen' | 'supabase-rag-synthesizer';
  sources: NonNullable<RagChatMessage['sources']>;
}> {
  const retrievedDocs = await retrieveSupabaseRagDocuments(
    query,
    workspace.knowledgeDocuments || [],
    3
  );

  const sources: NonNullable<RagChatMessage['sources']> = retrievedDocs.map((doc) => ({
    id: doc.id,
    title: doc.title,
    category: doc.category,
    courseCode: doc.courseCode,
    similarity: doc.similarity ?? 0.85,
    snippet: doc.content.length > 180 ? `${doc.content.slice(0, 180)}...` : doc.content,
  }));

  const gpa = calculateWeightedGpa(workspace.courses).toFixed(2);
  const ragContextBlock = retrievedDocs
    .map(
      (doc, idx) =>
        `[Document #${idx + 1} | Title: ${doc.title} | Course: ${doc.courseCode} | Category: ${doc.category} | Source: ${doc.source}]\n${doc.content}`
    )
    .join('\n\n');

  const workspaceSummaryBlock = [
    `Student: ${workspace.profile.name} (${workspace.profile.major}, ${workspace.profile.term})`,
    `Cumulative GPA: ${gpa} / Target GPA: ${workspace.profile.targetGpa.toFixed(2)}`,
    `Active Courses: ${workspace.courses.map((c) => `${c.code} ${c.title} (${c.gradePercent}%, Attendance ${c.attendedClasses}/${c.totalClasses})`).join('; ')}`,
    `Pending Assignments: ${workspace.assignments
      .filter((a) => a.status !== 'submitted')
      .map((a) => `${a.title} (Due ${a.dueDate})`)
      .join('; ')}`,
    `Open Customer Inquiries: ${(workspace.customerResponses || [])
      .filter((r) => r.status === 'open' || r.status === 'in-progress')
      .map((r) => `${r.customerName}: "${r.subject}" [${r.status}]`)
      .join('; ')}`,
  ].join('\n');

  const recentTurns = history
    .slice(-4)
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const fullPrompt = [
    '=== RETRIEVED SUPABASE KNOWLEDGE BASE DOCUMENTS ===',
    ragContextBlock,
    '',
    '=== LIVE WORKSPACE STATE ===',
    workspaceSummaryBlock,
    '',
    recentTurns ? `=== RECENT CONVERSATION ===\n${recentTurns}\n` : '',
    `=== USER QUESTION ===\n${query}`,
  ].join('\n');

  const apiKey = (customApiKey ?? getStoredGeminiApiKey()).trim();
  const systemInstruction =
    'You are the Academic Focus AI Assistant powered by Google Gemini 4 Hydrogen and Supabase RAG. Answer questions concisely and accurately using the Retrieved Supabase Knowledge Base Documents and Live Workspace State. Cite the retrieved document title or course code in brackets (e.g., [CS 320 Syllabus]) whenever you use information from a retrieved document.';

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const interaction = await ai.interactions.create({
        model: 'gemini-4-hydrogen',
        input: fullPrompt,
        system_instruction: systemInstruction,
      });

      const text = interaction.output_text?.trim();
      if (text) {
        return {
          answer: text,
          engine: 'gemini-4-hydrogen',
          sources,
        };
      }
    } catch (err: any) {
      console.warn('Direct Gemini Interactions API call failed, trying backend /api/rag/chat or fallback:', err);
    }
  }

  // Try server-side /api/rag/chat endpoint in case GEMINI_API_KEY is configured on the server
  try {
    const res = await fetch('/api/rag/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        prompt: fullPrompt,
        apiKey: apiKey || undefined,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.answer) {
        return {
          answer: data.answer,
          engine: 'gemini-4-hydrogen',
          sources,
        };
      }
    }
  } catch {
    // Fall through to grounded RAG synthesizer
  }

  return {
    answer: synthesizeGroundedRagFallback(query, retrievedDocs, workspace),
    engine: 'supabase-rag-synthesizer',
    sources,
  };
}
