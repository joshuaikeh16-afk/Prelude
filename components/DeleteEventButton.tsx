"use client";

import { deleteEvent } from "@/app/actions/events";

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
        if (!confirm(`Delete "${title}"? This can't be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="text-sm text-red-600 underline"
      >
        Delete event
      </button>
    </form>
  );
}
