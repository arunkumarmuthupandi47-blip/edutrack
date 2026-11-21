import React, { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Database,
  Mail,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import { generateRagAnswer } from '../lib/ragChatbot';
import type {
  CustomerResponse,
  CustomerResponseCategory,
  CustomerResponsePriority,
  CustomerResponseStatus,
} from '../types/academic';
import { Modal } from '../components/Modal';
import { StatusChip } from '../components/StatusChip';

const QUICK_TEMPLATES: Array<{ label: string; text: string; nextStatus: CustomerResponseStatus }> = [
  {
    label: 'Acknowledge & Investigate',
    text: 'Thank you for reaching out! We have received your inquiry and our academic support team is actively investigating this for you.',
    nextStatus: 'in-progress',
  },
  {
    label: 'Access / Link Reissued',
    text: 'We have refreshed your course repository invitation and verified your student permissions. Please try accessing the link again and let us know if any issue persists.',
    nextStatus: 'responded',
  },
  {
    label: 'Enrollment & GPA Verified',
    text: 'Confirmed! Your enrollment and credit-hour weighting have been updated in the workspace and your cumulative GPA calculation reflects the change.',
    nextStatus: 'responded',
  },
  {
    label: 'Resolved & Closed',
    text: 'This request has been resolved and verified. Thank you for your feedback—please feel free to open a new inquiry anytime you need assistance!',
    nextStatus: 'resolved',
  },
];

export function CustomerResponseView({
  externalModalOpen,
  onCloseExternalModal,
}: {
  externalModalOpen?: boolean;
  onCloseExternalModal?: () => void;
}) {
  const {
    workspace,
    supabaseConnected,
    addCustomerResponse,
    replyToCustomerResponse,
    deleteCustomerResponse,
    refreshCustomerResponses,
  } = useAcademic();

  const [statusFilter, setStatusFilter] = useState<'all' | CustomerResponseStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CustomerResponseCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(() =>
    workspace.customerResponses[0] ? workspace.customerResponses[0].id : null
  );

  const [responseText, setResponseText] = useState('');
  const [respondedBy, setRespondedBy] = useState(
    `${workspace.profile.name} (Academic Support)`
  );
  const [replyStatus, setReplyStatus] = useState<CustomerResponseStatus>('responded');
  const [rating, setRating] = useState<number | null>(5);
  const [savedBanner, setSavedBanner] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [draftingRag, setDraftingRag] = useState(false);

  const [localModalOpen, setLocalModalOpen] = useState(false);
  const modalOpen = Boolean(externalModalOpen || localModalOpen);

  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCategory, setNewCategory] = useState<CustomerResponseCategory>('Course Support');
  const [newPriority, setNewPriority] = useState<CustomerResponsePriority>('medium');
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const filteredResponses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return workspace.customerResponses.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        item.customerName.toLowerCase().includes(q) ||
        item.customerEmail.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q) ||
        item.responseText.toLowerCase().includes(q)
      );
    });
  }, [workspace.customerResponses, statusFilter, categoryFilter, searchQuery]);

  const selectedInquiry = useMemo(
    () =>
      filteredResponses.find((r) => r.id === selectedId) ??
      workspace.customerResponses.find((r) => r.id === selectedId) ??
      filteredResponses[0] ??
      null,
    [filteredResponses, workspace.customerResponses, selectedId]
  );

  useEffect(() => {
    if (selectedInquiry) {
      setSelectedId(selectedInquiry.id);
      setResponseText(selectedInquiry.responseText || '');
      setRespondedBy(
        selectedInquiry.respondedBy || `${workspace.profile.name} (Academic Support)`
      );
      setReplyStatus(
        selectedInquiry.status === 'open' ? 'responded' : selectedInquiry.status
      );
      setRating(selectedInquiry.rating ?? 5);
    }
  }, [selectedInquiry?.id]);

  const stats = useMemo(() => {
    const all = workspace.customerResponses;
    const openCount = all.filter((r) => r.status === 'open' || r.status === 'in-progress').length;
    const resolvedOrResponded = all.filter(
      (r) => r.status === 'responded' || r.status === 'resolved'
    ).length;
    const rated = all.filter((r) => typeof r.rating === 'number' && r.rating > 0);
    const avgRating =
      rated.length > 0
        ? rated.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rated.length
        : 5.0;
    const resolutionRate = all.length > 0 ? Math.round((resolvedOrResponded / all.length) * 100) : 100;
    return {
      total: all.length,
      openCount,
      resolutionRate,
      avgRating,
    };
  }, [workspace.customerResponses]);

  const closeModal = () => {
    setLocalModalOpen(false);
    setFormError(null);
    onCloseExternalModal?.();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshCustomerResponses();
    setRefreshing(false);
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry) return;

    await replyToCustomerResponse(selectedInquiry.id, {
      responseText: responseText.trim(),
      respondedBy: respondedBy.trim() || `${workspace.profile.name} (Academic Support)`,
      status: replyStatus,
      rating,
    });
    setSavedBanner(true);
    window.setTimeout(() => setSavedBanner(false), 3000);
  };

  const handleApplyTemplate = (tpl: (typeof QUICK_TEMPLATES)[number]) => {
    setResponseText(tpl.text);
    setReplyStatus(tpl.nextStatus);
  };

  const handleGenerateRagDraft = async () => {
    if (!selectedInquiry || draftingRag) return;
    setDraftingRag(true);
    try {
      const result = await generateRagAnswer({
        query: `Draft a helpful support response to customer ${selectedInquiry.customerName} regarding "${selectedInquiry.subject}": ${selectedInquiry.message}`,
        history: [],
        workspace,
      });
      setResponseText(result.answer);
      setReplyStatus('responded');
    } finally {
      setDraftingRag(false);
    }
  };

  const handleCreateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newCustomerEmail.trim() || !newSubject.trim() || !newMessage.trim()) {
      setFormError('Customer name, email, subject, and inquiry message are required.');
      return;
    }

    await addCustomerResponse({
      customerName: newCustomerName.trim(),
      customerEmail: newCustomerEmail.trim(),
      category: newCategory,
      priority: newPriority,
      subject: newSubject.trim(),
      message: newMessage.trim(),
    });

    setNewCustomerName('');
    setNewCustomerEmail('');
    setNewSubject('');
    setNewMessage('');
    closeModal();
  };

  const renderStatusChip = (status: CustomerResponseStatus) => {
    if (status === 'resolved') return <StatusChip tone="success" label="Resolved" />;
    if (status === 'responded') return <StatusChip tone="success" label="Responded" />;
    if (status === 'in-progress') return <StatusChip tone="warning" label="In Progress" />;
    return <StatusChip tone="critical" label="Open" />;
  };

  const renderPriorityBadge = (priority: CustomerResponsePriority) => {
    const styles: Record<CustomerResponsePriority, string> = {
      high: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]',
      medium: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
      low: 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]',
    };
    return (
      <span
        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${styles[priority]}`}
      >
        {priority}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#64748B]">Total Customer Inquiries</p>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                supabaseConnected
                  ? 'bg-[#ECFDF5] text-[#065F46]'
                  : 'bg-[#F1F5F9] text-[#475569]'
              }`}
            >
              <Database className="h-3 w-3" />
              {supabaseConnected ? 'Supabase Live' : 'Local Mode'}
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#0F172A] tabular-nums">
            {stats.total}
          </p>
          <p className="mt-1 text-xs text-[#64748B]">
            Synced with customer_responses table
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-[#64748B]">Awaiting Response</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#0F172A] tabular-nums">
            {stats.openCount}
          </p>
          <p className="mt-1 text-xs text-[#64748B]">
            {stats.openCount === 0
              ? 'Inbox zero — all inquiries answered'
              : 'Open & in-progress tickets'}
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-[#64748B]">Response &amp; Resolution Rate</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#0F172A] tabular-nums">
            {stats.resolutionRate}%
          </p>
          <p className="mt-1 text-xs text-[#64748B]">
            Target SLA: 95% within 24 hours
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-[#64748B]">Customer Satisfaction (CSAT)</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold tracking-tight text-[#0F172A] tabular-nums">
              {stats.avgRating.toFixed(1)}
            </p>
            <span className="text-xs font-medium text-[#64748B]">/ 5.0</span>
          </div>
          <p className="mt-1 text-xs text-[#64748B]">
            Based on rated support responses
          </p>
        </div>
      </section>

      {/* Filter & Action Toolbar */}
      <section className="flex flex-col justify-between gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'open', label: 'Open' },
              { id: 'in-progress', label: 'In Progress' },
              { id: 'responded', label: 'Responded' },
              { id: 'resolved', label: 'Resolved' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === tab.id
                  ? 'bg-[#4F46E5] text-white'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[210px] flex-1 sm:flex-initial">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer or subject..."
              aria-label="Search customer inquiries"
              className="h-9 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-8 pr-3 text-xs text-[#0F172A] focus:border-[#4F46E5] focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            aria-label="Filter by category"
            onChange={(e) =>
              setCategoryFilter(e.target.value as 'all' | CustomerResponseCategory)
            }
            className="h-9 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-medium text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Course Support">Course Support</option>
            <option value="Technical Issue">Technical Issue</option>
            <option value="Enrollment & Billing">Enrollment &amp; Billing</option>
            <option value="Feature Feedback">Feature Feedback</option>
            <option value="General Inquiry">General Inquiry</option>
          </select>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Sync with Supabase"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#4F46E5] ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            type="button"
            onClick={() => setLocalModalOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#4F46E5] px-3.5 text-xs font-medium text-white shadow-sm hover:bg-[#4338CA]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Inquiry</span>
          </button>
        </div>
      </section>

      {/* Master-Detail Split Console */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Customer Inquiry Feed */}
        <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm lg:col-span-5">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-3.5">
            <h2 className="text-sm font-semibold text-[#0F172A]">
              Customer Queue ({filteredResponses.length})
            </h2>
            <span className="text-xs text-[#64748B]">Click to respond</span>
          </div>

          {filteredResponses.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquareText className="mx-auto h-8 w-8 text-[#94A3B8]" />
              <p className="mt-2 text-sm font-medium text-[#0F172A]">No matching inquiries</p>
              <p className="mt-1 text-xs text-[#64748B]">
                Adjust your status or category filters, or create a new inquiry.
              </p>
            </div>
          ) : (
            <div className="max-h-[640px] divide-y divide-[#E2E8F0] overflow-y-auto">
              {filteredResponses.map((item: CustomerResponse) => {
                const isSelected = selectedInquiry?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full px-5 py-4 text-left transition-colors ${
                      isSelected
                        ? 'bg-[#EEF2FF]/70 border-l-4 border-l-[#4F46E5]'
                        : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold text-[#4F46E5]">
                        {item.category}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {renderPriorityBadge(item.priority)}
                        {renderStatusChip(item.status)}
                      </div>
                    </div>

                    <p className="mt-1.5 line-clamp-1 text-sm font-semibold text-[#0F172A]">
                      {item.subject}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-[#64748B]">{item.message}</p>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#64748B]">
                      <span className="font-medium text-[#0F172A]">{item.customerName}</span>
                      <span className="tabular-nums">{item.createdAt || 'Recent'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Customer Response Composer & Details */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm lg:col-span-7">
          {!selectedInquiry ? (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
              <MessageSquareText className="h-10 w-10 text-[#94A3B8]" />
              <p className="mt-3 text-base font-semibold text-[#0F172A]">
                Select a customer inquiry
              </p>
              <p className="mt-1 max-w-sm text-xs text-[#64748B]">
                Choose an item from the queue on the left to compose a response, apply a template, or update its resolution status.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E2E8F0] pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-[#EEF2FF] px-2.5 py-1 text-xs font-semibold text-[#4F46E5]">
                      {selectedInquiry.category}
                    </span>
                    {renderPriorityBadge(selectedInquiry.priority)}
                    {renderStatusChip(selectedInquiry.status)}
                  </div>
                  <h2 className="mt-2.5 text-lg font-semibold text-[#0F172A]">
                    {selectedInquiry.subject}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#64748B]">
                    <span className="font-medium text-[#0F172A]">
                      {selectedInquiry.customerName}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {selectedInquiry.customerEmail}
                    </span>
                    {selectedInquiry.createdAt && (
                      <span>Submitted {selectedInquiry.createdAt}</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deleteCustomerResponse(selectedInquiry.id)}
                  aria-label="Delete inquiry"
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs font-medium text-[#991B1B] hover:bg-[#FEF2F2]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </div>

              {/* Customer Message Card */}
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Customer Message
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#0F172A]">
                  {selectedInquiry.message}
                </p>
              </div>

              {/* Quick Canned Templates & Gemini RAG Draft */}
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F172A]">
                    <Sparkles className="h-3.5 w-3.5 text-[#4F46E5]" />
                    <span>Quick Response Templates</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateRagDraft}
                    disabled={draftingRag}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#EEF2FF] px-3 py-1.5 text-xs font-semibold text-[#4F46E5] transition-colors hover:bg-[#E0E7FF] disabled:opacity-60"
                  >
                    <Bot className={`h-3.5 w-3.5 ${draftingRag ? 'animate-pulse' : ''}`} />
                    <span>
                      {draftingRag ? 'Retrieving Supabase RAG...' : 'Draft with Gemini RAG'}
                    </span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#0F172A] transition-colors hover:border-[#4F46E5] hover:bg-[#EEF2FF] hover:text-[#4F46E5]"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Response Form */}
              <form onSubmit={handleSaveReply} className="space-y-4">
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label
                      htmlFor="response-editor"
                      className="text-xs font-semibold text-[#0F172A]"
                    >
                      Official Response
                    </label>
                    {selectedInquiry.respondedAt && (
                      <span className="text-[11px] text-[#64748B]">
                        Last updated {selectedInquiry.respondedAt}
                      </span>
                    )}
                  </div>
                  <textarea
                    id="response-editor"
                    rows={4}
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Write a clear, helpful response to the customer..."
                    className="w-full rounded-xl border border-[#E2E8F0] p-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="resp-agent"
                      className="mb-1.5 block text-xs font-medium text-[#0F172A]"
                    >
                      Responder Name
                    </label>
                    <input
                      id="resp-agent"
                      type="text"
                      value={respondedBy}
                      onChange={(e) => setRespondedBy(e.target.value)}
                      className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-xs text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="resp-status"
                      className="mb-1.5 block text-xs font-medium text-[#0F172A]"
                    >
                      Resolution Status
                    </label>
                    <select
                      id="resp-status"
                      value={replyStatus}
                      onChange={(e) =>
                        setReplyStatus(e.target.value as CustomerResponseStatus)
                      }
                      className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-medium text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="responded">Responded</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>

                  <div>
                    <span className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                      Satisfaction Rating
                    </span>
                    <div className="flex h-10 items-center gap-1 rounded-xl border border-[#E2E8F0] px-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          aria-label={`Rate ${star} stars`}
                          className="p-0.5 text-[#D97706] hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              (rating ?? 0) >= star
                                ? 'fill-[#D97706] text-[#D97706]'
                                : 'text-[#CBD5E1]'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] pt-4">
                  <div>
                    {savedBanner && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#065F46]">
                        <CheckCircle2 className="h-4 w-4" />
                        Response saved &amp; synced to Supabase
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#4F46E5] px-5 text-sm font-medium text-white shadow-sm hover:bg-[#4338CA]"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send &amp; Save Response</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* Modal: Log New Customer Inquiry */}
      <Modal
        open={modalOpen}
        title="New Customer Inquiry"
        description="Log a customer or student support ticket directly to Supabase."
        onClose={closeModal}
      >
        <form onSubmit={handleCreateInquiry} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cust-name" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Customer Name
              </label>
              <input
                id="cust-name"
                type="text"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="e.g. Jordan Rivera"
                className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="cust-email" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Customer Email
              </label>
              <input
                id="cust-email"
                type="email"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                placeholder="jordan.rivera@university.edu"
                className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cust-cat" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Category
              </label>
              <select
                id="cust-cat"
                value={newCategory}
                onChange={(e) =>
                  setNewCategory(e.target.value as CustomerResponseCategory)
                }
                className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
              >
                <option value="Course Support">Course Support</option>
                <option value="Technical Issue">Technical Issue</option>
                <option value="Enrollment & Billing">Enrollment &amp; Billing</option>
                <option value="Feature Feedback">Feature Feedback</option>
                <option value="General Inquiry">General Inquiry</option>
              </select>
            </div>

            <div>
              <label htmlFor="cust-prio" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Priority
              </label>
              <select
                id="cust-prio"
                value={newPriority}
                onChange={(e) =>
                  setNewPriority(e.target.value as CustomerResponsePriority)
                }
                className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="cust-subj" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
              Subject
            </label>
            <input
              id="cust-subj"
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Brief summary of the customer inquiry"
              className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="cust-msg" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
              Inquiry Message
            </label>
            <textarea
              id="cust-msg"
              rows={3}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Describe the customer question, issue, or feedback..."
              className="w-full rounded-xl border border-[#E2E8F0] p-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
            />
          </div>

          {formError && <p className="text-xs text-[#BA1A1A]">{formError}</p>}

          <div className="flex justify-end gap-3 border-t border-[#E2E8F0] pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="h-10 rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 rounded-xl bg-[#4F46E5] px-4 text-sm font-medium text-white shadow-sm hover:bg-[#4338CA]"
            >
              Create Inquiry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
