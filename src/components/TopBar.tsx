import React from 'react';
import { Plus } from 'lucide-react';
import type { NavTab } from '../types/academic';
import { MobileDrawerButton } from './Sidebar';

const TAB_TITLES: Record<NavTab, { title: string; breadcrumb: string; ctaLabel?: string }> = {
  overview: { title: 'Academic Overview', breadcrumb: 'Workspace / Overview', ctaLabel: 'New Assignment' },
  courses: { title: 'Enrolled Courses', breadcrumb: 'Workspace / Courses', ctaLabel: 'Add Course' },
  assignments: { title: 'Assignments', breadcrumb: 'Workspace / Assignments', ctaLabel: 'New Assignment' },
  timetable: { title: 'Weekly Timetable', breadcrumb: 'Workspace / Timetable', ctaLabel: 'Add Session' },
  grades: { title: 'Grades & GPA Evaluation', breadcrumb: 'Workspace / Grades & GPA' },
  focus: { title: 'Focus Timer', breadcrumb: 'Workspace / Focus Sessions' },
  attendance: { title: 'Attendance & Approvals', breadcrumb: 'Workspace / Attendance', ctaLabel: 'Submit Request' },
  settings: { title: 'Profile & Settings', breadcrumb: 'Workspace / Settings' },
};

export function TopBar({
  activeTab,
  onOpenMobileDrawer,
  onPrimaryAction,
}: {
  activeTab: NavTab;
  onOpenMobileDrawer: () => void;
  onPrimaryAction?: () => void;
}) {
  const meta = TAB_TITLES[activeTab];

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
    </header>
  );
}
