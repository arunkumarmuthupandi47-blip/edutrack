import React, { useMemo } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Clock,
  Play,
} from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import { getReferenceTodayIso } from '../data/seedData';
import type { NavTab } from '../types/academic';
import {
  calculateAttendanceRate,
  calculateWeightedGpa,
  classifyAssignmentUrgency,
  formatFocusDuration,
  percentToLetterGrade,
} from '../utils/academicMath';
import { StatusChip } from '../components/StatusChip';

export function OverviewView({
  onNavigate,
}: {
  onNavigate: (tab: NavTab) => void;
}) {
  const { workspace, updateAssignment } = useAcademic();
  const todayIso = getReferenceTodayIso();

  const courseMap = useMemo(() => {
    const map = new Map<number, (typeof workspace.courses)[number]>();
    for (const c of workspace.courses) {
      map.set(c.id, c);
    }
    return map;
  }, [workspace.courses]);

  const cumulativeGpa = useMemo(
    () => calculateWeightedGpa(workspace.courses),
    [workspace.courses]
  );

  const pendingAssignments = useMemo(
    () =>
      workspace.assignments.filter((a) => a.status !== 'submitted').sort((a, b) =>
        a.dueDate.localeCompare(b.dueDate)
      ),
    [workspace.assignments]
  );

  const overdueCount = useMemo(
    () =>
      pendingAssignments.filter(
        (a) => classifyAssignmentUrgency(a, todayIso) === 'overdue'
      ).length,
    [pendingAssignments, todayIso]
  );

  const totalFocusMinutes = useMemo(
    () => workspace.focusSessions.reduce((sum, s) => sum + s.durationMinutes, 0),
    [workspace.focusSessions]
  );

  const wednesdaySessions = useMemo(
    () =>
      workspace.timetableSessions
        .filter((s) => s.dayOfWeek === 'Wednesday')
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [workspace.timetableSessions]
  );

  const toggleSubmitted = (id: number, currentStatus: 'pending' | 'submitted') => {
    updateAssignment(id, {
      status: currentStatus === 'submitted' ? 'pending' : 'submitted',
    });
  };

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#0F172A]">
            Welcome back, {workspace.profile.name.split(' ')[0]}
          </h2>
          <p className="mt-1 text-sm text-[#64748B]">
            {workspace.profile.major} · {workspace.profile.term} · Target GPA{' '}
            <span className="font-mono font-medium text-[#0F172A] tabular-nums">
              {workspace.profile.targetGpa.toFixed(2)}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('focus')}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-medium text-[#0F172A] transition-colors hover:bg-[#F8FAFC] whitespace-nowrap"
          >
            <Play className="h-4 w-4 text-[#4F46E5]" strokeWidth={1.75} />
            <span>Start Focus Session</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('grades')}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-medium text-[#0F172A] transition-colors hover:bg-[#F8FAFC] whitespace-nowrap"
          >
            <span>Evaluate GPA</span>
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-[#64748B]">Active Courses</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#0F172A] tabular-nums">
            {workspace.courses.length}
          </p>
          <p className="mt-1 text-xs text-[#64748B] tabular-nums">
            {workspace.courses.reduce((sum, c) => sum + c.credits, 0)} total credit hours
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-[#64748B]">Cumulative GPA</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#0F172A] tabular-nums">
            {cumulativeGpa.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-[#64748B] tabular-nums">
            Target {workspace.profile.targetGpa.toFixed(2)} scale
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-[#64748B]">Pending Deadlines</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#0F172A] tabular-nums">
            {pendingAssignments.length}
          </p>
          <p className="mt-1 text-xs text-[#64748B] tabular-nums">
            {overdueCount > 0 ? `${overdueCount} overdue requiring review` : 'All deadlines on schedule'}
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-[#64748B]">Focus Time Logged</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#0F172A] tabular-nums">
            {formatFocusDuration(totalFocusMinutes)}
          </p>
          <p className="mt-1 text-xs text-[#64748B] tabular-nums">
            {workspace.focusSessions.length} completed deep-work blocks
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm lg:col-span-7">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
            <div>
              <h3 className="text-base font-semibold text-[#0F172A]">Upcoming Deadlines</h3>
              <p className="text-xs text-[#64748B]">Mark tasks complete or review due thresholds</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('assignments')}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#4F46E5] hover:text-[#4338CA] whitespace-nowrap"
            >
              <span>View all</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {workspace.assignments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-[#0F172A]">No assignments logged yet</p>
              <p className="mt-1 text-xs text-[#64748B]">
                Add your first deliverable to begin tracking deadlines.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {workspace.assignments.slice(0, 5).map((item) => {
                const course = courseMap.get(item.courseId);
                const urgency = classifyAssignmentUrgency(item, todayIso);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 px-6 py-3.5 transition-colors hover:bg-[#F8FAFC]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleSubmitted(item.id, item.status)}
                        aria-label={
                          item.status === 'submitted'
                            ? `Mark '${item.title}' pending`
                            : `Mark '${item.title}' submitted`
                        }
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          item.status === 'submitted'
                            ? 'border-[#4F46E5] bg-[#4F46E5] text-white'
                            : 'border-[#CBD5E1] bg-white hover:border-[#4F46E5]'
                        }`}
                      >
                        {item.status === 'submitted' && <Check className="h-3 w-3" strokeWidth={2.5} />}
                      </button>
                      <div className="min-w-0">
                        <p
                          className={`truncate text-sm font-medium ${
                            item.status === 'submitted'
                              ? 'text-[#64748B] line-through'
                              : 'text-[#0F172A]'
                          }`}
                        >
                          {item.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-[#64748B]">
                          <span className="font-mono font-medium text-[#0F172A]">
                            {course?.code ?? 'Course'}
                          </span>
                          {' · '}
                          <span className="tabular-nums">
                            Due {item.dueDate} at {item.dueTime}
                          </span>
                          {' · '}
                          <span className="tabular-nums">{item.weightPercent}% weight</span>
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {urgency === 'submitted' && <StatusChip tone="success" label="Submitted" />}
                      {urgency === 'due-soon' && <StatusChip tone="warning" label="Due Soon" />}
                      {urgency === 'overdue' && (
                        <StatusChip
                          tone="critical"
                          label="Overdue"
                          icon={<AlertCircle className="h-3 w-3" />}
                        />
                      )}
                      {urgency === 'pending' && <StatusChip tone="neutral" label="Pending" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#0F172A]">Today&apos;s Classes</h3>
                <p className="text-xs text-[#64748B]">Wednesday schedule overview</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('timetable')}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#4F46E5] hover:text-[#4338CA] whitespace-nowrap"
              >
                <span>Timetable</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {wednesdaySessions.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#64748B]">
                  No classes scheduled for Wednesday.
                </div>
              ) : (
                wednesdaySessions.map((session) => {
                  const course = courseMap.get(session.courseId);
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between gap-4 px-6 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#0F172A]">
                          <span className="font-mono">{course?.code}</span> · {course?.title}
                        </p>
                        <p className="mt-0.5 text-xs text-[#64748B]">
                          {session.sessionType} · {session.location}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-xs font-medium text-[#0F172A] tabular-nums">
                        {session.startTime}–{session.endTime}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
                  <Clock className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#0F172A]">Daily Focus Target</h3>
                  <p className="text-xs text-[#64748B] tabular-nums">
                    {totalFocusMinutes} of {workspace.profile.dailyFocusGoalMinutes} min logged
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('focus')}
                className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC] whitespace-nowrap"
              >
                Open Timer
              </button>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
              <div
                className="h-full rounded-full bg-[#4F46E5] transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (totalFocusMinutes / Math.max(1, workspace.profile.dailyFocusGoalMinutes)) * 100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
          <h3 className="text-base font-semibold text-[#0F172A]">Active Courses</h3>
          <button
            type="button"
            onClick={() => onNavigate('courses')}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#4F46E5] hover:text-[#4338CA] whitespace-nowrap"
          >
            <span>Manage courses</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="h-10 border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <th className="px-6">Course</th>
                <th className="px-6">Instructor</th>
                <th className="px-6 text-right">Credits</th>
                <th className="px-6 text-right">Attendance</th>
                <th className="px-6 text-right">Current Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm">
              {workspace.courses.map((course) => {
                const attendance = calculateAttendanceRate(
                  course.attendedClasses,
                  course.totalClasses
                );
                return (
                  <tr
                    key={course.id}
                    className="h-[52px] transition-colors hover:bg-[#F8FAFC]"
                  >
                    <td className="px-6">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-semibold text-[#4F46E5]">
                          {course.code}
                        </span>
                        <span className="font-medium text-[#0F172A]">{course.title}</span>
                      </div>
                    </td>
                    <td className="px-6 text-[#64748B]">{course.instructor}</td>
                    <td className="px-6 text-right font-mono text-[#0F172A] tabular-nums">
                      {course.credits}
                    </td>
                    <td className="px-6 text-right tabular-nums">
                      <span
                        className={
                          attendance.status === 'on-track'
                            ? 'text-[#065F46] font-medium'
                            : 'text-[#92400E] font-medium'
                        }
                      >
                        {attendance.percentage}%
                      </span>
                    </td>
                    <td className="px-6 text-right font-medium text-[#0F172A] tabular-nums">
                      {course.gradePercent.toFixed(1)}% ({percentToLetterGrade(course.gradePercent)})
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
