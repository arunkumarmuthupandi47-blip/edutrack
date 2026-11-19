import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckSquare,
  Clock,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MoreHorizontal,
  Settings,
  UserCheck,
  X,
} from 'lucide-react';
import type { NavTab } from '../types/academic';
import { useAuth } from '../context/AuthContext';
import { useAcademic } from '../context/AcademicContext';
import { Avatar } from './Avatar';

export const NAV_ITEMS: Array<{
  id: NavTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}> = [
  { id: 'overview', label: 'Overview', shortLabel: 'Overview', icon: LayoutDashboard },
  { id: 'courses', label: 'Courses', shortLabel: 'Courses', icon: BookOpen },
  { id: 'assignments', label: 'Assignments', shortLabel: 'Tasks', icon: CheckSquare },
  { id: 'timetable', label: 'Timetable', shortLabel: 'Schedule', icon: CalendarDays },
  { id: 'grades', label: 'Grades & GPA', shortLabel: 'Grades', icon: Award },
  { id: 'focus', label: 'Focus Timer', shortLabel: 'Focus', icon: Clock },
  { id: 'attendance', label: 'Attendance', shortLabel: 'Attend', icon: UserCheck },
  { id: 'settings', label: 'Settings', shortLabel: 'Settings', icon: Settings },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
}: {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const { user, signInWithGoogle, signOut } = useAuth();
  const { workspace } = useAcademic();
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  const handleSelect = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
    setMoreSheetOpen(false);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white px-4 py-5">
      <div>
        <div className="flex items-center justify-between px-2 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4F46E5] text-white">
              <GraduationCap className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <span className="text-base font-bold tracking-tight text-[#0F172A] whitespace-nowrap">
              Academic Focus
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation drawer"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F1F5F9] lg:hidden"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <nav aria-label="Primary Workspace Navigation" className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5] ${
                  isActive
                    ? 'bg-[#EEF2FF] text-[#4F46E5]'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#4F46E5]' : 'text-[#64748B]'}`}
                  strokeWidth={1.6}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-[#E2E8F0] pt-4">
        <div className="flex items-center gap-3 px-2 pb-3">
          <Avatar
            src={user?.photoURL}
            name={user?.displayName || workspace.profile.name}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#0F172A]">
              {user?.displayName || workspace.profile.name}
            </p>
            <p className="truncate text-xs text-[#64748B]">
              {user?.email || workspace.profile.term}
            </p>
          </div>
        </div>

        {user ? (
          <button
            type="button"
            onClick={() => signOut()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-medium text-[#0F172A] transition-colors hover:bg-[#F8FAFC] whitespace-nowrap"
          >
            <LogOut className="h-3.5 w-3.5 text-[#64748B]" strokeWidth={1.75} />
            <span>Sign out</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-medium text-[#0F172A] shadow-sm transition-colors hover:bg-[#F8FAFC] whitespace-nowrap"
          >
            <LogIn className="h-3.5 w-3.5 text-[#4F46E5]" strokeWidth={1.75} />
            <span>Sign in with Google</span>
          </button>
        )}
      </div>
    </div>
  );

  const mobilePrimaryTabs = NAV_ITEMS.slice(0, 4);
  const mobileSecondaryTabs = NAV_ITEMS.slice(4);

  return (
    <>
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64 lg:border-r lg:border-[#E2E8F0]">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/35"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-64 max-w-[80vw] border-r border-[#E2E8F0] bg-white shadow-lg">
            {sidebarContent}
          </aside>
        </div>
      )}

      {moreSheetOpen && (
        <div className="fixed inset-0 z-40 flex items-end md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/35"
            onClick={() => setMoreSheetOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full rounded-t-2xl border-t border-[#E2E8F0] bg-white p-4 pb-20 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#0F172A]">More Sections</span>
              <button
                type="button"
                onClick={() => setMoreSheetOpen(false)}
                aria-label="Close more sections menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F1F5F9]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {mobileSecondaryTabs.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium ${
                      isActive
                        ? 'border-[#C7D2FE] bg-[#EEF2FF] text-[#4F46E5]'
                        : 'border-[#E2E8F0] bg-white text-[#0F172A]'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.6} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav
        aria-label="Mobile Navigation"
        className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-center justify-around border-t border-[#E2E8F0] bg-white px-2 md:hidden"
      >
        {mobilePrimaryTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-medium ${
                isActive ? 'text-[#4F46E5]' : 'text-[#64748B]'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreSheetOpen((v) => !v)}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-medium ${
            mobileSecondaryTabs.some((t) => t.id === activeTab) ? 'text-[#4F46E5]' : 'text-[#64748B]'
          }`}
        >
          <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}

export function MobileDrawerButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open navigation menu"
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] lg:hidden"
    >
      <Menu className="h-4 w-4" strokeWidth={1.75} />
    </button>
  );
}
