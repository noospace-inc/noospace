import { ArrowRight, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, Copy, ExternalLink, LayoutGrid, Rows3, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Initials, StatusPill, accent } from "@/components/ui-bits";
import { addDays, iso, startOfWeek, type Project, type Schedule } from "@/lib/mock-data";
import { useStore, useUserMap } from "@/lib/store";
import { cn } from "@/lib/utils";

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type TimelineView = "week" | "month" | "table";

const views: { key: TimelineView; label: string; icon: typeof LayoutGrid }[] = [
  { key: "week", label: "Week", icon: LayoutGrid },
  { key: "month", label: "Month", icon: CalendarDays },
  { key: "table", label: "Table", icon: Rows3 },
];

export function ScheduleTimeline({
  project,
  mode = "view",
  onRequestCreate,
}: {
  project: Project;
  mode?: "view" | "manage";
  onRequestCreate?: (date: string) => void;
}) {
  const { currentUser, approveTask, revertDeduction, updateTask, shiftSchedule, deleteSchedule, deleteTask, setTaskProof } = useStore();
  const userMap = useUserMap();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [openId, setOpenId] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const [view, setView] = useState<TimelineView>("week");
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [proofDraft, setProofDraft] = useState<Record<string, string>>({});

  const isLeader = currentUser.id === project.leaderId || currentUser.role === "admin";
  const today = iso(new Date());
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const blocks = project.schedules
    .map((s) => {
      const startIdx = days.indexOf(s.startDate);
      const endDate = addDays(s.startDate, s.days - 1);
      const visibleStart = startIdx >= 0 ? startIdx : s.startDate < days[0]! && endDate >= days[0]! ? 0 : -1;
      if (visibleStart < 0) return null;
      const endIdx = days.indexOf(endDate);
      const span = (endIdx >= 0 ? endIdx : 6) - visibleStart + 1;
      return { schedule: s, start: visibleStart, span: Math.max(1, span) };
    })
    .filter(Boolean) as { schedule: Schedule; start: number; span: number }[];

  const liveSchedule = openId ? project.schedules.find((s) => s.id === openId) ?? null : null;
  const openTasks = liveSchedule?.tasks ?? [];
  const liveTask = openTasks[Math.min(slide, Math.max(0, openTasks.length - 1))] ?? null;

  const openScheduleById = (id: string) => {
    setOpenId(id);
    setSlide(0);
  };

  useEffect(() => {
    const scheduleId = window.location.hash.replace("#schedule-", "");
    if (scheduleId && project.schedules.some((s) => s.id === scheduleId)) {
      openScheduleById(scheduleId);
    }
  }, [project.schedules]);

  const monthCells = useMemo(() => {
    const first = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const start = addDays(iso(first), -offset);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [monthCursor]);

  const schedulesOn = (date: string) =>
    project.schedules.filter((s) => date >= s.startDate && date <= addDays(s.startDate, s.days - 1));

  const copyProof = (url: string) => {
    void navigator.clipboard.writeText(url);
    toast.success("Proof link copied");
  };

  return (
    <div>
      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-1">
          {view === "week" ? (
            <>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="truncate text-xs font-semibold sm:text-sm">
            {new Date(weekStart + "T00:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric" })} –{" "}
            {new Date(addDays(weekStart, 6) + "T00:00:00").toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <ChevronRight className="size-4" />
          </Button>
            </>
          ) : view === "month" ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="truncate text-xs font-semibold sm:text-sm">
                {monthCursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </>
          ) : (
            <span className="text-xs font-semibold sm:text-sm">All schedules</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-secondary p-1">
          {views.map((v) => (
            <button
              key={v.key}
              type="button"
              aria-label={`${v.label} view`}
              onClick={() => setView(v.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors",
                view === v.key && "bg-card text-foreground shadow-card",
              )}
            >
              <v.icon className="size-3.5" />
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>
      </div>
      {mode === "manage" && view === "week" ? (
        <p className="mb-2 hidden text-[11px] text-muted-foreground sm:block">Ctrl + click a future date to add a schedule</p>
      ) : null}

      {view === "week" ? (
      <div className="no-scrollbar overflow-x-auto">
        <div className="min-w-[720px]">
          {/* row 1: dates */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((d, i) => {
              const past = d < today;
              const isToday = d === today;
              const block = blocks.find((b) => b.start === i);
              return (
                <div
                  key={d}
                  onClick={(e) => {
                    if (mode === "manage" && e.ctrlKey && !past) onRequestCreate?.(d);
                  }}
                  className={cn(
                    "relative rounded-2xl px-2 py-2 text-center transition-colors",
                    past ? "bg-secondary/60 text-muted-foreground" : "bg-secondary",
                    mode === "manage" && !past && "cursor-pointer hover:bg-accent",
                  )}
                >
                  <p className="text-[10px] font-medium uppercase tracking-wide opacity-70">{dayLabels[i]}</p>
                  <p
                    className={cn(
                      "mx-auto mt-0.5 grid size-8 place-items-center rounded-full text-base font-bold",
                      isToday &&
                        "bg-brand-green-soft text-foreground shadow-[0_0_0_2px_var(--color-brand-green),0_0_16px_oklch(0.66_0.13_155_/_0.42)]",
                    )}
                  >
                    {Number(d.slice(8))}
                  </p>
                {mode === "manage" && block && !past ? (
                    <div className="absolute -top-2 right-1 flex gap-1">
                      <button
                        type="button"
                        aria-label="Shift this schedule forward one day"
                        onClick={(e) => {
                          e.stopPropagation();
                          shiftSchedule(project.id, block.schedule.id);
                          toast.success("Schedule shifted forward by one day");
                        }}
                        className="grid size-6 place-items-center rounded-full bg-card text-muted-foreground shadow-card transition-colors hover:text-foreground"
                      >
                        <ArrowRight className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete this schedule"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Delete this schedule and all of its tasks?")) {
                            deleteSchedule(project.id, block.schedule.id);
                            toast.success("Schedule deleted");
                          }
                        }}
                        className="grid size-6 place-items-center rounded-full bg-card text-destructive shadow-card transition-colors hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* row 2: schedule blocks */}
          <div className="mt-2 grid grid-cols-7 gap-2">
            {blocks.length === 0 ? (
              <div className="col-span-7 rounded-2xl border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                No scheduled work this week.
              </div>
            ) : (
              blocks.map((b) => {
                const approvedAll = b.schedule.tasks.every((t) => t.status === "approved");
                const hasOverdue = b.schedule.tasks.some((t) => t.status === "overdue" || t.status === "carried");
                const past = addDays(b.schedule.startDate, b.schedule.days - 1) < today;
                return (
                  <button
                    type="button"
                    key={b.schedule.id}
                    onClick={() => openScheduleById(b.schedule.id)}
                    style={{ gridColumn: `${b.start + 1} / span ${b.span}` }}
                    className={cn(
                      "group rounded-2xl px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift",
                      approvedAll
                        ? "bg-brand-green-soft"
                        : hasOverdue
                          ? "bg-brand-peach-soft"
                          : accent[project.accent].soft,
                      mode === "manage" && past && "opacity-50 grayscale",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{b.schedule.tasks[0]?.label ?? "Schedule"}</p>
                      {hasOverdue ? <CircleAlert className="size-4 shrink-0 text-status-overdue" /> : null}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex -space-x-2">
                        {b.schedule.tasks.slice(0, 4).map((t) =>
                          userMap[t.userId] ? <Initials key={t.id} user={userMap[t.userId]!} size={22} /> : null,
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {b.schedule.tasks.filter((t) => t.status === "approved").length}/{b.schedule.tasks.length} done
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
      ) : view === "month" ? (
        <div className="no-scrollbar overflow-x-auto">
          <div className="min-w-[560px]">
            <div className="grid grid-cols-7 gap-1.5 pb-1.5">
              {dayLabels.map((d) => (
                <p key={d} className="text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {d}
                </p>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {monthCells.map((d) => {
                const inMonth = new Date(d + "T00:00:00").getMonth() === monthCursor.getMonth();
                const isToday = d === today;
                const list = schedulesOn(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      if (list[0]) openScheduleById(list[0].id);
                      else if (mode === "manage" && d >= today) onRequestCreate?.(d);
                    }}
                    className={cn(
                      "min-h-[64px] rounded-xl p-1.5 text-left transition-colors",
                      inMonth ? "bg-secondary" : "bg-secondary/40 text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-grid size-6 place-items-center rounded-full text-[11px] font-bold",
                        isToday &&
                          "bg-brand-green-soft text-foreground shadow-[0_0_0_2px_var(--color-brand-green),0_0_14px_oklch(0.66_0.13_155_/_0.4)]",
                      )}
                    >
                      {Number(d.slice(8))}
                    </span>
                    <div className="mt-1 space-y-1">
                      {list.slice(0, 2).map((s) => (
                        <span
                          key={s.id}
                          className={cn("block truncate rounded-md px-1 py-0.5 text-[9px] font-medium", accent[project.accent].soft)}
                        >
                          {s.tasks.length} task{s.tasks.length === 1 ? "" : "s"}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="no-scrollbar overflow-x-auto rounded-2xl bg-secondary/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Proof</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {project.schedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                    No schedules yet.
                  </TableCell>
                </TableRow>
              ) : (
                project.schedules.flatMap((s) =>
                  s.tasks.map((t) => (
                    <TableRow key={t.id} className="cursor-pointer" onClick={() => openScheduleById(s.id)}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(s.startDate + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        <span className="text-muted-foreground"> · {s.days}d</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{userMap[t.userId]?.name ?? "—"}</TableCell>
                      <TableCell className="min-w-[180px] text-xs">{t.label}</TableCell>
                      <TableCell className="text-xs">
                        {t.proof ? (
                          <span className="inline-flex items-center gap-1">
                            <a
                              href={t.proof}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-primary underline-offset-2 hover:underline"
                            >
                              Open
                            </a>
                            <button
                              type="button"
                              aria-label="Copy proof link"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyProof(t.proof!);
                              }}
                            >
                              <Copy className="size-3" />
                            </button>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <StatusPill status={t.status} compact />
                      </TableCell>
                    </TableRow>
                  )),
                )
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!liveSchedule} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {liveSchedule
                ? new Date(liveSchedule.startDate + "T00:00:00").toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })
                : ""}{" "}
              · member tasks
            </DialogTitle>
          </DialogHeader>
          {liveTask && userMap[liveTask.userId] ? (
            <div className="rounded-2xl bg-secondary p-4">
              <div className="flex items-center gap-3">
                <Initials user={userMap[liveTask.userId]!} size={40} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{userMap[liveTask.userId]!.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{userMap[liveTask.userId]!.title}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {liveTask.deduction != null ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!isLeader) return;
                        if (window.confirm("Are you sure you want to revert this deduction?")) {
                          revertDeduction(project.id, liveTask.id);
                          toast.success("Deduction reverted");
                        }
                      }}
                      className="rounded-full bg-status-overdue/15 px-2 py-0.5 text-[11px] font-bold text-status-overdue"
                    >
                      -{liveTask.deduction}
                    </button>
                  ) : null}
                  <StatusPill status={liveTask.status} />
                </div>
              </div>

              {mode === "manage" && isLeader ? (
                <div className="mt-3 flex gap-2">
                  <Input
                    value={draft[liveTask.id] ?? liveTask.label}
                    onChange={(e) => setDraft({ ...draft, [liveTask.id]: e.target.value })}
                    className="rounded-xl"
                  />
                  <Button
                    variant="secondary"
                    className="rounded-xl"
                    onClick={() => {
                      updateTask(project.id, liveTask.id, draft[liveTask.id] ?? liveTask.label);
                      toast.success("Task updated — change flagged on the project timeline");
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    variant="destructive"
                    className="rounded-xl"
                    onClick={() => {
                      if (!liveSchedule || !window.confirm("Delete this task?")) return;
                      const willRemoveSchedule = liveSchedule.tasks.length <= 1;
                      deleteTask(project.id, liveSchedule.id, liveTask.id);
                      toast.success(willRemoveSchedule ? "Task deleted and empty schedule removed" : "Task deleted");
                      if (willRemoveSchedule) {
                        setOpenId(null);
                        setSlide(0);
                      } else {
                        setSlide((s) => Math.max(0, Math.min(s, liveSchedule.tasks.length - 2)));
                      }
                    }}
                  >
                    <Trash2 className="mr-1 size-3.5" /> Delete
                  </Button>
                </div>
              ) : (
                <p className="mt-3 text-sm">{liveTask.label}</p>
              )}
              {liveTask.edited ? (
                <p className="mt-2 text-[11px] font-medium text-brand-lilac">● Edited since last publish</p>
              ) : null}

              <div className="mt-4 space-y-1.5 rounded-xl bg-card p-3">
                <p className="text-[11px] font-semibold text-muted-foreground">Proof link (optional)</p>
                {liveTask.proof ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={liveTask.proof}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 flex-1 truncate text-xs text-primary underline-offset-2 hover:underline"
                    >
                      {liveTask.proof}
                    </a>
                    <Button variant="ghost" size="icon" className="size-8 rounded-lg" onClick={() => copyProof(liveTask.proof!)}>
                      <Copy className="size-3.5" />
                    </Button>
                    <a href={liveTask.proof} target="_blank" rel="noreferrer" className="grid size-8 place-items-center rounded-lg hover:bg-secondary">
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                ) : null}
                {isLeader || currentUser.id === liveTask.userId ? (
                  <div className="flex gap-2">
                    <Input
                      value={proofDraft[liveTask.id] ?? liveTask.proof ?? ""}
                      placeholder="https://…"
                      className="h-9 rounded-xl"
                      onChange={(e) => setProofDraft({ ...proofDraft, [liveTask.id]: e.target.value })}
                    />
                    <Button
                      variant="secondary"
                      className="h-9 rounded-xl"
                      onClick={() => {
                        setTaskProof(project.id, liveTask.id, (proofDraft[liveTask.id] ?? "").trim());
                        toast.success("Proof saved");
                      }}
                    >
                      <CheckCircle2 className="mr-1 size-3.5" /> Save
                    </Button>
                  </div>
                ) : null}
              </div>

              {isLeader && liveTask.status !== "approved" ? (
                <Button
                  className="mt-4 w-full rounded-xl"
                  onClick={() => {
                    approveTask(project.id, liveTask.id);
                    toast.success("Task approved");
                  }}
                >
                  Approve task
                </Button>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              disabled={slide === 0}
              onClick={() => setSlide((s) => Math.max(0, s - 1))}
            >
              <ChevronLeft className="mr-1 size-4" /> Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              {Math.min(slide + 1, openTasks.length)} of {openTasks.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              disabled={slide >= openTasks.length - 1}
              onClick={() => setSlide((s) => Math.min(openTasks.length - 1, s + 1))}
            >
              Next <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
