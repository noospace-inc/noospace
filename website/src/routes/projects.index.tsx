import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, FileText, Pin, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AvatarGroup, Initials, ProgressBar, SectionTitle, Surface, accent } from "@/components/ui-bits";
import type { AccentKey, PropLink } from "@/lib/mock-data";
import { emptyLink, projectStats, useStore, useUserMap } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Projects — Noospace" },
      { name: "description", content: "Browse every project, its team, links and live completion percentage." },
      { property: "og:title", content: "Projects — Noospace" },
      { property: "og:description", content: "Browse every project, its team, links and live completion." },
    ],
  }),
  component: ProjectsPage,
});

const accents: AccentKey[] = ["blue", "pink", "green", "peach", "lilac"];

function CreateProjectDialog() {
  const { users, addProject, currentUser } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<string[]>([currentUser.id]);
  const [leader, setLeader] = useState(currentUser.id);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [links, setLinks] = useState<PropLink[]>([]);
  const [query, setQuery] = useState("");
  const [deductionMark, setDeductionMark] = useState(5);
  const [allowSelfSchedule, setAllowSelfSchedule] = useState(false);
  const [markDeduction, setMarkDeduction] = useState(true);
  const [showScheduleCount, setShowScheduleCount] = useState(false);
  const [isVideoProject, setIsVideoProject] = useState(false);
  const [videoBatchSize, setVideoBatchSize] = useState(10);

  const filtered = users.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()));

  const submit = () => {
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }
    addProject({
      name,
      description,
      visibility,
      accent: accents[Math.floor(Math.random() * accents.length)]!,
      leaderId: leader,
      memberIds: Array.from(new Set([...members, leader])),
      links: links.filter((l) => l.label || l.value),
      deductionMark,
      settings: { allowSelfSchedule, markDeduction, showScheduleCount },
      isVideoProject,
      videoBatchSize,
    });
    toast.success("Project created");
    setOpen(false);
    setName("");
    setDescription("");
    setLinks([]);
    setAllowSelfSchedule(false);
    setMarkDeduction(true);
    setShowScheduleCount(false);
    setIsVideoProject(false);
    setVideoBatchSize(10);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Plus className="mr-1 size-4" /> New project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create a project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Project name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aurora Design System" className="rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Label>Team members</Label>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people…"
              className="rounded-xl"
            />
            <div className="flex flex-wrap gap-2 pt-1">
              {filtered.map((u) => {
                const on = members.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setMembers(on ? members.filter((m) => m !== u.id) : [...members, u.id])}
                    className={cn(
                      "flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-xs font-medium transition-colors",
                      on ? "bg-primary text-primary-foreground" : "bg-secondary",
                    )}
                  >
                    <Initials user={u} size={22} />
                    {u.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Team leader</Label>
              <select
                value={leader}
                onChange={(e) => setLeader(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Deduction mark</Label>
              <Input
                type="number"
                value={deductionMark}
                onChange={(e) => setDeductionMark(Number(e.target.value))}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Project links (props)</Label>
              <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={() => setLinks([...links, emptyLink()])}>
                <Plus className="mr-1 size-3.5" /> Add link
              </Button>
            </div>
            {links.map((l, i) => (
              <div key={l.id} className="grid grid-cols-[1fr_1.4fr_auto] gap-2">
                <Input
                  placeholder="Label"
                  value={l.label}
                  className="rounded-xl"
                  onChange={(e) => setLinks(links.map((x, xi) => (xi === i ? { ...x, label: e.target.value } : x)))}
                />
                <Input
                  placeholder="URL — leave empty for an email"
                  value={l.value}
                  className="rounded-xl"
                  onChange={(e) =>
                    setLinks(
                      links.map((x, xi) =>
                        xi === i
                          ? { ...x, value: e.target.value, url: e.target.value.includes("@") ? "" : e.target.value }
                          : x,
                      ),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-xl"
                  onClick={() => setLinks(links.filter((_, xi) => xi !== i))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground">
              Entries containing “@” with no URL are treated as emails — copy only, no open action.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="rounded-xl" />
          </div>

          <div className="rounded-2xl bg-secondary p-4">
            <Label className="text-sm font-semibold">Project settings</Label>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Self schedule",
                  hint: "Members can propose schedules",
                  checked: allowSelfSchedule,
                  set: setAllowSelfSchedule,
                },
                {
                  label: "Mark deduction",
                  hint: "Missed work affects punctuality",
                  checked: markDeduction,
                  set: setMarkDeduction,
                },
                {
                  label: "Schedule count",
                  hint: "Show live schedule totals",
                  checked: showScheduleCount,
                  set: setShowScheduleCount,
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-2 rounded-xl bg-card p-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium">{item.label}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{item.hint}</p>
                  </div>
                  <Switch checked={item.checked} onCheckedChange={item.set} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-secondary p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label htmlFor="video-project" className="text-sm font-semibold">
                  This is a video editing project
                </Label>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Enables approved-video counters and batch payout tracking.
                </p>
              </div>
              <Switch id="video-project" checked={isVideoProject} onCheckedChange={setIsVideoProject} />
            </div>
            {isVideoProject ? (
              <div className="mt-3 max-w-xs space-y-1.5">
                <Label>Videos per payout batch</Label>
                <Input
                  type="number"
                  min={1}
                  value={videoBatchSize}
                  onChange={(e) => setVideoBatchSize(Math.max(1, Number(e.target.value)))}
                  className="rounded-xl bg-card"
                />
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Visibility</Label>
            <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as "public" | "private")} className="flex gap-6">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="public" id="vis-public" />
                <Label htmlFor="vis-public" className="font-normal">Public</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="private" id="vis-private" />
                <Label htmlFor="vis-private" className="font-normal">Private</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox id="notify" defaultChecked />
            <Label htmlFor="notify" className="text-xs font-normal text-muted-foreground">
              Notify members when the first schedule is published
            </Label>
          </div>

          <Button className="w-full rounded-xl" onClick={submit}>
            Create project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProjectsPage() {
  const { projects, setProjectPinned } = useStore();
  const userMap = useUserMap();
  const navigate = useNavigate();
  const orderedProjects = [...projects].sort((a, b) => (b.pinnedAt ?? 0) - (a.pinnedAt ?? 0));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">Projects</h1>
        </div>
        <CreateProjectDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {orderedProjects.map((p) => {
          const stats = projectStats(p);
          const openProject = () => navigate({ to: "/projects/$projectId", params: { projectId: p.id } });
          return (
            <Surface
              key={p.id}
              hover
              className="h-full cursor-pointer"
              role="link"
              tabIndex={0}
              aria-label={`Open project ${p.name}`}
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("a, button")) return;
                void openProject();
              }}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  void openProject();
                }
              }}
            >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span className={cn("grid size-10 place-items-center rounded-2xl text-xs font-bold", accent[p.accent].soft)}>
                    {p.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant={p.pinnedAt ? "secondary" : "ghost"}
                      size="sm"
                      className="h-8 rounded-full px-2.5 text-[11px]"
                      aria-label={p.pinnedAt ? `Unpin ${p.name}` : `Pin ${p.name} to top`}
                      onClick={() => {
                        setProjectPinned(p.id, !p.pinnedAt);
                        toast.success(p.pinnedAt ? "Project unpinned" : "Project pinned to top");
                      }}
                    >
                      <Pin className={cn("mr-1 size-3.5", p.pinnedAt && "fill-current")} />
                      {p.pinnedAt ? "Pinned" : "Pin to top"}
                    </Button>
                    <Button asChild variant="ghost" size="icon" className="size-8 rounded-full">
                      <Link to="/projects/$projectId/advance" params={{ projectId: p.id }} aria-label={`Advance info for ${p.name}`}>
                        <FileText className="size-3.5" />
                      </Link>
                    </Button>
                    {p.isCompleted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-status-approved/15 px-2.5 py-1 text-[11px] font-semibold text-status-approved">
                        <CheckCircle2 className="size-3.5" /> Completed
                      </span>
                    ) : null}
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium capitalize text-muted-foreground">
                      {p.visibility}
                    </span>
                  </div>
                </div>
                <Link to="/projects/$projectId" params={{ projectId: p.id }} className="block">
                  <h3 className="truncate text-base font-semibold">{p.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                </Link>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                    <span>Completion</span>
                    <span className="text-foreground">{stats.completion}%</span>
                  </div>
                  <ProgressBar value={stats.completion} tone={p.accent} />
                </div>
                {p.settings.showScheduleCount ? (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <span className="rounded-xl bg-secondary px-2 py-1 text-muted-foreground">
                      {p.schedules.length} schedules
                    </span>
                    <span className="rounded-xl bg-secondary px-2 py-1 text-muted-foreground">
                      {stats.tasks.length} tasks
                    </span>
                  </div>
                ) : null}
                <div className="mt-4 flex items-center justify-between">
                  <AvatarGroup people={p.memberIds.map((id) => userMap[id]!).filter(Boolean)} />
                  <span className="truncate text-[11px] text-muted-foreground">
                    Lead · {userMap[p.leaderId]?.name.split(" ")[0]}
                  </span>
                </div>
              </Surface>
          );
        })}
      </div>
    </div>
  );
}
