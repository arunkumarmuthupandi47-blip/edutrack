import React from 'react';
import { Database, MessageSquareText, Plus } from 'lucide-react';
import type { NavTab } from '../types/academic';
import { useAcademic } from '../context/AcademicContext';
import { MobileDrawerButton, NAV_ITEMS } from './Sidebar';

const TAB_TITLES: Record<NavTab, { title: string; breadcrumb: string; ctaLabel?: string }> = {
  overview: { title: 'Academic Overview', breadcrumb: 'Workspace / Overview', ctaLabel: 'New Assignment' },
  courses: { title: 'Enrolled Courses', breadcrumb: 'Workspace / Courses', ctaLabel: 'Add Course' },
  assignments: { title: 'Assignments', breadcrumb: 'Workspace / Assignments', ctaLabel: 'New Assignment' },
  timetable: { title: 'Weekly Timetable', breadcrumb: 'Workspace / Timetable', ctaLabel: 'Add Session' },
  grades: { title: 'Grades & GPA Evaluation', breadcrumb: 'Workspace / Grades & GPA' },
  focus: { title: 'Focus Timer', breadcrumb: 'Workspace / Focus Sessions' },
  attendance: { title: 'Attendance & Approvals', breadcrumb: 'Workspace / Attendance', ctaLabel: 'Submit Request' },
  responses: { title: 'Customer Response Hub', breadcrumb: 'Workspace / Customer Responses', ctaLabel: 'New Inquiry' },
  assistant: { title: 'Gemini AI + Supabase RAG Assistant', breadcrumb: 'Workspace / AI RAG Chatbot', ctaLabel: 'Add Document' },
  settings: { title: 'Profile & Settings', breadcrumb: 'Workspace / Settings' },
};

export function TopBar({
  activeTab,
  onSelectTab,
  onOpenMobileDrawer,
  onPrimaryAction,
}: {
  activeTab: NavTab;
  onSelectTab?: (tab: NavTab) => void;
  onOpenMobileDrawer: () => void;
  onPrimaryAction?: () => void;
}) {
  const meta = TAB_TITLES[activeTab];
  const { workspace, supabaseConnected } = useAcademic();

  const openResponsesCount = (workspace.customerResponses || []).filter(
    (r) => r.status === 'open' || r.status === 'in-progress'
  ).length;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-[#E2E8F0] bg-[#F8FAFC]/95 px-4 backdrop-blur-sm md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <MobileDrawerButton onOpen={onOpenMobileDrawer} />
        <div className="min-w-0">
          <p className="hidden text-xs font-medium text-[#64748B] sm:block">{meta.breadcrumb}</p>
          <h1 className="truncate text-base font-semibold tracking-tight text-[#0F172A] sm:text-lg">
            {meta.title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <span
          className={`hidden items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium md:inline-flex ${
            supabaseConnected
              ? 'border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46]'
              : 'border-[#E2E8F0] bg-white text-[#64748B]'
          }`}
          title="Supabase Backend Status"
        >
          <Database className="h-3.5 w-3.5" />
          <span>{supabaseConnected ? 'Supabase Connected' : 'Local Workspace'}</span>
        </span>

        {onSelectTab && (
          <>
            <select
              aria-label="Quick navigation"
              value={activeTab}
              onChange={(e) => onSelectTab(e.target.value as NavTab)}
              className="hidden h-9 rounded-xl border border-[#E2E8F0] bg-white px-2.5 text-xs font-medium text-[#0F172A] focus:border-[#4F46E5] focus:outline-none sm:inline-block lg:hidden"
            >
              {NAV_ITEMS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>

            {activeTab !== 'responses' && (
              <button
                type="button"
                onClick={() => onSelectTab('responses')}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-medium text-[#0F172A] transition-colors hover:bg-[#F8FAFC] whitespace-nowrap sm:h-10"
              >
                <MessageSquareText className="h-4 w-4 text-[#4F46E5]" />
                <span className="hidden sm:inline">Responses</span>
                {openResponsesCount > 0 && (
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#EEF2FF] px-1.5 text-[11px] font-semibold text-[#4F46E5] tabular-nums">
                    {openResponsesCount}
                  </span>
                )}
              </button>
            )}
          </>
        )}

        {meta.ctaLabel && onPrimaryAction && (
          <button
            type="button"
            onClick={onPrimaryAction}
            aria-label={meta.ctaLabel}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-[#4F46E5] px-3 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#4338CA] whitespace-nowrap sm:h-10 sm:gap-2 sm:px-4 sm:text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">{meta.ctaLabel}</span>
            <span className="sm:hidden">New</span>
          </button>
        )}
      </div>
    </header>
  );
}
