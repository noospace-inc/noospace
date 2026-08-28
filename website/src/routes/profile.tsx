import { createFileRoute } from "@tanstack/react-router";
import { Camera, CheckCircle2, Gauge, LogOut, Pencil, Plus, Timer, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Initials, LinkChip, SectionTitle, StatCard, StatusPill, Surface } from "@/components/ui-bits";
import type { PropLink } from "@/lib/mock-data";
import { distributionTotals, emptyLink, inr, projectStats, useStore, userPunctuality } from "@/lib/store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile - Noospace" },
      { name: "description", content: "Your punctuality average, project counts, personal schedule and profile details." },
      { property: "og:title", content: "Your profile - Noospace" },
      { property: "og:description", content: "Punctuality average, project counts and personal schedule." },
    ],
  }),
  component: ProfilePage,
});

type FocusPanel = "punctuality" | "completed" | "ongoing" | null;
type ProfileSection = "schedule" | "payments";

function ProfilePage() {
  const { currentUser, projects, updateProfile } = useStore();
  const [form, setForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    title: currentUser.title,
    github: currentUser.github,
    bio: currentUser.bio,
  });
  const [links, setLinks] = useState<PropLink[]>(currentUser.links);
  const [editing, setEditing] = useState(false);
  const [focus, setFocus] = useState<FocusPanel>(null);
  const [section, setSection] = useState<ProfileSection>("schedule");

  const mine = projects.filter((p) => p.memberIds.includes(currentUser.id));
  const completedProjects = mine.filter((p) => projectStats(p).completion === 100);
  const ongoingProjects = mine.filter((p) => projectStats(p).completion < 100);
  const myTasks = mine.flatMap((p) =>
    p.schedules.flatMap((s) => s.tasks.filter((t) => t.userId === currentUser.id).map((t) => ({ p, s, t }))),
  );
  const projectPunctuality = mine.map((p) => {
    const tasks = p.schedules.flatMap((s) => s.tasks.filter((t) => t.userId === currentUser.id));
    const approved = tasks.filter((t) => t.status === "approved").length;
    const score = tasks.length ? Math.round((approved / tasks.length) * 100) : currentUser.punctuality;
    return { project: p, tasks: tasks.length, score };
  });
  const paymentHistory = projects.flatMap((p) =>
    p.distributions.flatMap((d) =>
      d.allocations
        .filter((a) => a.userId === currentUser.id)
        .map((a) => ({ project: p, distribution: d, amount: a.amount, labels: a.videoNames })),
    ),
  );
  const totalEarnings = paymentHistory.reduce((sum, p) => sum + p.amount, 0);
  const githubLink = currentUser.github
    ? { id: "github", label: "GitHub", url: currentUser.github, value: currentUser.github }
    : null;

  const save = () => {
    updateProfile({ ...form, links: links.filter((l) => l.value) });
    setEditing(false);
    toast.success("Profile saved");
  };

  const cancel = () => {
    setForm({ name: currentUser.name, email: currentUser.email, title: currentUser.title, github: currentUser.github, bio: currentUser.bio });
    setLinks(currentUser.links);
    setEditing(false);
  };

  return (
    <div className="space-y-4">
      <Surface className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative">
              <Initials user={currentUser} size={76} />
              <button
                type="button"
                onClick={() => toast.info("Photo upload is coming with the backend")}
                className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-card"
                aria-label="Upload profile photo"
              >
                <Camera className="size-3.5" />
              </button>
            </div>
            <div className="min-w-0">
              {editing ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input aria-label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl font-semibold" />
                  <Input aria-label="Role" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl" placeholder="Role" />
                  <Input aria-label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl sm:col-span-2" />
                </div>
              ) : (
                <>
                  <p className="truncate text-xl font-bold tracking-tight">{currentUser.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{currentUser.email}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {currentUser.title} - {currentUser.role}
                  </p>
                </>
              )}
            </div>
          </div>
          {editing ? (
            <div className="flex shrink-0 gap-1">
              <Button size="sm" className="rounded-full" onClick={save}>
                Save
              </Button>
              <Button size="icon" variant="ghost" className="size-8 rounded-full" onClick={cancel}>
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <Button size="icon" variant="secondary" className="size-9 rounded-full" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
            </Button>
          )}
        </div>

        <div className="mt-5 space-y-3">
          {editing ? (
            <>
              <Textarea value={form.bio} rows={3} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="rounded-xl" />
              <Input value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} className="rounded-xl" placeholder="GitHub link" />
              <div className="space-y-2">
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setLinks([...links, emptyLink()])}>
                    <Plus className="mr-1 size-3.5" /> Add link
                  </Button>
                </div>
                {links.map((l, i) => (
                  <div key={l.id} className="grid gap-2 sm:grid-cols-[1fr_1.5fr_auto]">
                    <Input
                      placeholder="Label"
                      value={l.label}
                      className="rounded-xl"
                      onChange={(e) => setLinks(links.map((x, xi) => (xi === i ? { ...x, label: e.target.value } : x)))}
                    />
                    <Input
                      placeholder="URL or email"
                      value={l.value}
                      className="rounded-xl"
                      onChange={(e) =>
                        setLinks(
                          links.map((x, xi) =>
                            xi === i ? { ...x, value: e.target.value, url: e.target.value.includes("@") ? "" : e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setLinks(links.filter((_, xi) => xi !== i))}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="max-w-2xl text-sm leading-relaxed">{currentUser.bio || "No bio added yet."}</p>
              <div className="flex flex-wrap gap-2">
                {githubLink ? <LinkChip link={githubLink} /> : null}
                {currentUser.links.filter((l) => l.value).map((l) => (
                  <LinkChip key={l.id} link={l} />
                ))}
              </div>
            </>
          )}
          {editing ? <div className="mt-3 flex items-center justify-between rounded-2xl bg-secondary/70 px-3 py-2.5">
          <div>
            <p className="text-sm font-semibold">Private profile</p>
            <p className="text-[11px] text-muted-foreground">Hide your profile details from the employee directory</p>
          </div>
          <Switch
            checked={currentUser.profileVisibility === "private"}
            onCheckedChange={(privateProfile) => {
              updateProfile({ profileVisibility: privateProfile ? "private" : "public" });
              toast.success(privateProfile ? "Profile set to private" : "Profile set to public");
            }}
            aria-label="Toggle private profile"
          />
          </div> : null}
        </div>
      </Surface>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Punctuality" value={`${userPunctuality(projects, currentUser)}%`} icon={Gauge} tone="green" onClick={() => setFocus("punctuality")} />
        <StatCard label="Completed projects" value={completedProjects.length} icon={CheckCircle2} tone="blue" onClick={() => setFocus("completed")} />
        <StatCard label="Ongoing projects" value={ongoingProjects.length} icon={Timer} tone="peach" onClick={() => setFocus("ongoing")} />
        <StatCard
          label="Scheduled tasks"
          value={myTasks.length}
          icon={Timer}
          tone="pink"
          onClick={() => {
            setFocus(null);
            setSection("schedule");
            window.requestAnimationFrame(() => document.getElementById("profile-schedule")?.scrollIntoView({ behavior: "smooth", block: "start" }));
          }}
        />
      </div>

      {focus ? (
        <Surface>
          {focus === "punctuality" ? (
            <ListPanel title="Punctuality across projects">
              {projectPunctuality.map(({ project, tasks, score }) => (
                <a key={project.id} href={`/projects/${project.id}`} className="block rounded-2xl bg-secondary p-3 transition-colors hover:bg-accent">
                  <p className="text-sm font-semibold">{project.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {score}% punctual - {tasks} assigned task{tasks === 1 ? "" : "s"}
                  </p>
                </a>
              ))}
            </ListPanel>
          ) : focus === "completed" ? (
            <ProjectList title="Completed projects" projects={completedProjects} />
          ) : (
            <ProjectList title="Ongoing projects" projects={ongoingProjects} />
          )}
        </Surface>
      ) : null}

      <div className="flex w-full gap-1 rounded-full bg-card p-1 shadow-card sm:w-fit">
        {(["schedule", "payments"] as ProfileSection[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setSection(item);
              if (item === "schedule") setFocus(null);
            }}
            className={`flex-1 rounded-full px-5 py-2 text-sm font-semibold capitalize sm:flex-none ${
              section === item ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {section === "schedule" ? (
        <Surface id="profile-schedule">
          <SectionTitle title="Schedule" subtitle="Assigned schedules across projects" />
          <div className="space-y-2">
            {myTasks.map(({ p, s, t }) => (
              <a key={t.id} href={`/projects/${p.id}#schedule-${s.id}`} className="flex items-center gap-3 rounded-2xl bg-secondary px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.label}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {p.name} - {s.startDate}
                  </p>
                </div>
                {t.deduction != null ? (
                  <span className="rounded-full bg-status-overdue/15 px-2 py-0.5 text-[11px] font-bold text-status-overdue">-{t.deduction}</span>
                ) : null}
                <StatusPill status={t.status} compact />
              </a>
            ))}
          </div>
        </Surface>
      ) : (
        <Surface>
          <SectionTitle title="Payments" subtitle="Total earnings and distribution history" />
          <div className="mb-4 rounded-2xl bg-brand-green-soft p-4">
            <p className="text-2xl font-bold">{inr(totalEarnings)}</p>
            <p className="text-[11px] text-muted-foreground">Total earnings</p>
          </div>
          {paymentHistory.length ? (
            <div className="space-y-2">
              {paymentHistory.map((entry) => (
                <div key={`${entry.project.id}-${entry.distribution.id}`} className="rounded-2xl bg-secondary p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{entry.project.name}</p>
                      <p className="text-[11px] text-muted-foreground">{entry.distribution.date}</p>
                    </div>
                    <p className="text-sm font-bold">{inr(entry.amount)}</p>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[11px] text-muted-foreground">{entry.labels.join(", ")}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          )}
        </Surface>
      )}

      <Button variant="ghost" className="rounded-xl text-destructive" onClick={() => toast.info("Signed out (demo)")}>
        <LogOut className="mr-1 size-4" /> Log out
      </Button>
    </div>
  );
}

function ListPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <SectionTitle title={title} />
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ProjectList({ title, projects }: { title: string; projects: ReturnType<typeof useStore>["projects"] }) {
  return (
    <ListPanel title={title}>
      {projects.length ? (
        projects.map((p) => {
          const totals = distributionTotals(p);
          return (
            <a key={p.id} href={`/projects/${p.id}`} className="block rounded-2xl bg-secondary p-3 transition-colors hover:bg-accent">
              <p className="text-sm font-semibold">{p.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {projectStats(p).completion}% complete - {inr(totals.distributed)} distributed
              </p>
            </a>
          );
        })
      ) : (
        <p className="text-sm text-muted-foreground">Nothing to show yet.</p>
      )}
    </ListPanel>
  );
}
