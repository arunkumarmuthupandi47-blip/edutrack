import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AcademicProvider, useAcademic } from './context/AcademicContext';
import type { NavTab } from './types/academic';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { OverviewView } from './views/OverviewView';
import { CoursesView } from './views/CoursesView';
import { AssignmentsView } from './views/AssignmentsView';
import { TimetableView } from './views/TimetableView';
import { GradesView } from './views/GradesView';
import { FocusTimerView } from './views/FocusTimerView';
import { AttendanceView } from './views/AttendanceView';
import { SettingsView } from './views/SettingsView';

function WorkspaceShell() {
  const { authError, clearAuthError } = useAuth();
  const { loading, error, dismissError } = useAcademic();

  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [timetableModalOpen, setTimetableModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  const handlePrimaryAction = () => {
    if (activeTab === 'overview') {
      setActiveTab('assignments');
      setAssignmentModalOpen(true);
      return;
    }
    if (activeTab === 'courses') {
      setCourseModalOpen(true);
      return;
    }
    if (activeTab === 'assignments') {
      setAssignmentModalOpen(true);
      return;
    }
    if (activeTab === 'timetable') {
      setTimetableModalOpen(true);
      return;
    }
    if (activeTab === 'attendance') {
      setRequestModalOpen(true);
    }
  };

  const activeBannerError = error || authError;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        mobileOpen={mobileDrawerOpen}
        onCloseMobile={() => setMobileDrawerOpen(false)}
      />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <TopBar
          activeTab={activeTab}
          onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
          onPrimaryAction={handlePrimaryAction}
        />

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-10">
          {activeBannerError && (
            <div
              role="alert"
              className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{activeBannerError}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  dismissError();
                  clearAuthError();
                }}
                aria-label="Dismiss error notification"
                className="rounded-lg p-1 hover:bg-[#FEE2E2]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-6" aria-busy="true" aria-label="Loading workspace">
              <div className="h-24 animate-pulse rounded-xl border border-[#E2E8F0] bg-white" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-28 animate-pulse rounded-xl border border-[#E2E8F0] bg-white"
                  />
                ))}
              </div>
              <div className="h-72 animate-pulse rounded-xl border border-[#E2E8F0] bg-white" />
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewView onNavigate={setActiveTab} />
              )}
              {activeTab === 'courses' && (
                <CoursesView
                  externalModalOpen={courseModalOpen}
                  onCloseExternalModal={() => setCourseModalOpen(false)}
                />
              )}
              {activeTab === 'assignments' && (
                <AssignmentsView
                  externalModalOpen={assignmentModalOpen}
                  onCloseExternalModal={() => setAssignmentModalOpen(false)}
                />
              )}
              {activeTab === 'timetable' && (
                <TimetableView
                  externalModalOpen={timetableModalOpen}
                  onCloseExternalModal={() => setTimetableModalOpen(false)}
                />
              )}
              {activeTab === 'grades' && <GradesView />}
              {activeTab === 'focus' && <FocusTimerView />}
              {activeTab === 'attendance' && (
                <AttendanceView
                  externalModalOpen={requestModalOpen}
                  onCloseExternalModal={() => setRequestModalOpen(false)}
                />
              )}
              {activeTab === 'settings' && <SettingsView />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AcademicProvider>
        <WorkspaceShell />
      </AcademicProvider>
    </AuthProvider>
  );
}
