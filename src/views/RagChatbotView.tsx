import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Bot,
  CheckCircle2,
  Database,
  FileText,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import {
  generateRagAnswer,
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
} from '../lib/ragChatbot';
import type {
  KnowledgeDocument,
  KnowledgeDocumentCategory,
  RagChatMessage,
} from '../types/academic';
import { Modal } from '../components/Modal';

const STARTER_PROMPTS = [
  'What is the late submission policy and grading breakdown for CS 320?',
  'How do I fix an expired GitHub Classroom invite link for Lab 4?',
  'What are the fMRI preprocessing requirements in COGS 210?',
  'What is the minimum attendance threshold and GPA evaluation scale?',
];

export function RagChatbotView({
  externalModalOpen,
  onCloseExternalModal,
}: {
  externalModalOpen?: boolean;
  onCloseExternalModal?: () => void;
}) {
  const {
    workspace,
    supabaseConnected,
    addKnowledgeDocument,
    deleteKnowledgeDocument,
    refreshKnowledgeDocuments,
  } = useAcademic();

  const [messages, setMessages] = useState<RagChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      role: 'assistant',
      timestamp: 'Just now',
      engine: getStoredGeminiApiKey() ? 'gemini-4-hydrogen' : 'supabase-rag-synthesizer',
      content:
        'Hello! I am your **Academic Focus RAG Assistant**, connected to your **Supabase `knowledge_documents` table** and **Google Gemini API**. Ask me anything about course syllabi, lab guides, grading rubrics, attendance policies, or customer support procedures!',
      sources: (workspace.knowledgeDocuments || []).slice(0, 2).map((d) => ({
        id: d.id,
        title: d.title,
        category: d.category,
        courseCode: d.courseCode,
        similarity: 0.98,
        snippet: d.content.slice(0, 140) + '...',
      })),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [apiKeyInput, setApiKeyInput] = useState(() => getStoredGeminiApiKey());
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [keySavedNotice, setKeySavedNotice] = useState(false);

  const [docSearch, setDocSearch] = useState('');
  const [docCategory, setDocCategory] = useState<'all' | KnowledgeDocumentCategory>('all');
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [syncingDocs, setSyncingDocs] = useState(false);

  const [localDocModalOpen, setLocalDocModalOpen] = useState(false);
  const docModalOpen = Boolean(externalModalOpen || localDocModalOpen);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<KnowledgeDocumentCategory>('Course Syllabus');
  const [newCourseCode, setNewCourseCode] = useState('CS 320');
  const [newSource, setNewSource] = useState('University Knowledge Base');
  const [newTags, setNewTags] = useState('syllabus, policy, lab');
  const [newContent, setNewContent] = useState('');
  const [docFormError, setDocFormError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const docs = workspace.knowledgeDocuments || [];

  const filteredDocs = useMemo(() => {
    const q = docSearch.trim().toLowerCase();
    return docs.filter((d) => {
      if (docCategory !== 'all' && d.category !== docCategory) return false;
      if (!q) return true;
      return (
        d.title.toLowerCase().includes(q) ||
        d.courseCode.toLowerCase().includes(q) ||
        d.content.toLowerCase().includes(q) ||
        (d.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [docs, docCategory, docSearch]);

  const handleSendQuery = async (customQuery?: string) => {
    const q = (customQuery ?? inputQuery).trim();
    if (!q || isGenerating) return;

    const userMsg: RagChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    if (!customQuery) {
      setInputQuery('');
    }
    setIsGenerating(true);

    try {
      const result = await generateRagAnswer({
        query: q,
        history: updatedHistory,
        workspace,
        customApiKey: apiKeyInput,
      });

      const assistantMsg: RagChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engine: result.engine,
        sources: result.sources,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: err?.message || 'Unable to generate RAG response.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredGeminiApiKey(apiKeyInput);
    setKeySavedNotice(true);
    window.setTimeout(() => {
      setKeySavedNotice(false);
      setKeyModalOpen(false);
    }, 1000);
  };

  const handleSyncDocs = async () => {
    setSyncingDocs(true);
    await refreshKnowledgeDocuments();
    setSyncingDocs(false);
  };

  const closeDocModal = () => {
    setLocalDocModalOpen(false);
    setDocFormError(null);
    onCloseExternalModal?.();
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      setDocFormError('Document title and content are required.');
      return;
    }

    const parsedTags = newTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await addKnowledgeDocument({
      title: newTitle.trim(),
      category: newCategory,
      courseCode: newCourseCode.trim() || 'GENERAL',
      source: newSource.trim() || 'University Knowledge Base',
      tags: parsedTags.length > 0 ? parsedTags : ['general'],
      content: newContent.trim(),
    });

    setNewTitle('');
    setNewContent('');
    closeDocModal();
  };

  const hasGeminiKey = Boolean(apiKeyInput.trim());

  return (
    <div className="space-y-6">
      {/* Top Banner: Pipeline Overview */}
      <section className="flex flex-col justify-between gap-4 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm lg:flex-row lg:items-center">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
            <Bot className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-[#0F172A]">
                Gemini AI + Supabase RAG Assistant
              </h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                  supabaseConnected
                    ? 'bg-[#ECFDF5] text-[#065F46]'
                    : 'bg-[#F1F5F9] text-[#475569]'
                }`}
              >
                <Database className="h-3 w-3" />
                {supabaseConnected
                  ? `Supabase RAG (${docs.length} Docs)`
                  : `Local RAG (${docs.length} Docs)`}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                  hasGeminiKey
                    ? 'bg-[#EEF2FF] text-[#4F46E5]'
                    : 'bg-[#FFFBEB] text-[#92400E]'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                {hasGeminiKey ? 'Gemini 4 Hydrogen Active' : 'RAG Synthesizer (Add Gemini Key)'}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#64748B]">
              Retrieves top-ranked documents via Supabase PostgreSQL full-text &amp; vector search (
              <code className="font-mono text-[#0F172A]">search_knowledge_documents</code>) and grounds Gemini answers with source citations.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setKeyModalOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
          >
            <KeyRound className="h-3.5 w-3.5 text-[#4F46E5]" />
            <span>{hasGeminiKey ? 'Update Gemini API Key' : 'Configure Gemini API Key'}</span>
          </button>

          <button
            type="button"
            onClick={() => setLocalDocModalOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#4F46E5] px-3.5 text-xs font-medium text-white shadow-sm hover:bg-[#4338CA]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Mock Document</span>
          </button>
        </div>
      </section>

      {/* Main Two-Column Layout: Chatbot on Left, Supabase Knowledge Base on Right */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: RAG Chat Interface */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm lg:col-span-7">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#4F46E5]" />
              <h3 className="text-sm font-semibold text-[#0F172A]">RAG Grounded Chat</h3>
            </div>
            <button
              type="button"
              onClick={() => setMessages((prev) => prev.slice(0, 1))}
              className="text-xs font-medium text-[#64748B] hover:text-[#0F172A]"
            >
              Clear Conversation
            </button>
          </div>

          {/* Starter Prompt Pills */}
          <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-5 py-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Try a RAG Knowledge Query
            </p>
            <div className="flex flex-wrap gap-1.5">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSendQuery(prompt)}
                  disabled={isGenerating}
                  className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-left text-xs font-medium text-[#0F172A] transition-colors hover:border-[#4F46E5] hover:bg-[#EEF2FF] hover:text-[#4F46E5] disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Stream */}
          <div className="h-[460px] space-y-4 overflow-y-auto p-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] space-y-2.5 rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-[#4F46E5] text-white'
                      : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[11px]">
                    <span
                      className={`font-semibold ${
                        msg.role === 'user' ? 'text-indigo-100' : 'text-[#4F46E5]'
                      }`}
                    >
                      {msg.role === 'user'
                        ? workspace.profile.name
                        : msg.engine === 'gemini-4-hydrogen'
                        ? 'Gemini 4 Hydrogen · RAG'
                        : 'Supabase RAG Engine'}
                    </span>
                    <span
                      className={
                        msg.role === 'user' ? 'text-indigo-200' : 'text-[#64748B]'
                      }
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  <div className="whitespace-pre-line leading-relaxed">{msg.content}</div>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 border-t border-[#E2E8F0] pt-2.5">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                        Retrieved Supabase Documents ({msg.sources.length})
                      </p>
                      <div className="space-y-1.5">
                        {msg.sources.map((src) => (
                          <div
                            key={`${msg.id}-src-${src.id}`}
                            onClick={() => setSelectedDocId(src.id)}
                            className="cursor-pointer rounded-xl border border-[#E2E8F0] bg-white p-2.5 transition-colors hover:border-[#4F46E5]"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <FileText className="h-3.5 w-3.5 shrink-0 text-[#4F46E5]" />
                                <span className="truncate text-xs font-semibold text-[#0F172A]">
                                  {src.title}
                                </span>
                              </div>
                              <div className="flex shrink-0 items-center gap-1.5">
                                <span className="rounded bg-[#EEF2FF] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#4F46E5]">
                                  {src.courseCode}
                                </span>
                                <span className="rounded bg-[#ECFDF5] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#065F46]">
                                  {Math.round(src.similarity * 100)}% match
                                </span>
                              </div>
                            </div>
                            <p className="mt-1 line-clamp-2 text-[11px] text-[#64748B]">
                              {src.snippet}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0F172A] text-white">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {isGenerating && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
                  <Bot className="h-4 w-4 animate-pulse" />
                </div>
                <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-xs text-[#64748B]">
                  Searching Supabase <code className="font-mono">knowledge_documents</code> &amp; synthesizing response...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="flex items-center gap-2.5 border-t border-[#E2E8F0] bg-white p-4"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about syllabi, labs, attendance policies, GPA, or support docs..."
              aria-label="Ask RAG Assistant"
              className="h-10 flex-1 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={isGenerating || !inputQuery.trim()}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#4F46E5] px-4 text-sm font-medium text-white shadow-sm hover:bg-[#4338CA] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>Ask RAG</span>
            </button>
          </form>
        </div>

        {/* Right Column: Supabase Mock Documents Explorer */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm lg:col-span-5">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-3.5">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#4F46E5]" />
              <h3 className="text-sm font-semibold text-[#0F172A]">
                Supabase Knowledge Documents ({filteredDocs.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={handleSyncDocs}
              disabled={syncingDocs}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#4F46E5] hover:text-[#4338CA]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncingDocs ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
          </div>

          <div className="space-y-2.5 border-b border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                placeholder="Filter documents by keyword or course code..."
                aria-label="Filter knowledge documents"
                className="h-9 w-full rounded-xl border border-[#E2E8F0] bg-white pl-8 pr-3 text-xs text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
              />
            </div>

            <select
              value={docCategory}
              aria-label="Filter by document category"
              onChange={(e) =>
                setDocCategory(e.target.value as 'all' | KnowledgeDocumentCategory)
              }
              className="h-9 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-medium text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
            >
              <option value="all">All Document Categories</option>
              <option value="Course Syllabus">Course Syllabus</option>
              <option value="Lab & Technical Guide">Lab &amp; Technical Guide</option>
              <option value="Academic Policy">Academic Policy</option>
              <option value="Enrollment & GPA">Enrollment &amp; GPA</option>
              <option value="Support FAQ">Support FAQ</option>
            </select>
          </div>

          <div className="max-h-[520px] divide-y divide-[#E2E8F0] overflow-y-auto">
            {filteredDocs.map((doc: KnowledgeDocument) => {
              const isExpanded = selectedDocId === doc.id;
              return (
                <div
                  key={doc.id}
                  className={`p-4 transition-colors ${
                    isExpanded ? 'bg-[#EEF2FF]/45' : 'hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedDocId(isExpanded ? null : doc.id)
                      }
                      className="text-left"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded bg-[#EEF2FF] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#4F46E5]">
                          {doc.courseCode}
                        </span>
                        <span className="text-[11px] font-medium text-[#64748B]">
                          {doc.category}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-semibold text-[#0F172A]">
                        {doc.title}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteKnowledgeDocument(doc.id)}
                      aria-label={`Delete ${doc.title}`}
                      className="rounded-lg p-1 text-[#64748B] hover:bg-[#FEF2F2] hover:text-[#991B1B]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p
                    className={`mt-1.5 text-xs leading-relaxed text-[#475569] ${
                      isExpanded ? '' : 'line-clamp-3'
                    }`}
                  >
                    {doc.content}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {(doc.tags || []).slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] font-medium text-[#475569]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleSendQuery(`Summarize the key policies and details in "${doc.title}"`)
                      }
                      className="text-xs font-medium text-[#4F46E5] hover:text-[#4338CA]"
                    >
                      Ask Chatbot →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Modal: Configure Gemini API Key */}
      <Modal
        open={keyModalOpen}
        title="Configure Google Gemini API Key"
        description="Provide your Gemini API key to generate responses with gemini-4-hydrogen via the Gemini Interactions API grounded in your Supabase RAG documents."
        onClose={() => setKeyModalOpen(false)}
      >
        <form onSubmit={handleSaveApiKey} className="space-y-4">
          <div>
            <label htmlFor="gemini-key" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
              Gemini API Key (AI Studio)
            </label>
            <input
              id="gemini-key"
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 font-mono text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-[#64748B]">
              Stored locally in your browser or read from <code className="font-mono">GEMINI_API_KEY</code> in <code className="font-mono">.env</code>.
            </p>
          </div>

          {keySavedNotice && (
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#065F46]">
              <CheckCircle2 className="h-4 w-4" />
              Gemini API key saved!
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-[#E2E8F0] pt-4">
            <button
              type="button"
              onClick={() => setKeyModalOpen(false)}
              className="h-10 rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 rounded-xl bg-[#4F46E5] px-4 text-sm font-medium text-white shadow-sm hover:bg-[#4338CA]"
            >
              Save Key
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add New Mock Document to Supabase */}
      <Modal
        open={docModalOpen}
        title="Add RAG Knowledge Document"
        description="Create a new document in Supabase (public.knowledge_documents) for immediate RAG indexing and chatbot retrieval."
        onClose={closeDocModal}
      >
        <form onSubmit={handleCreateDocument} className="space-y-4">
          <div>
            <label htmlFor="doc-title" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
              Document Title
            </label>
            <input
              id="doc-title"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. CS 320 Final Exam Study Guide & Practice Problems"
              className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="doc-cat" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Category
              </label>
              <select
                id="doc-cat"
                value={newCategory}
                onChange={(e) =>
                  setNewCategory(e.target.value as KnowledgeDocumentCategory)
                }
                className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
              >
                <option value="Course Syllabus">Course Syllabus</option>
                <option value="Lab & Technical Guide">Lab &amp; Technical Guide</option>
                <option value="Academic Policy">Academic Policy</option>
                <option value="Enrollment & GPA">Enrollment &amp; GPA</option>
                <option value="Support FAQ">Support FAQ</option>
              </select>
            </div>

            <div>
              <label htmlFor="doc-code" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Course Code
              </label>
              <input
                id="doc-code"
                type="text"
                value={newCourseCode}
                onChange={(e) => setNewCourseCode(e.target.value)}
                placeholder="e.g. CS 320 or GENERAL"
                className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="doc-source" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Source Attribution
              </label>
              <input
                id="doc-source"
                type="text"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="doc-tags" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Tags (comma-separated)
              </label>
              <input
                id="doc-tags"
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="doc-content" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
              Document Content
            </label>
            <textarea
              id="doc-content"
              rows={4}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Enter syllabus details, grading policies, troubleshooting steps, or FAQ answers..."
              className="w-full rounded-xl border border-[#E2E8F0] p-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
            />
          </div>

          {docFormError && <p className="text-xs text-[#BA1A1A]">{docFormError}</p>}

          <div className="flex justify-end gap-3 border-t border-[#E2E8F0] pt-4">
            <button
              type="button"
              onClick={closeDocModal}
              className="h-10 rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 rounded-xl bg-[#4F46E5] px-4 text-sm font-medium text-white shadow-sm hover:bg-[#4338CA]"
            >
              Save to Supabase
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
