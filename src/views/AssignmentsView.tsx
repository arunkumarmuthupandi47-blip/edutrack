import React, { useMemo, useState } from 'react';
import { AlertCircle, Check, Plus, Search, Trash2 } from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import { getReferenceTodayIso } from '../data/seedData';
import type { AssignmentPriority, AssignmentUrgency } from '../types/academic';
import { classifyAssignmentUrgency, validateAssignmentInput } from '../utils/academicMath';
import { Modal } from '../components/Modal';
import { StatusChip } from '../components/StatusChip';

type FilterTab = 'all' | AssignmentUrgency;

export function AssignmentsView({
  externalModalOpen,
  onCloseExternalModal,
}: {
  externalModalOpen: boolean;
  onCloseExternalModal: () => void;
}) {
  const { workspace, addAssignment, updateAssignment, deleteAssignment } = useAcademic();
  const todayIso = getReferenceTodayIso();

  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [localModalOpen, setLocalModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState<string>(() =>
    workspace.courses[0] ? String(workspace.courses[0].id) : ''
  );
  const [dueDate, setDueDate] = useState('2026-11-24');
  const [dueTime, setDueTime] = useState('23:59');
  const [priority, setPriority] = useState<AssignmentPriority>('medium');
  const [weightPercent, setWeightPercent] = useState('15');
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const modalOpen = externalModalOpen || localModalOpen;

  const courseMap = useMemo(() => {
    const map = new Map<number, (typeof workspace.courses)[number]>();
    for (const c of workspace.courses) map.set(c.id, c);
    return map;
  }, [workspace.courses]);

  const counts = useMemo(() => {
    const result = { all: 0, pending: 0, 'due-soon': 0, overdue: 0, submitted: 0 };
    for (const a of workspace.assignments) {
      result.all += 1;
      result[classifyAssignmentUrgency(a, todayIso)] += 1;
    }
    return result;
  }, [workspace.assignments, todayIso]);

  const filteredAssignments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return workspace.assignments
      .filter((a) => {
        const urgency = classifyAssignmentUrgency(a, todayIso);
        if (filterTab !== 'all' && urgency !== filterTab) return false;
        if (courseFilter !== 'all' && String(a.courseId) !== courseFilter) return false;
        if (q) {
          const course = courseMap.get(a.courseId);
          const hay = `${a.title} ${a.notes} ${course?.code ?? ''} ${course?.title ?? ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [workspace.assignments, filterTab, courseFilter, search, todayIso, courseMap]);

  const openModal = () => {
    setTitle('');
    setCourseId(workspace.courses[0] ? String(workspace.courses[0].id) : '');
    setDueDate('2026-11-24');
    setDueTime('23:59');
    setPriority('medium');
    setWeightPercent('15');
    setNotes('');
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
    const selectedCourseId = courseId ? Number(courseId) : workspace.courses[0]?.id ?? null;
    const parsedWeight = Number(weightPercent);

    const validation = validateAssignmentInput({
      title,
      courseId: selectedCourseId,
      dueDate,
      weightPercent: parsedWeight,
    });
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }

    await addAssignment({
      courseId: selectedCourseId!,
      title: title.trim(),
      dueDate,
      dueTime: dueTime || '23:59',
      status: 'pending',
      priority,
      weightPercent: parsedWeight,
      scorePercent: null,
      notes: notes.trim(),
    });
    closeModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-[#E2E8F0] bg-[#F1F5F9] p-1"
          role="tablist"
          aria-label="Filter assignments by status"
        >
          {(
            [
              { id: 'all', label: `All (${counts.all})` },
              { id: 'pending', label: `Pending (${counts.pending})` },
              { id: 'due-soon', label: `Due Soon (${counts['due-soon']})` },
              { id: 'overdue', label: `Overdue (${counts.overdue})` },
              { id: 'submitted', label: `Submitted (${counts.submitted})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={filterTab === tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                filterTab === tab.id
                  ? 'bg-white text-[#0F172A] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assignments..."
              aria-label="Search assignments"
              className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white pr-3 pl-10 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#4F46E5] focus:ring-3 focus:ring-[#4F46E5]/15 focus:outline-none"
            />
          </div>

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            aria-label="Filter by course"
            className="h-10 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
          >
            <option value="all">All Courses</option>
            {workspace.courses.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-12 text-center shadow-sm">
          <p className="text-base font-semibold text-[#0F172A]">No assignments in this view</p>
          <p className="mt-1 text-sm text-[#64748B]">
            Switch filters or create a new assignment to keep your coursework organized.
          </p>
          <button
            type="button"
            onClick={openModal}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#4F46E5] px-4 text-sm font-medium text-white shadow-sm hover:bg-[#4338CA]"
          >
            <Plus className="h-4 w-4" />
            <span>Create Assignment</span>
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="h-10 border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  <th className="w-12 px-4 text-center">Done</th>
                  <th className="px-4">Deliverable</th>
                  <th className="px-4">Course</th>
                  <th className="px-4">Due</th>
                  <th className="px-4 text-right">Weight</th>
                  <th className="px-4">Priority</th>
                  <th className="px-4">Status</th>
                  <th className="px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-sm">
                {filteredAssignments.map((item) => {
                  const course = courseMap.get(item.courseId);
                  const urgency = classifyAssignmentUrgency(item, todayIso);
                  return (
                    <tr
                      key={item.id}
                      className="h-16 transition-colors hover:bg-[#F8FAFC]"
                    >
                      <td className="px-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            updateAssignment(item.id, {
                              status: item.status === 'submitted' ? 'pending' : 'submitted',
                            })
                          }
                          aria-label={
                            item.status === 'submitted'
                              ? `Mark '${item.title}' pending`
                              : `Mark '${item.title}' submitted`
                          }
                          className={`inline-flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                            item.status === 'submitted'
                              ? 'border-[#4F46E5] bg-[#4F46E5] text-white'
                              : 'border-[#CBD5E1] bg-white hover:border-[#4F46E5]'
                          }`}
                        >
                          {item.status === 'submitted' && (
                            <Check className="h-3 w-3" strokeWidth={2.5} />
                          )}
                        </button>
                      </td>
                      <td className="px-4">
                        <p
                          className={`font-medium ${
                            item.status === 'submitted'
                              ? 'text-[#64748B] line-through'
                              : 'text-[#0F172A]'
                          }`}
                        >
                          {item.title}
                        </p>
                        {item.notes && (
                          <p className="max-w-md truncate text-xs text-[#64748B]">{item.notes}</p>
                        )}
                      </td>
                      <td className="px-4">
                        <span className="font-mono text-xs font-semibold text-[#4F46E5]">
                          {course?.code ?? 'Course'}
                        </span>
                      </td>
                      <td className="px-4 text-xs text-[#64748B] tabular-nums whitespace-nowrap">
                        {item.dueDate} · {item.dueTime}
                      </td>
                      <td className="px-4 text-right font-mono text-xs text-[#0F172A] tabular-nums">
                        {item.weightPercent}%
                      </td>
                      <td className="px-4 text-xs capitalize text-[#64748B]">{item.priority}</td>
                      <td className="px-4">
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
                      </td>
                      <td className="px-4 text-right">
                        <button
                          type="button"
                          onClick={() => deleteAssignment(item.id)}
                          aria-label={`Delete '${item.title}'`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#FEF2F2] hover:text-[#991B1B]"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        title="New Assignment"
        description="Log a coursework deliverable, exam, or lab report."
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="assign-title" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
              Assignment Title
            </label>
            <input
              id="assign-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Midterm Research Paper"
              className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:ring-3 focus:ring-[#4F46E5]/15 focus:outline-none"
            />
            {formErrors.title && <p className="mt-1 text-xs text-[#BA1A1A]">{formErrors.title}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="assign-course" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Course
              </label>
              <select
                id="assign-course"
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
              <label htmlFor="assign-weight" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Grade Weight (%)
              </label>
              <input
                id="assign-weight"
                type="number"
                min={0}
                max={100}
                value={weightPercent}
                onChange={(e) => setWeightPercent(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] tabular-nums focus:border-[#4F46E5] focus:ring-3 focus:ring-[#4F46E5]/15 focus:outline-none"
              />
              {formErrors.weightPercent && (
                <p className="mt-1 text-xs text-[#BA1A1A]">{formErrors.weightPercent}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="assign-date" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Due Date
              </label>
              <input
                id="assign-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
              />
              {formErrors.dueDate && (
                <p className="mt-1 text-xs text-[#BA1A1A]">{formErrors.dueDate}</p>
              )}
            </div>

            <div>
              <label htmlFor="assign-time" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Due Time
              </label>
              <input
                id="assign-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="assign-priority" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Priority
              </label>
              <select
                id="assign-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as AssignmentPriority)}
                className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="assign-notes" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
              Notes (Optional)
            </label>
            <input
              id="assign-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Submission requirements or rubric reminders"
              className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
            />
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
              Save Assignment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
