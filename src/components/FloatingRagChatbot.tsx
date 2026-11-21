import React, { useEffect, useRef, useState } from 'react';
import { Bot, Database, ExternalLink, FileText, Minimize2, Send, Sparkles, X } from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import { generateRagAnswer, getStoredGeminiApiKey } from '../lib/ragChatbot';
import type { NavTab, RagChatMessage } from '../types/academic';

const QUICK_QUESTIONS = [
  'What is the CS 320 late submission policy?',
  'How do I fix an expired GitHub Lab 4 invite link?',
  'What is my current GPA and attendance status?',
];

export function FloatingRagChatbot({
  activeTab,
  onNavigate,
}: {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
}) {
  const { workspace, supabaseConnected } = useAcademic();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<RagChatMessage[]>(() => [
    {
      id: 'float-welcome',
      role: 'assistant',
      timestamp: 'Ready',
      engine: getStoredGeminiApiKey() ? 'gemini-4-hydrogen' : 'supabase-rag-synthesizer',
      content:
        'Hi! Ask me anything about your courses, syllabi, lab guides, GPA, or customer inquiries—grounded in your live Supabase Knowledge Base.',
    },
  ]);

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, busy]);

  if (activeTab === 'assistant') {
    return null;
  }

  const handleSend = async (textOverride?: string) => {
    const q = (textOverride ?? input).trim();
    if (!q || busy) return;

    const userMsg: RagChatMessage = {
      id: `fl-u-${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!textOverride) setInput('');
    setBusy(true);

    try {
      const res = await generateRagAnswer({
        query: q,
        history: nextHistory,
        workspace,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `fl-a-${Date.now()}`,
          role: 'assistant',
          content: res.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          engine: res.engine,
          sources: res.sources,
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-16 right-4 z-40 md:bottom-6 md:right-6">
      {open ? (
        <div className="flex h-[510px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl sm:w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between bg-[#4F46E5] px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold">AI RAG Chatbot</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium">
                    <Database className="h-2.5 w-2.5" />
                    {supabaseConnected ? 'Supabase Live' : 'RAG'}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-100">
                  Gemini + {(workspace.knowledgeDocuments || []).length} Supabase Knowledge Docs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onNavigate('assistant');
                }}
                title="Open full RAG Assistant workspace"
                className="rounded-lg p-1.5 text-indigo-100 hover:bg-white/15 hover:text-white"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Minimize chatbot"
                className="rounded-lg p-1.5 text-indigo-100 hover:bg-white/15 hover:text-white"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick prompts */}
          <div className="flex gap-1.5 overflow-x-auto border-b border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSend(q)}
                disabled={busy}
                className="shrink-0 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-[11px] font-medium text-[#0F172A] hover:border-[#4F46E5] hover:text-[#4F46E5]"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-3.5">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#4F46E5] text-white'
                      : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A]'
                  }`}
                >
                  <div className="whitespace-pre-line">{m.content}</div>
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 space-y-1 border-t border-[#E2E8F0] pt-1.5">
                      {m.sources.slice(0, 2).map((src) => (
                        <div
                          key={`${m.id}-${src.id}`}
                          className="flex items-center justify-between gap-1.5 rounded-lg bg-white px-2 py-1 text-[10px]"
                        >
                          <span className="inline-flex items-center gap-1 truncate font-medium text-[#0F172A]">
                            <FileText className="h-3 w-3 shrink-0 text-[#4F46E5]" />
                            <span className="truncate">{src.title}</span>
                          </span>
                          <span className="shrink-0 font-mono text-[#065F46]">
                            {Math.round(src.similarity * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="text-xs text-[#64748B]">
                Retrieving from Supabase RAG &amp; generating answer...
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-[#E2E8F0] bg-white p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="h-9 flex-1 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs text-[#0F172A] focus:border-[#4F46E5] focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send message"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#4F46E5] text-white hover:bg-[#4338CA] disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2.5 rounded-full bg-[#4F46E5] px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#4338CA]"
        >
          <Sparkles className="h-4 w-4" />
          <span>Ask AI RAG</span>
        </button>
      )}
    </div>
  );
}
