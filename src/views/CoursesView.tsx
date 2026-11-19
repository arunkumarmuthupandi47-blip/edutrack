import React, { useMemo, useState } from 'react';
import { Edit2, Plus, Search, Trash2 } from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import type { Course } from '../types/academic';
import {
  calculateAttendanceRate,
  percentToLetterGrade,
  validateCourseInput,
} from '../utils/academicMath';
import { Modal } from '../components/Modal';
import { StatusChip } from '../components/StatusChip';

const COURSE_COLORS = ['#4F46E5', '#0D9488', '#D97706', '#2563EB', '#7C3AED', '#DC2626'];

export function CoursesView({
  externalModalOpen,
  onCloseExternalModal,
}: {
  externalModalOpen: boolean;
  onCloseExternalModal: () => void;
}) {
  const { workspace, addCourse, updateCourse, deleteCourse } = useAcademic();
  const [search, setSearch] = useState('');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [localModalOpen, setLocalModalOpen] = useState(false);

  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [instructor, setInstructor] = useState('');
  const [credits, setCredits] = useState('3');
  const [semester, setSemester] = useState(workspace.profile.term || 'Fall 2026');
  const [gradePercent, setGradePercent] = useState('90');
  const [color, setColor] = useState(COURSE_COLORS[0]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const modalOpen = externalModalOpen || localModalOpen;

  const openCreateModal = () => {
    setEditingCourse(null);
    setCode('');
    setTitle('');
    setInstructor('');
    setCredits('3');
    setSemester(workspace.profile.term || 'Fall 2026');
    setGradePercent('90');
    setColor(COURSE_COLORS[0]);
    setFormErrors({});
    setLocalModalOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setCode(course.code);
    setTitle(course.title);
    setInstructor(course.instructor);
    setCredits(String(course.credits));
    setSemester(course.semester);
    setGradePercent(String(course.gradePercent));
    setColor(course.color);
    setFormErrors({});
    setLocalModalOpen(true);
  };

  const closeModal = () => {
    setLocalModalOpen(false);
    setEditingCourse(null);
    setFormErrors({});
    onCloseExternalModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedCredits = Number(credits);
    const parsedGrade = Number(gradePercent);
    const check = validateCourseInput({
      code,
      title,
      instructor,
      credits: parsedCredits,
      gradePercent: parsedGrade,
    });
    if (!check.valid) {
      setFormErrors(check.errors);
      return;
    }

    if (editingCourse) {
      await updateCourse(editingCourse.id, {
        code: code.trim(),
        title: title.trim(),
        instructor: instructor.trim(),
        credits: parsedCredits,
        semester: semester.trim() || 'Fall 2026',
        gradePercent: parsedGrade,
        color,
      });
    } else {
      await addCourse({
        code: code.trim(),
        title: title.trim(),
        instructor: instructor.trim(),
        credits: parsedCredits,
        semester: semester.trim() || 'Fall 2026',
        color,
        gradePercent: parsedGrade,
        attendedClasses: 10,
        totalClasses: 10,
      });
    }
    closeModal();
  };

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return workspace.courses;
    return workspace.courses.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q)
    );
  }, [workspace.courses, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses by code, title, or instructor..."
            aria-label="Search courses"
            className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white pr-3 pl-10 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#4F46E5] focus:ring-3 focus:ring-[#4F46E5]/15 focus:outline-none"
          />
        </div>

        <p className="text-xs font-medium text-[#64748B] tabular-nums">
          Showing {filteredCourses.length} of {workspace.courses.length} enrolled courses
        </p>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-12 text-center shadow-sm">
          <p className="text-base font-semibold text-[#0F172A]">No matching courses</p>
          <p className="mt-1 text-sm text-[#64748B]">
            {workspace.courses.length === 0
              ? 'Enroll in your first course to track assignments, grades, and attendance.'
              : 'Try adjusting your search query.'}
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#4F46E5] px-4 text-sm font-medium text-white shadow-sm hover:bg-[#4338CA]"
          >
            <Plus className="h-4 w-4" />
            <span>Add Course</span>
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="h-10 border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  <th className="px-6">Code</th>
                  <th className="px-6">Course Title</th>
                  <th className="px-6">Instructor</th>
                  <th className="px-6 text-right">Credits</th>
                  <th className="px-6 text-right">Attendance</th>
                  <th className="px-6 text-right">Grade</th>
                  <th className="px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-sm">
                {filteredCourses.map((course) => {
                  const attendance = calculateAttendanceRate(
                    course.attendedClasses,
                    course.totalClasses
                  );
                  const taskCount = workspace.assignments.filter(
                    (a) => a.courseId === course.id && a.status !== 'submitted'
                  ).length;

                  return (
                    <tr
                      key={course.id}
                      className="h-16 transition-colors hover:bg-[#F8FAFC]"
                    >
                      <td className="px-6">
                        <span className="font-mono text-xs font-semibold text-[#4F46E5]">
                          {course.code}
                        </span>
                      </td>
                      <td className="px-6">
                        <p className="font-medium text-[#0F172A]">{course.title}</p>
                        <p className="text-xs text-[#64748B]">
                          {course.semester} · {taskCount} open tasks
                        </p>
                      </td>
                      <td className="px-6 text-[#64748B]">{course.instructor}</td>
                      <td className="px-6 text-right font-mono text-[#0F172A] tabular-nums">
                        {course.credits}
                      </td>
                      <td className="px-6 text-right">
                        <StatusChip
                          tone={
                            attendance.status === 'on-track'
                              ? 'success'
                              : attendance.status === 'warning'
                                ? 'warning'
                                : 'critical'
                          }
                          label={`${attendance.percentage}%`}
                        />
                      </td>
                      <td className="px-6 text-right font-medium text-[#0F172A] tabular-nums">
                        {course.gradePercent.toFixed(1)}% · {percentToLetterGrade(course.gradePercent)}
                      </td>
                      <td className="px-6 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(course)}
                            aria-label={`Edit '${course.code}'`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                          >
                            <Edit2 className="h-4 w-4" strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCourse(course.id)}
                            aria-label={`Delete '${course.code}'`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#FEF2F2] hover:text-[#991B1B]"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                          </button>
                        </div>
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
        title={editingCourse ? `Edit ${editingCourse.code}` : 'Add New Course'}
        description="Maintain accurate credits and instructors for GPA and timetable tracking."
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="course-code" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Course Code
              </label>
              <input
                id="course-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CS 410"
                className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:ring-3 focus:ring-[#4F46E5]/15 focus:outline-none"
              />
              {formErrors.code && <p className="mt-1 text-xs text-[#BA1A1A]">{formErrors.code}</p>}
            </div>

            <div>
              <label htmlFor="course-credits" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Credits (1–6)
              </label>
              <input
                id="course-credits"
                type="number"
                min={1}
                max={6}
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] tabular-nums focus:border-[#4F46E5] focus:ring-3 focus:ring-[#4F46E5]/15 focus:outline-none"
              />
              {formErrors.credits && (
                <p className="mt-1 text-xs text-[#BA1A1A]">{formErrors.credits}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="course-title" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
              Course Title
            </label>
            <input
              id="course-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Systems"
              className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:ring-3 focus:ring-[#4F46E5]/15 focus:outline-none"
            />
            {formErrors.title && <p className="mt-1 text-xs text-[#BA1A1A]">{formErrors.title}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="course-instructor" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Instructor
              </label>
              <input
                id="course-instructor"
                type="text"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                placeholder="e.g. Dr. Alan Sterling"
                className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:ring-3 focus:ring-[#4F46E5]/15 focus:outline-none"
              />
              {formErrors.instructor && (
                <p className="mt-1 text-xs text-[#BA1A1A]">{formErrors.instructor}</p>
              )}
            </div>

            <div>
              <label htmlFor="course-grade" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Current Grade (%)
              </label>
              <input
                id="course-grade"
                type="number"
                step="0.1"
                min={0}
                max={100}
                value={gradePercent}
                onChange={(e) => setGradePercent(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] tabular-nums focus:border-[#4F46E5] focus:ring-3 focus:ring-[#4F46E5]/15 focus:outline-none"
              />
              {formErrors.gradePercent && (
                <p className="mt-1 text-xs text-[#BA1A1A]">{formErrors.gradePercent}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="course-semester" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Semester
              </label>
              <input
                id="course-semester"
                type="text"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:ring-3 focus:ring-[#4F46E5]/15 focus:outline-none"
              />
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-medium text-[#0F172A]">Accent Color</span>
              <div className="flex h-10 items-center gap-2">
                {COURSE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Select color ${c}`}
                    className={`h-6 w-6 rounded-full border-2 transition-transform ${
                      color === c ? 'scale-110 border-[#0F172A]' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
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
              {editingCourse ? 'Save Changes' : 'Create Course'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
