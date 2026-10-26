"use client";

import { useState, useTransition } from "react";
import { Check, Plus, X, Calendar, AlertCircle } from "lucide-react";
import {
  createTask,
  toggleTask,
  updateTask,
  deleteTask,
} from "@/app/actions/tasks";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  due_date: string | null;
};

function DueDateBadge({ dueDate, completed }: { dueDate: string | null; completed: boolean }) {
  if (!dueDate || completed) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(`${dueDate}T00:00:00`);

  const formatted = due.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  if (due < today) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-400">
        <AlertCircle size={10} strokeWidth={2.5} />
        Overdue · {formatted}
      </span>
    );
  }

  if (due.getTime() === today.getTime()) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400">
        <Calendar size={10} strokeWidth={2.5} />
        Due today
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
      <Calendar size={10} strokeWidth={2} />
      {formatted}
    </span>
  );
}

function TaskRow({
  task,
  eventId,
}: {
  task: Task;
  eventId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);

  function handleToggle() {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch {
        // Ignore haptic failures
      }
    }
    startTransition(() => {
      toggleTask(task.id, !task.completed, eventId);
    });
  }

  if (isEditing) {
    return (
      <form
        action={(formData) => {
          startTransition(async () => {
            await updateTask(task.id, eventId, formData);
            setIsEditing(false);
          });
        }}
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--accent)]/40 bg-[var(--surface-hover)] p-3 transition-all"
      >
        <input
          type="text"
          name="title"
          defaultValue={task.title}
          autoFocus
          className="flex-1 min-w-[140px] rounded-xl border border-[var(--line)] bg-black/40 px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        />

        <input
          type="date"
          name="due_date"
          defaultValue={task.due_date ?? ""}
          className="rounded-xl border border-[var(--line)] bg-black/40 px-2.5 py-1.5 text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
        />

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            Save
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="rounded-xl border border-[var(--line)] bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div
      className={`group flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-glass)] px-3.5 py-3 transition-all duration-200 hover:border-[var(--line-strong)] ${
        task.completed ? "opacity-60 bg-black/20" : ""
      } ${isPending ? "opacity-40 pointer-events-none" : ""}`}
    >
      {/* Satisfying animated check button */}
      <button
        type="button"
        disabled={isPending}
        onClick={handleToggle}
        aria-label={task.completed ? "Mark task incomplete" : "Mark task complete"}
        className={`grid h-6 w-6 place-items-center rounded-lg border transition-all duration-200 active:scale-90 ${
          task.completed
            ? "border-[var(--accent)] bg-[var(--accent)] text-white shadow-[0_0_12px_var(--accent-glow)] scale-105"
            : "border-[var(--line-strong)] bg-white/[0.03] text-transparent hover:border-[var(--accent)]"
        }`}
      >
        <Check size={14} strokeWidth={3} className={task.completed ? "opacity-100" : "opacity-0"} />
      </button>

      {/* Task title with click-to-edit */}
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className={`flex-1 text-left text-sm font-medium transition-all ${
          task.completed
            ? "line-through text-[var(--text-muted)] decoration-white/20"
            : "text-[var(--text-primary)] group-hover:text-white"
        }`}
      >
        {task.title}
      </button>

      <DueDateBadge dueDate={task.due_date} completed={task.completed} />

      {/* Delete button */}
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => deleteTask(task.id, eventId))}
        className="grid h-7 w-7 place-items-center rounded-lg text-[var(--text-muted)] opacity-70 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
        aria-label="Delete task"
      >
        <X size={15} strokeWidth={2} />
      </button>
    </div>
  );
}

export function TaskList({
  eventId,
  tasks,
}: {
  eventId: string;
  tasks: Task[];
}) {
  const completedCount = tasks.filter((task) => task.completed).length;
  const total = tasks.length;
  const progress = total ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-3.5">
      {total > 0 && (
        <div className="mb-1 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
            <span>Preparation</span>
            <span className="font-mono tabular-nums text-[var(--accent)]">
              {completedCount} of {total} completed ({progress}%)
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06] p-0.5">
            <div
              className="h-full rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent-glow)] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--line)] py-8 text-center">
          <div className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-white/[0.04] text-[var(--accent)]">
            <Check size={20} strokeWidth={2} />
          </div>
          <strong className="text-sm text-[var(--text-primary)]">Nothing to prepare yet.</strong>
          <p className="mt-1 max-w-[260px] text-xs text-[var(--text-muted)]">
            Add small steps you need to get done before the big day.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} eventId={eventId} />
          ))}
        </div>
      )}

      {/* Add Task Input Form */}
      <form
        action={createTask.bind(null, eventId)}
        className="mt-1 flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface-glass)] p-1.5 transition-all focus-within:border-[var(--accent)] focus-within:shadow-[0_0_16px_var(--accent-glow)]"
      >
        <input
          type="text"
          name="title"
          placeholder="What needs to get done?"
          required
          className="flex-1 bg-transparent px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
        />

        <input
          type="date"
          name="due_date"
          aria-label="Task due date"
          className="rounded-xl border border-[var(--line)] bg-white/[0.03] px-2 py-1 text-xs text-[var(--text-secondary)] outline-none"
        />

        <button
          type="submit"
          className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent)] text-white shadow-md shadow-[var(--accent-glow)] transition-all duration-150 hover:brightness-110 active:scale-95"
          aria-label="Add task"
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
}
