import React, { useEffect, useState } from 'react';
import { CheckCircle2, LogIn, LogOut, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAcademic } from '../context/AcademicContext';
import { Avatar } from '../components/Avatar';

export function SettingsView() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const { workspace, updateProfile, resetLocalWorkspace, isAuthenticatedMode } = useAcademic();

  const [name, setName] = useState(workspace.profile.name);
  const [major, setMajor] = useState(workspace.profile.major);
  const [term, setTerm] = useState(workspace.profile.term);
  const [targetGpa, setTargetGpa] = useState(String(workspace.profile.targetGpa));
  const [dailyFocusGoalMinutes, setDailyFocusGoalMinutes] = useState(
    String(workspace.profile.dailyFocusGoalMinutes)
  );
  const [savedNotice, setSavedNotice] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setName(workspace.profile.name);
    setMajor(workspace.profile.major);
    setTerm(workspace.profile.term);
    setTargetGpa(String(workspace.profile.targetGpa));
    setDailyFocusGoalMinutes(String(workspace.profile.dailyFocusGoalMinutes));
  }, [workspace.profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsedGpa = Number(targetGpa);
    const parsedGoal = Number(dailyFocusGoalMinutes);
    if (!name.trim() || !major.trim() || !term.trim()) {
      setFormError('Name, major, and academic term are required.');
      return;
    }
    if (!Number.isFinite(parsedGpa) || parsedGpa < 0 || parsedGpa > 4.0) {
      setFormError('Target GPA must be between 0.00 and 4.00.');
      return;
    }
    if (!Number.isFinite(parsedGoal) || parsedGoal < 15 || parsedGoal > 720) {
      setFormError('Daily focus goal must be between 15 and 720 minutes.');
      return;
    }

    await updateProfile({
      name: name.trim(),
      major: major.trim(),
      term: term.trim(),
      targetGpa: parsedGpa,
      dailyFocusGoalMinutes: parsedGoal,
    });
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm lg:col-span-7">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">Academic Profile</h2>
            <p className="text-xs text-[#64748B]">
              Personalize your degree program, active term, and study goals.
            </p>
          </div>
          {savedNotice && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#065F46]">
              <CheckCircle2 className="h-4 w-4" />
              Profile saved
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div className="flex items-center gap-4 pb-2">
            <Avatar src={user?.photoURL} name={name || workspace.profile.name} size="lg" />
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">
                {name || workspace.profile.name}
              </p>
              <p className="text-xs text-[#64748B]">{user?.email || workspace.profile.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="prof-name" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Full Name
              </label>
              <input
                id="prof-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="prof-term" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Active Term
              </label>
              <input
                id="prof-term"
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="prof-major" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
              Major / Academic Program
            </label>
            <input
              id="prof-major"
              type="text"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="prof-gpa" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Target GPA (0.00–4.00)
              </label>
              <input
                id="prof-gpa"
                type="number"
                step="0.05"
                min={0}
                max={4}
                value={targetGpa}
                onChange={(e) => setTargetGpa(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] tabular-nums focus:border-[#4F46E5] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="prof-focus" className="mb-1.5 block text-xs font-medium text-[#0F172A]">
                Daily Focus Goal (minutes)
              </label>
              <input
                id="prof-focus"
                type="number"
                min={15}
                max={720}
                step={15}
                value={dailyFocusGoalMinutes}
                onChange={(e) => setDailyFocusGoalMinutes(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#0F172A] tabular-nums focus:border-[#4F46E5] focus:outline-none"
              />
            </div>
          </div>

          {formError && <p className="text-xs text-[#BA1A1A]">{formError}</p>}

          <div className="pt-2">
            <button
              type="submit"
              className="h-10 rounded-xl bg-[#4F46E5] px-5 text-sm font-medium text-white shadow-sm hover:bg-[#4338CA]"
            >
              Save Profile
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-6 lg:col-span-5">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-[#0F172A]">Account &amp; Sync</h3>
          <p className="mt-1 text-xs text-[#64748B]">
            {isAuthenticatedMode
              ? `Signed in as ${user?.email}. Your courses, assignments, grades, and sessions sync automatically to your personal workspace.`
              : 'Sign in with Google to synchronize your courses, assignments, grades, and study sessions across devices.'}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {user ? (
              <button
                type="button"
                onClick={() => signOut()}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
              >
                <LogOut className="h-4 w-4 text-[#64748B]" />
                <span>Sign out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#4F46E5] px-4 text-sm font-medium text-white shadow-sm hover:bg-[#4338CA]"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>

        {!isAuthenticatedMode && (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-[#0F172A]">Sample Workspace</h3>
            <p className="mt-1 text-xs text-[#64748B]">
              Restore the initial Fall 2026 sample courses, deadlines, and timetable entries in your local browser preview.
            </p>
            <button
              type="button"
              onClick={resetLocalWorkspace}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              <RotateCcw className="h-4 w-4 text-[#64748B]" />
              <span>Reset Sample Data</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
