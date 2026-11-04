'use client'

import { useState } from 'react'
import { Zap, CheckCircle2, Calendar, ArrowUpRight, BookOpen } from 'lucide-react'

interface SprintTask {
  id: string
  title: string
  timeEst: string
  points: number
  category: string
  done: boolean
}

const initialTasks: SprintTask[] = [
  {
    id: 'task-1',
    title: 'Complete 15-min SQL Practice Quiz',
    timeEst: '15 mins',
    points: 8,
    category: 'Quick Quiz',
    done: false,
  },
  {
    id: 'task-2',
    title: 'Link GitHub PR for Order Service Redis Locks',
    timeEst: '5 mins',
    points: 6,
    category: 'Project Code',
    done: true,
  },
  {
    id: 'task-3',
    title: 'Take 2-Min Docker Skill Proof (Micro-Defense)',
    timeEst: '2 mins',
    points: 8,
    category: 'Quick Defense',
    done: false,
  },
]

export default function SprintPlanChatCard({
  onTaskToggle,
  onLaunchMicroDefense,
}: {
  onTaskToggle?: (taskId: string, done: boolean) => void
  onLaunchMicroDefense?: () => void
}) {
  const [tasks, setTasks] = useState<SprintTask[]>(initialTasks)

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    )
    const task = tasks.find((t) => t.id === id)
    if (task) {
      onTaskToggle?.(id, !task.done)
    }
  }

  const completedPoints = tasks
    .filter((t) => t.done)
    .reduce((sum, t) => sum + t.points, 0)
  const totalPoints = tasks.reduce((sum, t) => sum + t.points, 0)

  return (
    <div className="overflow-hidden rounded-xl border border-amber-border bg-amber-surface/30 p-4 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-border/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-surface text-amber">
            <Zap className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-display text-xs font-semibold text-ink-primary">
              Last-Minute Prep Checklist (72-Hour Sprint)
            </h3>
            <p className="text-[11px] text-ink-secondary">
              Urgent Prep for TechCorp Drive • Friday 10:00 AM
            </p>
          </div>
        </div>

        <div className="text-right font-mono text-xs">
          <span className="font-semibold text-emerald">+{completedPoints}</span>
          <span className="text-ink-muted"> / +{totalPoints} pts earned</span>
        </div>
      </div>

      {/* Task list */}
      <div className="mt-3 space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center justify-between rounded-lg border p-2.5 transition-all ${
              task.done
                ? 'border-emerald-border bg-emerald-surface/40 text-ink-muted'
                : 'border-border-hairline bg-surface text-ink-primary hover:border-oxford-border'
            }`}
          >
            <label className="flex items-center gap-3 cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
                className="h-4 w-4 rounded border-border-hairline text-emerald accent-emerald focus:ring-emerald"
              />
              <div>
                <span
                  className={`text-xs font-medium ${
                    task.done ? 'line-through text-ink-muted' : ''
                  }`}
                >
                  {task.title}
                </span>
                <div className="flex items-center gap-2 font-mono text-[10px] text-ink-muted mt-0.5">
                  <span>⏱ {task.timeEst}</span>
                  <span>•</span>
                  <span>{task.category}</span>
                </div>
              </div>
            </label>

            <div className="flex items-center gap-2">
              <span className="font-mono text-provenance text-emerald font-semibold">
                +{task.points} pts
              </span>
              {task.id === 'task-3' && !task.done && (
                <button
                  type="button"
                  onClick={onLaunchMicroDefense}
                  className="rounded bg-oxford px-2 py-1 text-[11px] font-semibold text-white hover:bg-oxford/90 shadow-2xs"
                >
                  Start Defense →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer advice */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-ink-secondary pt-2 border-t border-border-hairline">
        <span className="flex items-center gap-1">
          <BookOpen className="h-3 w-3 text-oxford" />
          Recommended by Your AI Readiness Coach
        </span>
        <span className="font-mono text-provenance text-oxford">
          Fast-Track Prep Mode
        </span>
      </div>
    </div>
  )
}
