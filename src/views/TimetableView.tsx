import React, { useMemo, useState } from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import type { SessionType, Weekday } from '../types/academic';
import { validateTimetableInput } from '../utils/academicMath';
import { Modal } from '../components/Modal';

const WEEKDAYS: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function TimetableView({
  externalModalOpen,
  onCloseExternalModal,
}: {
  externalModalOpen: boolean;
  onCloseExternalModal: () => void;
}) {
  const { workspace, addTimetableSession, deleteTimetableSession } = useAcademic();
  const [selectedDay, setSelectedDay] = useState<Weekday>('Wednesday');
  const [localModalOpen, setLocalModalOpen] = useState(false);

  const [courseId, setCourseId] = useState<string>(() =>
    workspace.courses[0] ? String(workspace.courses[0].id) : ''
  );
  const [dayOfWeek, setDayOfWeek] = useState<Weekday>('Monday');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:30');
  const [location, setLocation] = useState('');
  const [sessionType, setSessionType] = useState<SessionType>('Lecture');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const modalOpen = externalModalOpen || localModalOpen;

  const courseMap = useMemo(() => {
    const map = new Map<number, (typeof workspace.courses)[number]>();
    for (const c of workspace.courses) map.set(c.id, c);
    return map;
  }, [workspace.courses]);

  const sessionsByDay = useMemo(() => {
    const grouped: Record<Weekday, typeof workspace.timetableSessions> = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
    };
    for (const session of workspace.timetableSessions) {
      if (grouped[session.dayOfWeek]) {
        grouped[session.dayOfWeek].push(session);
      }
    }
    for (const day of WEEKDAYS) {
      grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return grouped;
  }, [workspace.timetableSessions]);

  const openModal = () => {
    setCourseId(workspace.courses[0] ? String(workspace.courses[0].id) : '');
    setDayOfWeek(selectedDay);
    setStartTime('10:00');
    setEndTime('11:30');
    setLocation('');
    setSessionType('Lecture');
    setFormErrors({});
    setLocalModalOpen(true);
  };

  const closeModal = () => {
    setLocalModalOpen(false);
    setFormErrors({});
    onCloseExternalModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedCourseId = courseId ? Number(courseId) : workspace.courses[0]?.id ?? null;
    const check = validateTimetableInput({
      courseId: resolvedCourseId,
      startTime,
      endTime,
      location,
    });
    if (!check.valid) {
      setFormErrors(check.errors);
      return;
    }

    await addTimetableSession({
      courseId: resolvedCourseId!,
      dayOfWeek,
      startTime,
      endTime,
      location: location.trim(),
      sessionType,
    });
    closeModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-[#64748B]">
          {workspace.profile.term} weekly class schedule ·{' '}
          <span className="font-medium text-[#0F172A] tabular-nums">
            {workspace.timetableSessions.length} weekly sessions
          </span>
        </p>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-[#E2E8F0] bg-[#F1F5F9] p-1 md:hidden">
        {WEEKDAYS.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => setSelectedDay(day)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
              selectedDay === day ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B]'
            }`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {WEEKDAYS.map((day) => {
          const daySessions = sessionsByDay[day];
          const hiddenOnMobile = day !== selectedDay ? 'hidden md:block' : 'block';
          return (
            <div
              key={day}
              className={`${hiddenOnMobile} rounded-xl border border-[#E2E8F0] bg-white shadow-sm`}
            >
              <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                <h3 className="text-sm font-semibold text-[#0F172A]">{day}</h3>
                <span className="font-mono text-xs text-[#64748B] tabular-nums">
                  {daySessions.length}
                </span>
              </div>

              <div className="divide-y divide-[#E2E8F0]">
                {daySessions.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-[#64748B]">
                    No sessions
                  </div>
                ) : (
                  daySessions.map((session) => {
                    const course = courseMap.get(session.courseId);
                    return (
                      <div key={session.id} className="group p-4 transition-colors hover:bg-[#F8FAFC]">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-xs font-semibold text-[#4F46E5]">
                            {course?.code ?? 'Course'}
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteTimetableSession(session.id)}
                            aria-label={`Remove ${course?.code ?? 'course'} ${session.dayOfWeek} session`}
                            className="flex h-6 w-6 items-center justify-center rounded text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#991B1B]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-1 text-sm font-medium text-[#0F172A] leading-snug">
                          {course?.title ?? 'Academic Session'}
                        </p>
                        <p className="mt-2 font-mono text-xs text-[#0F172A] tabular-nums">
                          {session.startTime} – {session.endTime}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-[#64748B]">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {session.sessionType} · {session.location}
                          </span>
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={modalOpen}
        title="Add Timetable Session"
        description="Schedule a recurring lecture, lab, seminar, or tutorial."
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="tt-course" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Course
              </label>
              <select
                id="tt-course"
                value={courseId || (workspace.courses[0]?.id ? String(workspace.courses[0].id) : '')}
                onChange={(e) => setCourseId(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
              >
                {workspace.courses.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.code} — {c.title}
                  </option>
                ))}
              </select>
              {formErrors.courseId && (
                <p className="mt-1 text-xs text-[#BA1A1A]">{formErrors.courseId}</p>
              )}
            </div>

            <div>
              <label htmlFor="tt-day" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Weekday
              </label>
              <select
                id="tt-day"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value as Weekday)}
                className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
              >
                {WEEKDAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="tt-start" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Start Time
              </label>
              <input
                id="tt-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="tt-end" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                End Time
              </label>
              <input
                id="tt-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
              />
              {formErrors.endTime && (
                <p className="mt-1 text-xs text-[#BA1A1A]">{formErrors.endTime}</p>
              )}
            </div>

            <div>
              <label htmlFor="tt-type" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Session Type
              </label>
              <select
                id="tt-type"
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value as SessionType)}
                className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
              >
                <option value="Lecture">Lecture</option>
                <option value="Lab">Lab</option>
                <option value="Seminar">Seminar</option>
                <option value="Tutorial">Tutorial</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="tt-location" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
              Location / Room
            </label>
            <input
              id="tt-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Gates Hall 302"
              className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
            />
            {formErrors.location && (
              <p className="mt-1 text-xs text-[#BA1A1A]">{formErrors.location}</p>
            )}
          </div>

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
              Add Session
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
