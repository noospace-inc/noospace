import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ChevronLeft, ChevronRight, Columns3, ListTodo, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { SectionTitle, StatusPill, Surface, accent } from "@/components/ui-bits";
import { addDays, iso, startOfWeek, type Importance } from "@/lib/mock-data";
import { canViewCalendarNote, useStore, useUserMap } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar - Noospace" },
      { name: "description", content: "Daily, weekly and monthly schedule calendar with marked team notes." },
      { property: "og:title", content: "Calendar - Noospace" },
      { property: "og:description", content: "Daily, weekly and monthly schedule calendar." },
    ],
  }),
  component: CalendarPage,
});

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const views = [
  { key: "month", label: "Month", icon: CalendarDays },
  { key: "week", label: "Week", icon: Columns3 },
  { key: "day", label: "Day", icon: ListTodo },
] as const;

type CalendarView = (typeof views)[number]["key"];

const importanceStyle: Record<Importance, string> = {
  important: "bg-status-overdue/15 text-status-overdue",
  moderate: "bg-status-pending/15 text-status-pending",
  normal: "bg-brand-blue-soft text-brand-blue",
};

function MarkDateDialog() {
  const { addNote, currentUser, projects } = useStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(iso(new Date()));
  const [importance, setImportance] = useState<Importance>("normal");
  const [isPrivate, setIsPrivate] = useState(false);
  const [projectId, setProjectId] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Plus className="mr-1 size-4" /> Mark date
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark a date</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl" placeholder="Quarterly review" />
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Importance</Label>
            <RadioGroup value={importance} onValueChange={(v) => setImportance(v as Importance)} className="flex flex-wrap gap-4">
              {(["important", "moderate", "normal"] as Importance[]).map((lvl) => (
                <div key={lvl} className="flex items-center gap-2">
                  <RadioGroupItem value={lvl} id={`imp-${lvl}`} />
                  <Label htmlFor={`imp-${lvl}`} className="font-normal capitalize">
                    {lvl}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-secondary p-3">
            <div className="space-y-0.5">
              <Label htmlFor="private-date" className="text-sm font-medium">Set it to private</Label>
              <p className="text-xs text-muted-foreground">Only admins and related people can see this date.</p>
            </div>
            <Switch id="private-date" checked={isPrivate} onCheckedChange={setIsPrivate} aria-label="Set it to private" />
          </div>
          {isPrivate ? (
            <div className="space-y-1.5">
              <Label htmlFor="related-project">Related project (optional)</Label>
              <select id="related-project" value={projectId} onChange={(event) => setProjectId(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                <option value="">No project</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
              <p className="text-xs text-muted-foreground">The selected project’s team can also see this private date.</p>
            </div>
          ) : null}
          <Button
            className="w-full rounded-xl"
            onClick={() => {
              if (!title.trim()) {
                toast.error("Add a title");
                return;
              }
              addNote({ title: title.trim(), date, importance, isPrivate, createdBy: currentUser.id, ...(isPrivate && projectId ? { projectId } : {}) });
              toast.success("Date marked");
              setOpen(false);
              setTitle("");
              setIsPrivate(false);
              setProjectId("");
            }}
          >
            Add to calendar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CalendarPage() {
  const { projects, notes, currentUser } = useStore();
  const userMap = useUserMap();
  const [view, setView] = useState<CalendarView>("month");
  const [selectedDate, setSelectedDate] = useState(iso(new Date()));
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const today = iso(new Date());
  const weekStart = startOfWeek(selectedDate);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const monthCells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const offset = (first.getDay() + 6) % 7;
    const start = addDays(iso(first), -offset);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const scheduleItems = (date: string) =>
    projects.flatMap((project) =>
      project.schedules
        .filter((s) => date >= s.startDate && date <= addDays(s.startDate, s.days - 1))
        .flatMap((s) =>
          s.tasks.map((task) => ({
            id: `${project.id}-${s.id}-${task.id}`,
            project,
            schedule: s,
            task,
            date,
          })),
        ),
    );

  const noteItems = (date: string) => notes.filter((n) => n.date === date && canViewCalendarNote(n, currentUser, projects));
  const hasItems = (date: string) => scheduleItems(date).length > 0 || noteItems(date).length > 0;
  const selectedItems = scheduleItems(selectedDate);
  const selectedNotes = noteItems(selectedDate);
  const nextUpcoming = [...monthCells, ...Array.from({ length: 45 }, (_, i) => addDays(today, i))]
    .filter((d, i, arr) => arr.indexOf(d) === i && d >= today && hasItems(d))
    .sort()[0];
  const todayItems = scheduleItems(today);
  const todayNotes = noteItems(today);
  const monthLabel = new Date(cursor.y, cursor.m, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const moveMonth = (delta: number) =>
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const moveSelected = (delta: number) => setSelectedDate((d) => addDays(d, delta));

  return (
    <div className="min-w-0 space-y-4 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">Calendar</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-card p-1 shadow-card">
            {views.map((item) => (
              <button
                key={item.key}
                type="button"
                aria-label={`${item.label} view`}
                onClick={() => setView(item.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground",
                  view === item.key && "bg-primary text-primary-foreground",
                )}
              >
                <item.icon className="size-3.5" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>
          <MarkDateDialog />
        </div>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Surface className="min-w-0 overflow-hidden p-3 sm:p-5">
          <SectionTitle
            title={view === "month" ? monthLabel : view === "week" ? "Weekly view" : "Daily view"}
            action={
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => (view === "month" ? moveMonth(-1) : moveSelected(view === "week" ? -7 : -1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => (view === "month" ? moveMonth(1) : moveSelected(view === "week" ? 7 : 1))}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            }
          />

          {view === "month" ? (
            <div className="min-w-0">
              <div className="grid min-w-0 grid-cols-7 gap-1 pb-2 text-center text-[9px] font-semibold uppercase text-muted-foreground sm:gap-2 sm:text-[11px]">
                {dayLabels.map((day) => (
                  <span key={day} className="min-w-0">
                    <span className="sm:hidden">{day.slice(0, 2)}</span>
                    <span className="hidden sm:inline">{day}</span>
                  </span>
                ))}
              </div>
              <div className="grid min-w-0 grid-cols-7 gap-1 sm:gap-2">
                {monthCells.map((date) => {
                  const inMonth = new Date(date + "T00:00:00").getMonth() === cursor.m;
                  const daySchedules = scheduleItems(date);
                  const dayNotes = noteItems(date);
                  const taskCount = daySchedules.length;
                  return (
                    <button
                      key={date}
                      type="button"
                      aria-label={`${new Date(date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}: ${taskCount} ${taskCount === 1 ? "task" : "tasks"}`}
                      onClick={() => {
                        setSelectedDate(date);
                        setView("day");
                      }}
                      className={cn(
                        "min-w-0 min-h-14 overflow-hidden rounded-lg p-1 text-left transition-colors hover:bg-accent sm:min-h-[104px] sm:rounded-2xl sm:p-2",
                        inMonth ? "bg-secondary/70" : "bg-secondary/30 text-muted-foreground",
                        date === today && "shadow-[0_0_0_2px_var(--color-brand-green),0_0_18px_oklch(0.66_0.13_155_/_0.45)]",
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold sm:text-xs">{Number(date.slice(8))}</span>
                      </div>
                      <p className="mt-1 truncate text-[8px] font-medium leading-tight text-muted-foreground sm:hidden">
                        {taskCount} {taskCount === 1 ? "task" : "tasks"}
                      </p>
                      <div className="mt-1 hidden space-y-1 sm:block">
                        {daySchedules.slice(0, 2).map((item) => (
                          <p key={item.id} className={cn("truncate rounded-lg px-1.5 py-1 text-[10px] font-medium", accent[item.project.accent].soft)}>
                            {item.project.name}
                          </p>
                        ))}
                        {dayNotes.slice(0, 2).map((n) => (
                          <p key={n.id} className={cn("truncate rounded-lg px-1.5 py-1 text-[10px] font-semibold", importanceStyle[n.importance])}>
                            {n.title}
                          </p>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : view === "week" ? (
            <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-7">
              {weekDays.map((date) => (
                <button
                  key={date}
                  type="button"
                  onClick={() => {
                    setSelectedDate(date);
                    setView("day");
                  }}
                  className={cn(
                    "min-w-0 overflow-hidden rounded-2xl bg-secondary p-3 text-left transition-colors hover:bg-accent",
                    date === today && "shadow-[0_0_0_2px_var(--color-brand-green),0_0_18px_oklch(0.66_0.13_155_/_0.45)]",
                  )}
                >
                  <p className="text-xs font-bold">
                    {new Date(date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
                  </p>
                  <div className="mt-3 space-y-2">
                    {scheduleItems(date)
                      .slice(0, 4)
                      .map((item) => (
                        <div key={item.id} className="rounded-xl bg-card p-2">
                          <p className="truncate text-xs font-medium">{item.task.label}</p>
                          <p className="truncate text-[10px] text-muted-foreground">{item.project.name}</p>
                        </div>
                      ))}
                    {noteItems(date).map((n) => (
                      <p key={n.id} className={cn("rounded-xl px-2 py-1 text-[10px] font-semibold", importanceStyle[n.importance])}>
                        {n.title}
                      </p>
                    ))}
                    {!hasItems(date) ? <p className="text-[11px] text-muted-foreground">No events</p> : null}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <DayList date={selectedDate} notes={selectedNotes} items={selectedItems} userMap={userMap} />
          )}
        </Surface>

        <Surface>
          <SectionTitle title="Today's events" />
          {todayItems.length || todayNotes.length ? (
            <DayList date={today} notes={todayNotes} items={todayItems} userMap={userMap} compact />
          ) : nextUpcoming ? (
            <div>
              <p className="mb-3 text-xs text-muted-foreground">Next upcoming: {nextUpcoming}</p>
              <DayList date={nextUpcoming} notes={noteItems(nextUpcoming)} items={scheduleItems(nextUpcoming)} userMap={userMap} compact />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming events.</p>
          )}
        </Surface>
      </div>
    </div>
  );
}

function DayList({
  date,
  notes,
  items,
  userMap,
  compact,
}: {
  date: string;
  notes: ReturnType<typeof useStore>["notes"];
  items: ReturnType<typeof useStore>["projects"][number]["schedules"][number]["tasks"] extends infer _T
    ? {
        id: string;
        project: ReturnType<typeof useStore>["projects"][number];
        schedule: ReturnType<typeof useStore>["projects"][number]["schedules"][number];
        task: ReturnType<typeof useStore>["projects"][number]["schedules"][number]["tasks"][number];
      }[]
    : never;
  userMap: ReturnType<typeof useUserMap>;
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">
          {new Date(date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
        </p>
        {!compact ? (
          <Button asChild variant="secondary" size="sm" className="rounded-full">
            <Link to="/calendar/$date" params={{ date }}>
              Open page
            </Link>
          </Button>
        ) : null}
      </div>
      {notes.map((n) => (
        <div key={n.id} className={cn("rounded-2xl px-3 py-2 text-xs font-semibold", importanceStyle[n.importance])}>
          {n.title}
        </div>
      ))}
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl bg-secondary p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.task.label}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {item.project.name} - {userMap[item.task.userId]?.name ?? "Unassigned"}
              </p>
            </div>
            <StatusPill status={item.task.status} compact />
          </div>
        </div>
      ))}
      {!items.length && !notes.length ? <p className="text-sm text-muted-foreground">No events for this date.</p> : null}
    </div>
  );
}
