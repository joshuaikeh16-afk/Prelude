"use client";

import { useState, useTransition } from "react";
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

function dueDateBadge(dueDate: string | null, completed: boolean) {
  if (!dueDate || completed) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(`${dueDate}T00:00:00`);

  const formatted = due.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  if (due < today) {
    return <span className="task-due overdue">Overdue · {formatted}</span>;
  }

  if (due.getTime() === today.getTime()) {
    return <span className="task-due today">Due today</span>;
  }

  return <span className="task-due">Due {formatted}</span>;
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

  if (isEditing) {
    return (
      <form
        action={(formData) => {
          startTransition(async () => {
            await updateTask(task.id, eventId, formData);
            setIsEditing(false);
          });
        }}
        className="task-edit"
      >
        <input
          type="text"
          name="title"
          defaultValue={task.title}
          autoFocus
        />

        <input
          type="date"
          name="due_date"
          defaultValue={task.due_date ?? ""}
        />

        <button type="submit" disabled={isPending}>
          Save
        </button>

        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="muted-button"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div className={`task-row ${isPending ? "task-pending" : ""}`}>
      <button
        type="button"
        className={`task-check ${task.completed ? "completed" : ""}`}
        disabled={isPending}
        onClick={() =>
          startTransition(() =>
            toggleTask(task.id, !task.completed, eventId)
          )
        }
        aria-label={
          task.completed ? "Mark task incomplete" : "Mark task complete"
        }
      >
        {task.completed ? "✓" : ""}
      </button>

      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className={`task-title ${
          task.completed ? "task-completed" : ""
        }`}
      >
        {task.title}
      </button>

      {dueDateBadge(task.due_date, task.completed)}

      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(() => deleteTask(task.id, eventId))
        }
        className="task-delete"
        aria-label="Delete task"
      >
        ×
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
  const progress = total ? (completedCount / total) * 100 : 0;

  return (
    <div className="task-list">
      {total > 0 && (
        <div className="task-progress">
          <div className="task-progress-header">
            <span>Preparation</span>
            <span>
              {completedCount}/{total}
            </span>
          </div>

          <div className="task-progress-track">
            <div
              className="task-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {total === 0 ? (
        <div className="task-empty">
          <div className="task-empty-icon">✓</div>
          <strong>Nothing to prepare yet.</strong>
          <p>
            Add something you need to get done before the big day.
          </p>
        </div>
      ) : (
        <div className="task-items">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              eventId={eventId}
            />
          ))}
        </div>
      )}

      <form
        action={createTask.bind(null, eventId)}
        className="add-task"
      >
        <input
          type="text"
          name="title"
          placeholder="What needs to get done?"
          required
        />

        <input
          type="date"
          name="due_date"
          aria-label="Task due date"
        />

        <button type="submit">+</button>
      </form>
    </div>
  );
}
