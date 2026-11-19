import React, { useMemo, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import { getReferenceTodayIso } from '../data/seedData';
import type { RequestStatus, RequestType } from '../types/academic';
import { calculateAttendanceRate } from '../utils/academicMath';
import { Modal } from '../components/Modal';
import { StatusChip } from '../components/StatusChip';

export function AttendanceView({
  externalModalOpen,
  onCloseExternalModal,
}: {
  externalModalOpen: boolean;
  onCloseExternalModal: () => void;
}) {
  const { workspace, updateCourse, addAcademicRequest, updateRequestStatus } = useAcademic();
  const [localModalOpen, setLocalModalOpen] = useState(false);

  const [courseId, setCourseId] = useState<string>(() =>
    workspace.courses[0] ? String(workspace.courses[0].id) : ''
  );
  const [requestType, setRequestType] = useState<RequestType>('Extension Request');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const modalOpen = externalModalOpen || localModalOpen;

  const courseMap = useMemo(() => {
    const map = new Map<number, (typeof workspace.courses)[number]>();
    for (const c of workspace.courses) map.set(c.id, c);
    return map;
  }, [workspace.courses]);

  const closeModal = () => {
    setLocalModalOpen(false);
    setFormError(null);
    onCloseExternalModal();
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !details.trim()) {
      setFormError('Subject and supporting details are required.');
      return;
    }

    await addAcademicRequest({
      courseId: courseId ? Number(courseId) : null,
      requestType,
      subject: subject.trim(),
      status: 'pending',
      submittedDate: getReferenceTodayIso(),
      details: details.trim(),
    });
    setSubject('');
    setDetails('');
    closeModal();
  };

  const logAttendance = (id: number, attended: number, total: number, present: boolean) => {
    updateCourse(id, {
      attendedClasses: attended + (present ? 1 : 0),
      totalClasses: total + 1,
    });
  };

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
        <div className="border-b border-[#E2E8F0] px-6 py-4">
          <h2 className="text-base font-semibold text-[#0F172A]">Course Attendance Tracker</h2>
          <p className="text-xs text-[#64748B]">
            Maintain at least 85% attendance across lectures and mandatory laboratory sessions.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="h-10 border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <th className="px-6">Course</th>
                <th className="px-6 text-right">Attended</th>
                <th className="px-6 text-right">Rate</th>
                <th className="px-6">Status</th>
                <th className="px-6 text-right">Log Session</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm">
              {workspace.courses.map((course) => {
                const rate = calculateAttendanceRate(course.attendedClasses, course.totalClasses);
                return (
                  <tr key={course.id} className="h-16 transition-colors hover:bg-[#F8FAFC]">
                    <td className="px-6">
                      <p className="font-medium text-[#0F172A]">
                        <span className="font-mono text-xs font-semibold text-[#4F46E5]">
                          {course.code}
                        </span>{' '}
                        · {course.title}
                      </p>
                      <p className="text-xs text-[#64748B]">{course.instructor}</p>
                    </td>
                    <td className="px-6 text-right font-mono text-[#0F172A] tabular-nums">
                      {course.attendedClasses} / {course.totalClasses}
                    </td>
                    <td className="px-6 text-right font-mono font-semibold text-[#0F172A] tabular-nums">
                      {rate.percentage}%
                    </td>
                    <td className="px-6">
                      {rate.status === 'on-track' && <StatusChip tone="success" label="On Track" />}
                      {rate.status === 'warning' && <StatusChip tone="warning" label="Threshold" />}
                      {rate.status === 'critical' && <StatusChip tone="critical" label="At Risk" />}
                    </td>
                    <td className="px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            logAttendance(
                              course.id,
                              course.attendedClasses,
                              course.totalClasses,
                              true
                            )
                          }
                          aria-label={`Log present for ${course.code}`}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs font-medium text-[#065F46] hover:bg-[#ECFDF5]"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Present</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            logAttendance(
                              course.id,
                              course.attendedClasses,
                              course.totalClasses,
                              false
                            )
                          }
                          aria-label={`Log absent for ${course.code}`}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs font-medium text-[#991B1B] hover:bg-[#FEF2F2]"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Absent</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">
              Academic Requests &amp; Approvals
            </h2>
            <p className="text-xs text-[#64748B]">
              Track assignment extensions, lab section swaps, and rubric grade reviews.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLocalModalOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC] whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5 text-[#4F46E5]" />
            <span>Submit Request</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="h-10 border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <th className="px-6">Subject</th>
                <th className="px-6">Type</th>
                <th className="px-6">Course</th>
                <th className="px-6">Submitted</th>
                <th className="px-6">Status</th>
                <th className="px-6 text-right">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm">
              {workspace.academicRequests.map((req) => {
                const course = req.courseId ? courseMap.get(req.courseId) : null;
                return (
                  <tr key={req.id} className="h-16 transition-colors hover:bg-[#F8FAFC]">
                    <td className="px-6">
                      <p className="font-medium text-[#0F172A]">{req.subject}</p>
                      <p className="max-w-md truncate text-xs text-[#64748B]">{req.details}</p>
                    </td>
                    <td className="px-6 text-xs text-[#64748B]">{req.requestType}</td>
                    <td className="px-6">
                      <span className="font-mono text-xs font-semibold text-[#4F46E5]">
                        {course?.code ?? 'General'}
                      </span>
                    </td>
                    <td className="px-6 text-xs text-[#64748B] tabular-nums">{req.submittedDate}</td>
                    <td className="px-6">
                      {req.status === 'approved' && <StatusChip tone="success" label="Approved" />}
                      {req.status === 'pending' && <StatusChip tone="warning" label="Pending" />}
                      {req.status === 'needs-review' && (
                        <StatusChip tone="critical" label="Needs Review" />
                      )}
                    </td>
                    <td className="px-6 text-right">
                      <select
                        value={req.status}
                        aria-label={`Update status for ${req.subject}`}
                        onChange={(e) =>
                          updateRequestStatus(req.id, e.target.value as RequestStatus)
                        }
                        className="h-8 rounded-lg border border-[#E2E8F0] bg-white px-2 text-xs text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="needs-review">Needs Review</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={modalOpen}
        title="Submit Academic Request"
        description="Log a formal extension, lab swap, attendance excuse, or grade review."
        onClose={closeModal}
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="req-type" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Request Type
              </label>
              <select
                id="req-type"
                value={requestType}
                onChange={(e) => setRequestType(e.target.value as RequestType)}
                className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
              >
                <option value="Extension Request">Extension Request</option>
                <option value="Lab Swap">Lab Swap</option>
                <option value="Grade Review">Grade Review</option>
                <option value="Attendance Excuse">Attendance Excuse</option>
              </select>
            </div>

            <div>
              <label htmlFor="req-course" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Course
              </label>
              <select
                id="req-course"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
              >
                <option value="">General / Administrative</option>
                {workspace.courses.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.code} — {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="req-subject" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
              Subject
            </label>
            <input
              id="req-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Lab 3 Extension Request"
              className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="req-details" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
              Supporting Details
            </label>
            <textarea
              id="req-details"
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Briefly state dates, section numbers, or reasoning."
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
              Submit Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
