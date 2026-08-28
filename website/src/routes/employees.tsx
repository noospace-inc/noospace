import { createFileRoute } from "@tanstack/react-router";
import { Eye, LockKeyhole, Search, UserRound } from "lucide-react";
import { useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Initials, ProgressBar, SectionTitle, Surface, accent } from "@/components/ui-bits";
import { projectStats, useStore, userPunctuality } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employees")({
  head: () => ({
    meta: [
      { title: "Employees — Noospace" },
      { name: "description", content: "Employee directory with project counts and punctuality scores." },
      { property: "og:title", content: "Employees — Noospace" },
      { property: "og:description", content: "Employee directory with project counts and punctuality scores." },
    ],
  }),
  component: EmployeesPage,
});

function EmployeesPage() {
  const { users, projects } = useStore();
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mineHighlighted, setMineHighlighted] = useState(false);

  const counts = (userId: string) => {
    const mine = projects.filter((p) => p.memberIds.includes(userId));
    const completed = mine.filter((p) => projectStats(p).completion === 100).length;
    return { ongoing: mine.length - completed, completed };
  };

  const ranked = [...users]
    .map((u) => ({ user: u, score: userPunctuality(projects, u) }))
    .sort((a, b) => b.score - a.score);
  const filtered = users.filter((u) => (u.name + u.title).toLowerCase().includes(q.toLowerCase()));
  const selected = selectedId ? users.find((u) => u.id === selectedId) : null;
  const selectMine = () => {
    setMineHighlighted(true);
    document.getElementById("employee-score-mine")?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => setMineHighlighted(false), 1400);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">Employees</h1>
      </div>

      <Surface>
        <SectionTitle
          title="Punctuality"
          subtitle="Every employee starts at 100%; overdue work reduces their score"
          action={
            <button type="button" onClick={selectMine} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold hover:bg-accent">
              <Eye className="size-3.5" /> See mine
            </button>
          }
        />
        <div className="flex h-64 items-end gap-2 overflow-x-auto px-2 pb-2 pt-8 sm:gap-4">
          {ranked.map(({ user: u, score }, index) => (
            <button
              key={u.id}
              id={u.id === "u1" ? "employee-score-mine" : undefined}
              type="button"
              onClick={() => setSelectedId(u.id)}
              className={cn("group flex h-full min-w-16 flex-1 flex-col items-center justify-end gap-2 rounded-2xl p-1 text-left transition-all", mineHighlighted && u.id === "u1" && "bg-brand-green-soft ring-2 ring-brand-green")}
            >
              <span className="text-[10px] font-bold text-muted-foreground">{score}%</span>
              <span className="relative flex w-full max-w-16 flex-1 items-end rounded-t-xl bg-secondary">
                <span className={cn("w-full rounded-t-xl transition-[height] duration-500", accent[u.accent].soft)} style={{ height: `${score}%` }} />
              </span>
              <Initials user={u} size={34} />
              <span className="w-full truncate text-center text-[10px] font-semibold">{u.name.split(" ")[0]}</span>
              <span className="text-[10px] text-muted-foreground">#{index + 1}</span>
            </button>
          ))}
        </div>
      </Surface>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search employees"
          className="h-12 rounded-full border-0 bg-card pl-11 shadow-card"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((u) => {
          const c = counts(u.id);
          return (
              <button key={u.id} type="button" onClick={() => setSelectedId(u.id)} className="text-left">
              <Surface hover>
              <div className="flex items-center gap-3">
                <Initials user={u} size={48} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{u.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{u.title}</p>
                </div>
                <span className={cn("ml-auto rounded-full px-2.5 py-1 text-[11px] font-medium capitalize", accent[u.accent].soft)}>
                  {u.role}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl bg-secondary py-2">
                  <p className="text-lg font-bold">{c.completed}</p>
                  <p className="text-[10px] text-muted-foreground">Completed</p>
                </div>
                <div className="rounded-xl bg-secondary py-2">
                  <p className="text-lg font-bold">{c.ongoing}</p>
                  <p className="text-[10px] text-muted-foreground">Ongoing</p>
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                  <span>Punctuality</span>
                  <span className="text-foreground">{userPunctuality(projects, u)}%</span>
                </div>
                <ProgressBar value={userPunctuality(projects, u)} tone={u.accent} />
              </div>
              </Surface>
              </button>
          );
        })}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.name} profile</DialogTitle>
          </DialogHeader>
          {selected ? (
            selected.profileVisibility === "private" ? (
              <div className="flex items-center gap-3 rounded-2xl bg-secondary p-4 text-sm text-muted-foreground">
                <LockKeyhole className="size-5 shrink-0" /> This profile is private.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-2xl bg-secondary p-3">
                  <Initials user={selected} size={52} />
                  <div>
                    <p className="font-semibold">{selected.name}</p>
                    <p className="text-xs text-muted-foreground">{selected.title} · {selected.role}</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed">{selected.bio || "No bio added yet."}</p>
                <div className="flex items-center justify-between rounded-2xl bg-brand-green-soft p-3">
                  <span className="text-xs font-medium">Punctuality</span>
                  <span className="text-lg font-bold">{userPunctuality(projects, selected)}%</span>
                </div>
                <p className="text-xs text-muted-foreground">{selected.email}</p>
              </div>
            )
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
