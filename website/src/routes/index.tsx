import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, FolderKanban, Gauge } from "lucide-react";
import { useState } from "react";

import { PerformanceChart } from "@/components/performance-chart";
import { AvatarGroup, EmptyState, Initials, ProgressBar, SectionTitle, StatCard, StatusPill, Surface, accent } from "@/components/ui-bits";
import { addDays, iso } from "@/lib/mock-data";
import { projectStats, useStore, useUserMap } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Noospace Project Management" },
      {
        name: "description",
        content:
          "Track active projects, punctuality scores, approvals and today's schedule from one command center.",
      },
      { property: "og:title", content: "Dashboard — Noospace Project Management" },
      {
        property: "og:description",
        content: "Projects, punctuality trends, approvals and daily schedule in one place.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { projects, users, currentUser, trend } = useStore();
  const userMap = useUserMap();
  const today = iso(new Date());

  const pendingApprovals = projects
    .filter((p) => p.leaderId === currentUser.id)
    .flatMap((p) => p.schedules.flatMap((s) => s.tasks))
    .filter((t) => t.status === "pending").length;

  const upcoming = projects
    .flatMap((p) => p.schedules.map((s) => ({ project: p, schedule: s })))
    .filter((x) => x.schedule.startDate >= today)
    .sort((a, b) => a.schedule.startDate.localeCompare(b.schedule.startDate));

  const todaysTasks = projects
    .flatMap((p) =>
      p.schedules
        .filter((s) => s.startDate <= today && addDays(s.startDate, s.days - 1) >= today)
        .flatMap((s) => s.tasks.map((t) => ({ project: p, task: t }))),
    )
    .slice(0, 5);

  const leaderboard = [...users].sort((a, b) => b.punctuality - a.punctuality).slice(0, 4);
  const pinnedProjects = [...projects].filter((p) => p.pinnedAt).sort((a, b) => (b.pinnedAt ?? 0) - (a.pinnedAt ?? 0));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">Dashboard</h1>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Surface className="min-w-0 overflow-hidden">
          <SectionTitle title="Today's schedule" subtitle="Your team's tasks in flight" />
          {todaysTasks.length === 0 ? (
            <EmptyState title="Nothing scheduled today" description="Once a leader publishes a schedule, tasks appear here." />
          ) : (
            <ul className="space-y-3">
              {todaysTasks.map(({ project, task }) => (
                <li key={task.id} className="flex items-center gap-3">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${accent[project.accent].soft}`}>
                    <span className="text-[11px] font-bold">{project.name.slice(0, 2).toUpperCase()}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{task.label}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {userMap[task.userId]?.name} · {project.name}
                    </p>
                  </div>
                  <StatusPill status={task.status} compact />
                </li>
              ))}
            </ul>
          )}
        </Surface>

        <PinnedProjects projects={pinnedProjects} userMap={userMap} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Active projects" value={projects.length} icon={FolderKanban} tone="blue" hint="Across the studio" />
        <StatCard label="Pending approvals" value={pendingApprovals} icon={CheckCircle2} tone="peach" hint="Waiting on you" />
        <StatCard label="Upcoming deadlines" value={upcoming.length} icon={CalendarClock} tone="pink" hint="Next 14 days" />
        <StatCard label="Punctuality score" value={`${currentUser.punctuality}%`} icon={Gauge} tone="green" hint="Your rolling average" />
      </div>
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <Surface className="min-w-0"><SectionTitle title="Performance chart" subtitle="Punctuality vs. team average, with target line" action={<span className="rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground">Weekly</span>} /><div className="mb-2 flex gap-4 text-[11px] text-muted-foreground"><span>You</span><span>Team</span><span>Target</span></div><PerformanceChart data={trend} /></Surface>
        <Surface className="min-w-0"><SectionTitle title="Top performers" subtitle="Highest punctuality this month" /><ul className="space-y-3">{leaderboard.map((u, i) => <li key={u.id} className="flex min-w-0 items-center gap-3"><span className="w-5 text-xs font-bold text-muted-foreground">#{i + 1}</span><Initials user={u} size={36} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{u.name}</p><ProgressBar value={u.punctuality} tone={u.accent} /></div><span className="text-sm font-bold">{u.punctuality}%</span></li>)}</ul></Surface>
      </div>
    </div>
  );
}

function PinnedProjects({ projects, userMap }: { projects: ReturnType<typeof useStore>["projects"]; userMap: ReturnType<typeof useUserMap> }) {
  const [index, setIndex] = useState(0);
  const project = projects.length ? projects[index % projects.length] : null;
  const stats = project ? projectStats(project) : null;
  const tasks = project?.schedules.flatMap((s) => s.tasks) ?? [];
  const complete = tasks.filter((t) => t.status === "approved").length;
  const videos = project?.isVideoProject ? complete : 0;
  return <Surface className="min-w-0 overflow-hidden">
    <SectionTitle title="Pinned projects" subtitle="Project shortcuts" action={<div className="flex gap-1"><button aria-label="Previous project" onClick={() => setIndex((i) => (i - 1 + projects.length) % Math.max(projects.length, 1))} className="grid size-8 place-items-center rounded-full bg-secondary"><ChevronLeft className="size-4" /></button><button aria-label="Next project" onClick={() => setIndex((i) => (i + 1) % Math.max(projects.length, 1))} className="grid size-8 place-items-center rounded-full bg-secondary"><ChevronRight className="size-4" /></button></div>} />
    {project && stats ? <Link to="/projects/$projectId" params={{ projectId: project.id }} className={`block min-w-0 rounded-2xl p-5 ${accent[project.accent].soft}`}><p className="truncate text-lg font-bold">{project.name}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{project.description}</p><div className="mt-5 flex items-center justify-between gap-2"><AvatarGroup people={project.memberIds.map((id) => userMap[id]!).filter(Boolean)} size={24} max={4} /><span className="text-xs font-bold">{project.isVideoProject ? `${videos}/${project.videoBatchSize}` : `${tasks.length} tasks · ${complete} completed`}</span></div><div className="mt-3"><ProgressBar value={project.isVideoProject ? Math.min(100, videos / project.videoBatchSize * 100) : stats.completion} tone={project.accent} /></div></Link> : <EmptyState title="No pinned projects" description="Pin projects in the Projects section to show them here." />}
    {projects.length > 1 && <div className="mt-3 flex justify-center gap-1.5">{projects.map((p, i) => <button key={p.id} aria-label={`Show ${p.name}`} onClick={() => setIndex(i)} className={`size-1.5 rounded-full ${i === index ? "bg-primary" : "bg-muted-foreground/30"}`} />)}</div>}
  </Surface>;
}
