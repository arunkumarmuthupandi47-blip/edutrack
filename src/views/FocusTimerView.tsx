import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Pause, Play, RotateCcw } from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import { getReferenceTodayIso } from '../data/seedData';
import { formatClockTime, formatFocusDuration } from '../utils/academicMath';

type TimerMode = 'focus' | 'short-break' | 'long-break';

const MODE_CONFIG: Record<TimerMode, { label: string; minutes: number }> = {
  focus: { label: 'Focus · 25m', minutes: 25 },
  'short-break': { label: 'Short Break · 5m', minutes: 5 },
  'long-break': { label: 'Long Break · 15m', minutes: 15 },
};

export function FocusTimerView() {
  const { workspace, logFocusSession } = useAcademic();
  const [mode, setMode] = useState<TimerMode>('focus');
  const [secondsLeft, setSecondsLeft] = useState(MODE_CONFIG.focus.minutes * 60);
  const [running, setRunning] = useState(false);
  const [courseId, setCourseId] = useState<string>(() =>
    workspace.courses[0] ? String(workspace.courses[0].id) : ''
  );
  const [topic, setTopic] = useState('Problem Set & Reading');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const courseMap = useMemo(() => {
    const map = new Map<number, (typeof workspace.courses)[number]>();
    for (const c of workspace.courses) map.set(c.id, c);
    return map;
  }, [workspace.courses]);

  const totalMinutesLogged = useMemo(
    () => workspace.focusSessions.reduce((sum, s) => sum + s.durationMinutes, 0),
    [workspace.focusSessions]
  );

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const switchMode = (nextMode: TimerMode) => {
    setRunning(false);
    setMode(nextMode);
    setSecondsLeft(MODE_CONFIG[nextMode].minutes * 60);
  };

  const handleLogSession = async () => {
    const configuredMinutes = MODE_CONFIG[mode].minutes;
    const elapsedMinutes = Math.max(
      1,
      Math.round((configuredMinutes * 60 - secondsLeft) / 60) || configuredMinutes
    );
    const resolvedCourseId = courseId ? Number(courseId) : null;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    await logFocusSession({
      courseId: resolvedCourseId,
      label: topic.trim() || 'Focused Study Block',
      durationMinutes: elapsedMinutes,
      completedAt: `${getReferenceTodayIso()} ${hh}:${mm}`,
    });

    setRunning(false);
    setSecondsLeft(configuredMinutes * 60);
    setFeedbackMessage(`Logged ${elapsedMinutes}m session.`);
    window.setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const progressPct = Math.round(
    ((MODE_CONFIG[mode].minutes * 60 - secondsLeft) / (MODE_CONFIG[mode].minutes * 60)) * 100
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm lg:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div
            className="inline-flex items-center gap-1 rounded-xl border border-[#E2E8F0] bg-[#F1F5F9] p-1"
            role="tablist"
            aria-label="Focus timer mode"
          >
            {(Object.keys(MODE_CONFIG) as TimerMode[]).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={mode === key}
                onClick={() => switchMode(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  mode === key
                    ? 'bg-white text-[#0F172A] shadow-sm'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {MODE_CONFIG[key].label}
              </button>
            ))}
          </div>

          {feedbackMessage && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#065F46]">
              <CheckCircle2 className="h-4 w-4" />
              {feedbackMessage}
            </span>
          )}
        </div>

        <div className="py-10 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-[#64748B]">
            {mode === 'focus' ? 'Deep Study Session' : 'Recovery Break'}
          </p>
          <p
            data-testid="focus-clock"
            className="mt-3 font-mono text-6xl font-bold tracking-tight text-[#0F172A] tabular-nums sm:text-7xl"
          >
            {formatClockTime(secondsLeft)}
          </p>
          <div className="mx-auto mt-6 h-2 max-w-md overflow-hidden rounded-full bg-[#F1F5F9]">
            <div
              className="h-full rounded-full bg-[#4F46E5] transition-all"
              style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-[#E2E8F0] pt-6 sm:grid-cols-2">
          <div>
            <label htmlFor="focus-course" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
              Linked Course
            </label>
            <select
              id="focus-course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
            >
              <option value="">General Study</option>
              {workspace.courses.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.code} — {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="focus-topic" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
              Study Topic
            </label>
            <input
              id="focus-topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What are you focusing on?"
              className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#4F46E5] px-6 text-sm font-medium text-white shadow-sm hover:bg-[#4338CA] whitespace-nowrap"
          >
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{running ? 'Pause Timer' : 'Start Timer'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRunning(false);
              setSecondsLeft(MODE_CONFIG[mode].minutes * 60);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC] whitespace-nowrap"
          >
            <RotateCcw className="h-4 w-4 text-[#64748B]" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleLogSession}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC] whitespace-nowrap"
          >
            <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
            <span>Log Session Now</span>
          </button>
        </div>
      </section>

      <section className="space-y-6 lg:col-span-5">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <p className="text-xs font-medium text-[#64748B]">Daily Focus Progress</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-3xl font-bold text-[#0F172A] tabular-nums">
              {formatFocusDuration(totalMinutesLogged)}
            </p>
            <p className="text-xs text-[#64748B] tabular-nums">
              Goal: {formatFocusDuration(workspace.profile.dailyFocusGoalMinutes)}
            </p>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
            <div
              className="h-full rounded-full bg-[#4F46E5] transition-all"
              style={{
                width: `${Math.min(
                  100,
                  Math.round(
                    (totalMinutesLogged / Math.max(1, workspace.profile.dailyFocusGoalMinutes)) * 100
                  )
                )}%`,
              }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="border-b border-[#E2E8F0] px-6 py-4">
            <h3 className="text-base font-semibold text-[#0F172A]">Recent Study Sessions</h3>
          </div>
          <div className="divide-y divide-[#E2E8F0]">
            {workspace.focusSessions.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#64748B]">
                No focus sessions logged yet.
              </div>
            ) : (
              workspace.focusSessions.slice(0, 6).map((session) => {
                const course = session.courseId ? courseMap.get(session.courseId) : null;
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between gap-4 px-6 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#0F172A]">{session.label}</p>
                      <p className="mt-0.5 truncate text-xs text-[#64748B]">
                        {course ? (
                          <span className="font-mono font-medium text-[#4F46E5]">
                            {course.code}
                          </span>
                        ) : (
                          'General'
                        )}
                        {' · '}
                        <span className="tabular-nums">{session.completedAt}</span>
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-xs font-semibold text-[#0F172A] tabular-nums">
                      {session.durationMinutes}m
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
