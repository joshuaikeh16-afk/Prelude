"use client";

import { deleteEvent } from "@/app/actions/events";
import { Trash2 } from "lucide-react";

export function DeleteEventButton({
  eventId,
  title,
}: {
  eventId: string;
  title: string;
}) {
  return (
    <form
      action={async () => {
        await deleteEvent(eventId);
      }}
      onSubmit={(e) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 hover:text-red-300 active:scale-95"
      >
        <Trash2 size={13} strokeWidth={2} />
        Delete event
      </button>
    </form>
  );
}
