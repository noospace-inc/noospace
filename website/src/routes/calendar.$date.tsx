import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { StatusPill, Surface, accent } from "@/components/ui-bits";
import { addDays, type Importance } from "@/lib/mock-data";
import { useStore, useUserMap } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar/$date")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.date} schedule - Noospace` },
      { name: "description", content: "Schedules and events for the selected calendar date." },
    ],
  }),
  component: CalendarDayPage,
});

const importanceStyle: Record<Importance, string> = {
  important: "bg-status-overdue/15 text-status-overdue",
  moderate: "bg-status-pending/15 text-status-pending",
  normal: "bg-brand-blue-soft text-brand-blue",
};

function CalendarDayPage() {
  const { date } = Route.useParams();
  const { projects, notes } = useStore();
  const userMap = useUserMap();

  const dayNotes = notes.filter((n) => n.date === date);
  const items = projects.flatMap((project) =>
    project.schedules
      .filter((s) => date >= s.startDate && date <= addDays(s.startDate, s.days - 1))
      .flatMap((schedule) =>
        schedule.tasks.map((task) => ({
          id: `${project.id}-${schedule.id}-${task.id}`,
          project,
          schedule,
          task,
        })),
      ),
  );

  return (
    <div className="space-y-4">
      <Link to="/calendar" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Calendar
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
          {new Date(date + "T00:00:00").toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </h1>
      </div>

      <Surface>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Events and schedules</h2>
        {!dayNotes.length && !items.length ? (
          <p className="text-sm text-muted-foreground">No scheduled items or marked events for this date.</p>
        ) : (
          <div className="space-y-3">
            {dayNotes.map((n) => (
              <div key={n.id} className={cn("rounded-2xl px-4 py-3 text-sm font-semibold", importanceStyle[n.importance])}>
                {n.title}
              </div>
            ))}
            {items.map((item) => (
              <Link
                key={item.id}
                to="/projects/$projectId"
                params={{ projectId: item.project.id }}
                className="block rounded-2xl bg-secondary p-4 transition-colors hover:bg-accent"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.task.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.project.name} - {userMap[item.task.userId]?.name ?? "Unassigned"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", accent[item.project.accent].soft)}>
                      {item.schedule.days}d schedule
                    </span>
                    <StatusPill status={item.task.status} compact />
                  </div>
                </div>
                {item.task.proof ? (
                  <p className="mt-2 truncate text-xs text-primary">{item.task.proof}</p>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </Surface>
    </div>
  );
}
