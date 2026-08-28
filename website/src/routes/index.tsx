import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, CheckCircle2, FolderKanban, Gauge, Trophy } from "lucide-react";

import { PerformanceChart } from "@/components/performance-chart";
import { AvatarGroup, EmptyState, Initials, ProgressBar, SectionTitle, StatCard, StatusPill, Surface, accent } from "@/components/ui-bits";
import { addDays, iso, punctualityTrend } from "@/lib/mock-data";
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
  const { projects, users, currentUser } = useStore();
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">Dashboard</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Active projects" value={projects.length} icon={FolderKanban} tone="blue" hint="Across the studio" />
        <StatCard label="Pending approvals" value={pendingApprovals} icon={CheckCircle2} tone="peach" hint="Waiting on you" />
        <StatCard label="Upcoming deadlines" value={upcoming.length} icon={CalendarClock} tone="pink" hint="Next 14 days" />
        <StatCard label="Punctuality score" value={`${currentUser.punctuality}%`} icon={Gauge} tone="green" hint="Your rolling average" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Surface>
          <SectionTitle
            title="Performance chart"
            subtitle="Punctuality vs. team average, with target line"
            action={
              <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground">Weekly</span>
            }
          />
          <div className="mb-2 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-brand-blue" /> You</span>
            <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-brand-pink" /> Team</span>
            <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-muted-foreground" /> Target</span>
          </div>
          <PerformanceChart data={punctualityTrend} />
        </Surface>

        <Surface>
          <SectionTitle title="Top performers" subtitle="Highest punctuality this month" action={<Trophy className="size-4 text-brand-peach" />} />
          <ul className="space-y-3">
            {leaderboard.map((u, i) => (
              <li key={u.id} className="flex items-center gap-3">
                <span className="w-5 text-xs font-bold text-muted-foreground">#{i + 1}</span>
                <Initials user={u} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.name}</p>
                  <ProgressBar value={u.punctuality} tone={u.accent} />
                </div>
                <span className="text-sm font-bold">{u.punctuality}%</span>
              </li>
            ))}
          </ul>
        </Surface>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Surface>
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

        <Surface>
          <SectionTitle
            title="In progress"
            subtitle="Recently viewed projects"
            action={
              <Link to="/projects" className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium">
                View all
              </Link>
            }
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {projects.slice(0, 4).map((p) => {
              const stats = projectStats(p);
              return (
                <Link
                  key={p.id}
                  to="/projects/$projectId"
                  params={{ projectId: p.id }}
                  className={`rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift ${accent[p.accent].soft}`}
                >
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{p.description}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <AvatarGroup people={p.memberIds.map((id) => userMap[id]!).filter(Boolean)} size={24} max={3} />
                    <span className="text-xs font-bold">{stats.completion}%</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Surface>
      </div>
    </div>
  );
}
