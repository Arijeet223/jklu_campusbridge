'use client'

import { useState } from 'react'
import { X, UserPlus, GraduationCap, Briefcase, CheckCircle2, AlertCircle } from 'lucide-react'

interface RegisterAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onAccountCreated?: (account: any) => void
}

export default function RegisterAccountModal({
  isOpen,
  onClose,
  onAccountCreated,
}: RegisterAccountModalProps) {
  const [accountType, setAccountType] = useState<'student' | 'teacher'>('student')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [rollNo, setRollNo] = useState('')
  const [program, setProgram] = useState('B.Tech CSE')
  const [cgpa, setCgpa] = useState('8.2')
  const [targetRole, setTargetRole] = useState('Backend Engineer')
  const [department, setDepartment] = useState('Computer Science & Engineering')
  const [teacherRole, setTeacherRole] = useState<'FACULTY_MENTOR' | 'PLACEMENT_OFFICER'>('FACULTY_MENTOR')
  const [assignedCohort, setAssignedCohort] = useState('B.Tech CSE 2026 - Section A')

  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const endpoint =
        accountType === 'student'
          ? '/api/v1/auth/register-student'
          : '/api/v1/auth/register-student'

      const payload =
        accountType === 'student'
          ? {
              full_name: fullName,
              email,
              roll_no: rollNo,
              program,
              cohort_year: 2026,
              cgpa: parseFloat(cgpa) || 7.5,
              active_backlogs: 0,
              privacy_shield_mode: 'OPT_IN_DRIVES',
              target_roles: [targetRole],
            }
          : {
              full_name: fullName,
              email,
              role: teacherRole,
              department,
              assigned_cohort: assignedCohort,
              permissions_scope:
                teacherRole === 'PLACEMENT_OFFICER'
                  ? 'INSTITUTION_WIDE_TPO'
                  : 'DEPARTMENT_ADVISEES_ONLY',
            }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error(`Registration failed: ${res.statusText}`)
      }

      const data = await res.json()
      setSuccessMsg(
        accountType === 'student'
          ? `Student ${data.student_id} successfully created and written to Accounts_Students in Excel!`
          : `Staff ${data.staff_id} successfully created and written to Accounts_Teachers in Excel!`
      )

      if (onAccountCreated) {
        onAccountCreated(data)
      }

      setTimeout(() => {
        onClose()
      }, 1600)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account. Make sure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  function json_payload_string(p: any) {
    return JSON.stringify(p)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-primary/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-border-hairline bg-surface p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-border-hairline pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-oxford/10 text-oxford">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-ink-primary">
                Register Demo Account
              </h3>
              <p className="text-xs text-ink-muted">
                Syncs directly to <code className="font-mono text-oxford">campusbridge_db.xlsx</code>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-subtle hover:text-ink-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Account Type Toggle */}
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-canvas p-1 border border-border-hairline">
          <button
            type="button"
            onClick={() => setAccountType('student')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              accountType === 'student'
                ? 'bg-surface text-oxford shadow-xs border border-border-hairline'
                : 'text-ink-muted hover:text-ink-primary'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            Student Account
          </button>
          <button
            type="button"
            onClick={() => setAccountType('teacher')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              accountType === 'teacher'
                ? 'bg-surface text-oxford shadow-xs border border-border-hairline'
                : 'text-ink-muted hover:text-ink-primary'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            Teacher / Officer
          </button>
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-border bg-emerald-surface p-3 text-xs font-medium text-emerald">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-border bg-amber-surface p-3 text-xs font-medium text-amber">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-ink-secondary block mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={accountType === 'student' ? 'e.g., Ishaan Deshmukh' : 'e.g., Dr. Meenakshi Sundaram'}
              className="w-full rounded-lg border border-border-hairline bg-canvas px-3 py-2 text-ink-primary placeholder:text-ink-muted focus:border-oxford focus:outline-hidden"
            />
          </div>

          <div>
            <label className="font-semibold text-ink-secondary block mb-1">University Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@university.edu.in"
              className="w-full rounded-lg border border-border-hairline bg-canvas px-3 py-2 text-ink-primary placeholder:text-ink-muted focus:border-oxford focus:outline-hidden"
            />
          </div>

          {accountType === 'student' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-ink-secondary block mb-1">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    placeholder="22BCON240"
                    className="w-full rounded-lg border border-border-hairline bg-canvas px-3 py-2 text-ink-primary placeholder:text-ink-muted focus:border-oxford focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-ink-secondary block mb-1">CGPA (0 - 10)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    className="w-full rounded-lg border border-border-hairline bg-canvas px-3 py-2 text-ink-primary placeholder:text-ink-muted focus:border-oxford focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-ink-secondary block mb-1">Degree Program</label>
                  <select
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    className="w-full rounded-lg border border-border-hairline bg-canvas px-3 py-2 text-ink-primary focus:border-oxford focus:outline-hidden"
                  >
                    <option value="B.Tech CSE">B.Tech CSE</option>
                    <option value="B.Tech CSE (AI & DS)">B.Tech CSE (AI & DS)</option>
                    <option value="B.Tech ECE (Minor in CS)">B.Tech ECE (Minor in CS)</option>
                    <option value="B.Tech IT">B.Tech IT</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-ink-secondary block mb-1">Target Role</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full rounded-lg border border-border-hairline bg-canvas px-3 py-2 text-ink-primary focus:border-oxford focus:outline-hidden"
                  >
                    <option value="Backend Engineer">Backend Engineer</option>
                    <option value="Applied AI / RAG Engineer">Applied AI / RAG Engineer</option>
                    <option value="Full-Stack Developer">Full-Stack Developer</option>
                    <option value="Data Scientist">Data Scientist</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-ink-secondary block mb-1">Institutional Role</label>
                  <select
                    value={teacherRole}
                    onChange={(e) => setTeacherRole(e.target.value as any)}
                    className="w-full rounded-lg border border-border-hairline bg-canvas px-3 py-2 text-ink-primary focus:border-oxford focus:outline-hidden"
                  >
                    <option value="FACULTY_MENTOR">Faculty Mentor (Advisee Endorsement)</option>
                    <option value="PLACEMENT_OFFICER">Placement Officer (TPO)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-ink-secondary block mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-lg border border-border-hairline bg-canvas px-3 py-2 text-ink-primary focus:border-oxford focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-ink-secondary block mb-1">Assigned Cohort</label>
                <input
                  type="text"
                  value={assignedCohort}
                  onChange={(e) => setAssignedCohort(e.target.value)}
                  className="w-full rounded-lg border border-border-hairline bg-canvas px-3 py-2 text-ink-primary focus:border-oxford focus:outline-hidden"
                />
              </div>
            </>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-hairline bg-canvas px-4 py-2 text-xs font-semibold text-ink-primary hover:bg-subtle"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-oxford px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-oxford/90 disabled:opacity-50"
            >
              {loading ? 'Committing to Excel...' : 'Create Account & Write to Excel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

