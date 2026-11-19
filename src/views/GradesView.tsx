import React, { useMemo, useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import {
  calculateWeightedGpa,
  percentToGradePoint,
  percentToLetterGrade,
} from '../utils/academicMath';
import { StatusChip } from '../components/StatusChip';

export function GradesView() {
  const { workspace, updateCourse } = useAcademic();
  const [simulatedGrades, setSimulatedGrades] = useState<Record<number, number>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const actualGpa = useMemo(
    () => calculateWeightedGpa(workspace.courses),
    [workspace.courses]
  );

  const projectedCourses = useMemo(
    () =>
      workspace.courses.map((c) => ({
        ...c,
        effectiveGrade: simulatedGrades[c.id] ?? c.gradePercent,
      })),
    [workspace.courses, simulatedGrades]
  );

  const projectedGpa = useMemo(
    () =>
      calculateWeightedGpa(
        projectedCourses.map((c) => ({ credits: c.credits, gradePercent: c.effectiveGrade }))
      ),
    [projectedCourses]
  );

  const totalCredits = useMemo(
    () => workspace.courses.reduce((sum, c) => sum + c.credits, 0),
    [workspace.courses]
  );

  const hasSimulation = Object.keys(simulatedGrades).length > 0;

  const handleSaveGrade = async (courseId: number, newGrade: number) => {
    setSavingId(courseId);
    await updateCourse(courseId, { gradePercent: newGrade });
    setSimulatedGrades((prev) => {
      const next = { ...prev };
      delete next[courseId];
      return next;
    });
    setSavingId(null);
  };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-[#64748B]">Recorded GPA</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#0F172A] tabular-nums">
            {actualGpa.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-[#64748B] tabular-nums">
            {actualGpa >= workspace.profile.targetGpa
              ? 'Meeting target threshold'
              : `${(workspace.profile.targetGpa - actualGpa).toFixed(2)} below target`}
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-[#64748B]">What-If Projected GPA</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#4F46E5] tabular-nums">
            {projectedGpa.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-[#64748B] tabular-nums">
            {hasSimulation
              ? `Delta ${projectedGpa - actualGpa >= 0 ? '+' : ''}${(projectedGpa - actualGpa).toFixed(2)}`
              : 'Adjust course sliders below to simulate'}
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-[#64748B]">Target GPA</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#0F172A] tabular-nums">
            {workspace.profile.targetGpa.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-[#64748B]">Configured in academic profile</p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-[#64748B]">Graded Credit Hours</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#0F172A] tabular-nums">
            {totalCredits}
          </p>
          <p className="mt-1 text-xs text-[#64748B] tabular-nums">
            Across {workspace.courses.length} active courses
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">
              Course Grade Ledger &amp; What-If Simulator
            </h2>
            <p className="text-xs text-[#64748B]">
              Test grade scenarios or save updated course percentages directly to your record.
            </p>
          </div>
          {hasSimulation && (
            <button
              type="button"
              onClick={() => setSimulatedGrades({})}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#64748B]" />
              <span>Reset Simulation</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="h-10 border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <th className="px-6">Course</th>
                <th className="px-6 text-right">Credits</th>
                <th className="px-6">Simulated Score</th>
                <th className="px-6 text-right">Letter</th>
                <th className="px-6 text-right">Points</th>
                <th className="px-6">Standing</th>
                <th className="px-6 text-right">Save</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm">
              {projectedCourses.map((course) => {
                const isModified =
                  simulatedGrades[course.id] !== undefined &&
                  simulatedGrades[course.id] !== course.gradePercent;
                const gp = percentToGradePoint(course.effectiveGrade);
                const letter = percentToLetterGrade(course.effectiveGrade);

                return (
                  <tr key={course.id} className="h-16 transition-colors hover:bg-[#F8FAFC]">
                    <td className="px-6">
                      <p className="font-medium text-[#0F172A]">
                        <span className="font-mono text-xs font-semibold text-[#4F46E5]">
                          {course.code}
                        </span>{' '}
                        · {course.title}
                      </p>
                      <p className="text-xs text-[#64748B] tabular-nums">
                        Recorded: {course.gradePercent.toFixed(1)}%
                      </p>
                    </td>
                    <td className="px-6 text-right font-mono text-[#0F172A] tabular-nums">
                      {course.credits}
                    </td>
                    <td className="px-6">
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={50}
                          max={100}
                          step={0.5}
                          value={course.effectiveGrade}
                          aria-label={`Simulate grade for ${course.code}`}
                          onChange={(e) =>
                            setSimulatedGrades((prev) => ({
                              ...prev,
                              [course.id]: Number(e.target.value),
                            }))
                          }
                          className="h-1.5 w-32 accent-[#4F46E5]"
                        />
                        <span className="w-14 font-mono text-xs font-medium text-[#0F172A] tabular-nums">
                          {course.effectiveGrade.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 text-right font-semibold text-[#0F172A]">{letter}</td>
                    <td className="px-6 text-right font-mono text-[#0F172A] tabular-nums">
                      {gp.toFixed(1)}
                    </td>
                    <td className="px-6">
                      {course.effectiveGrade >= 85 ? (
                        <StatusChip tone="success" label="Passing" />
                      ) : course.effectiveGrade >= 75 ? (
                        <StatusChip tone="warning" label="Review" />
                      ) : (
                        <StatusChip tone="critical" label="At Risk" />
                      )}
                    </td>
                    <td className="px-6 text-right">
                      <button
                        type="button"
                        disabled={!isModified || savingId === course.id}
                        onClick={() => handleSaveGrade(course.id, course.effectiveGrade)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs font-medium text-[#0F172A] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Save className="h-3.5 w-3.5 text-[#4F46E5]" />
                        <span>{savingId === course.id ? 'Saving...' : 'Save Grade'}</span>
                      </button>
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
