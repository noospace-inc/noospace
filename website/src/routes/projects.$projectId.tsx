import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Check, CheckCircle2, FileText, Pencil, Plus, Settings2, Trash2, Wallet, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ScheduleTimeline } from "@/components/schedule-timeline";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AvatarGroup,
  EmptyState,
  Initials,
  LinkChip,
  ProgressBar,
  SectionTitle,
  StatusPill,
  Surface,
  accent,
} from "@/components/ui-bits";
import { iso, type PropLink, type Task } from "@/lib/mock-data";
import { emptyLink, projectPunctuality, projectStats, useStore, useUserMap, videoStats } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project detail — Noospace" },
      { name: "description", content: "Schedule timeline, team tasks, approvals and project links." },
      { property: "og:title", content: "Project detail — Noospace" },
      { property: "og:description", content: "Schedule timeline, team tasks, approvals and project links." },
    ],
  }),
  component: ProjectDetail,
});

function AddScheduleDialog({
  projectId,
  memberIds,
  open,
  setOpen,
  presetDate,
}: {
  projectId: string;
  memberIds: string[];
  open: boolean;
  setOpen: (v: boolean) => void;
  presetDate?: string | undefined;
}) {
  const { addSchedule, currentUser, projects } = useStore();
  const userMap = useUserMap();
  const [date, setDate] = useState(presetDate ?? iso(new Date()));
  const [days, setDays] = useState(2);
  const [isLast, setIsLast] = useState(false);
  const [tasks, setTasks] = useState<Record<string, string[]>>({});
  const project = projects.find((p) => p.id === projectId);
  const isLeader = project?.leaderId === currentUser.id || currentUser.role === "admin";

  const add = () => {
    const flat: Omit<Task, "id">[] = Object.entries(tasks).flatMap(([userId, list]) =>
      list.filter((l) => l.trim()).map((label) => ({ userId, label, status: "pending" as const, deduction: null })),
    );
    if (!flat.length) {
      toast.error("Add at least one task");
      return;
    }
    addSchedule(projectId, {
      startDate: presetDate ?? date,
      days,
      isLast,
      proposed: !isLeader,
      tasks: flat.map((t, i) => ({ ...t, id: `nt_${Date.now()}_${i}` })),
    });
    toast.success(isLeader ? "Schedule added" : "Schedule proposal added");
    setOpen(false);
    setTasks({});
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add schedule</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Input type="date" value={presetDate ?? date} onChange={(e) => setDate(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Duration (days)</Label>
              <Input type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-xl" />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Tasks per member</Label>
            {memberIds.map((id) => (
              <div key={id} className="rounded-2xl bg-secondary p-3">
                <div className="flex items-center gap-2">
                  {userMap[id] ? <Initials user={userMap[id]!} size={26} /> : null}
                  <span className="text-sm font-medium">{userMap[id]?.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-auto rounded-full"
                    onClick={() => setTasks({ ...tasks, [id]: [...(tasks[id] ?? []), ""] })}
                  >
                    <Plus className="mr-1 size-3.5" /> Add task
                  </Button>
                </div>
                {(tasks[id] ?? []).map((value, i) => (
                  <div key={i} className="mt-2 flex items-start gap-2">
                    <Textarea
                      value={value}
                      placeholder="Task description"
                      rows={6}
                      aria-label={`Task description for ${userMap[id]?.name ?? "team member"}`}
                      className="min-h-32 min-w-0 flex-1 resize-y rounded-xl bg-card"
                      onChange={(e) =>
                        setTasks({ ...tasks, [id]: (tasks[id] ?? []).map((v, vi) => (vi === i ? e.target.value : v)) })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-xl"
                      onClick={() => setTasks({ ...tasks, [id]: (tasks[id] ?? []).filter((_, vi) => vi !== i) })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="last" checked={isLast} onCheckedChange={(v) => setIsLast(!!v)} />
            <Label htmlFor="last" className="font-normal">Set as last schedule</Label>
          </div>

          <Button className="w-full rounded-xl" onClick={add}>
            Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const { projects, users, currentUser, updateProjectDetails } = useStore();
  const userMap = useUserMap();
  const [addOpen, setAddOpen] = useState(false);
  const [presetDate, setPresetDate] = useState<string | undefined>();
  const [manage, setManage] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editMembers, setEditMembers] = useState<string[]>([]);
  const [editLinks, setEditLinks] = useState<PropLink[]>([]);
  const [memberQuery, setMemberQuery] = useState("");

  const project = projects.find((p) => p.id === projectId);
  if (!project) throw notFound();

  const stats = projectStats(project);
  const isAdmin = currentUser.role === "admin";
  const isLeader = currentUser.id === project.leaderId;
  const canManageProject = isLeader || isAdmin;
  const canSelfSchedule = project.settings.allowSelfSchedule && project.memberIds.includes(currentUser.id);
  const canCreateSchedule = canManageProject || canSelfSchedule;
  const members = project.memberIds.map((id) => userMap[id]!).filter(Boolean);
  const vStats = videoStats(project);

  const startEdit = () => {
    setForm({ name: project.name, description: project.description });
    setEditMembers(project.memberIds);
    setEditLinks(project.links);
    setMemberQuery("");
    setEditing(true);
  };

  const startAddLink = () => {
    setForm({ name: project.name, description: project.description });
    setEditMembers(project.memberIds);
    setEditLinks([...project.links, emptyLink()]);
    setMemberQuery("");
    setEditing(true);
  };

  const saveEdit = () => {
    if (!form.name.trim()) {
      toast.error("Project name can't be empty");
      return;
    }
    const changes: string[] = [];
    if (form.name !== project.name) changes.push(`name → “${form.name}”`);
    if (form.description !== project.description) changes.push("description updated");
    if (editMembers.join(",") !== project.memberIds.join(",")) changes.push("team updated");
    if (editLinks.length !== project.links.length || editLinks.some((l, i) => l.label !== project.links[i]?.label || l.value !== project.links[i]?.value)) {
      changes.push("links updated");
    }
    updateProjectDetails(
      project.id,
      {
        name: form.name,
        description: form.description,
        memberIds: Array.from(new Set([project.leaderId, ...editMembers])),
        links: editLinks.filter((l) => l.label || l.value),
      },
      changes.length ? `Edited project ${changes.join(", ")}` : "Saved project details with no changes",
    );
    setEditing(false);
    toast.success("Project details saved");
  };
  const hasProjectChanges =
    form.name !== project.name ||
    form.description !== project.description ||
    editMembers.join(",") !== project.memberIds.join(",") ||
    editLinks.length !== project.links.length ||
    editLinks.some((link, index) =>
      link.id !== project.links[index]?.id ||
      link.label !== project.links[index]?.label ||
      link.value !== project.links[index]?.value ||
      link.url !== project.links[index]?.url,
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to="/projects" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> All projects
        </Link>
        <div className="flex w-full flex-nowrap gap-1.5 sm:w-auto sm:flex-wrap sm:gap-2">
          {canManageProject ? (
            <Button size="sm" variant="secondary" className="min-w-0 rounded-full px-3 text-xs sm:px-4 sm:text-sm" onClick={startEdit}>
              <Pencil className="mr-1 size-3.5" /> Edit
            </Button>
          ) : null}
          <Button asChild variant="secondary" size="sm" className="min-w-0 rounded-full px-3 text-xs sm:px-4 sm:text-sm">
            <Link to="/projects/$projectId/advance" params={{ projectId: project.id }}>
              <FileText className="mr-1 size-3.5" />
              <span className="sm:hidden">Info</span>
              <span className="hidden sm:inline">Advance info</span>
            </Link>
          </Button>
          {canManageProject ? (
            <Button asChild variant="secondary" size="sm" className="min-w-0 rounded-full px-3 text-xs sm:px-4 sm:text-sm">
              <Link to="/projects/$projectId/distribute" params={{ projectId: project.id }}>
                <Wallet className="mr-1 size-3.5" />
                <span className="sm:hidden">Pay</span>
                <span className="hidden sm:inline">Distribute payment</span>
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <Surface className="p-4 sm:p-6">
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_180px] md:items-start">
          <div className="min-w-0">
            {editing ? (
              <div className="space-y-2">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl text-lg font-semibold" />
                <Textarea
                  value={form.description}
                  rows={3}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="rounded-xl"
                />
                <div className="space-y-2 rounded-2xl bg-secondary p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-muted-foreground">Project links</Label>
                    <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={() => setEditLinks([...editLinks, emptyLink()])}>
                      <Plus className="mr-1 size-3.5" /> Add link
                    </Button>
                  </div>
                  {editLinks.map((l, i) => (
                    <div key={l.id} className="grid gap-2 sm:grid-cols-[1fr_1.5fr_auto]">
                      <Input
                        placeholder="Label"
                        value={l.label}
                        className="rounded-xl bg-card"
                        onChange={(e) => setEditLinks(editLinks.map((x, xi) => (xi === i ? { ...x, label: e.target.value } : x)))}
                      />
                      <Input
                        placeholder="URL or email"
                        value={l.value}
                        className="rounded-xl bg-card"
                        onChange={(e) =>
                          setEditLinks(
                            editLinks.map((x, xi) =>
                              xi === i
                                ? { ...x, value: e.target.value, url: e.target.value.includes("@") ? "" : e.target.value }
                                : x,
                            ),
                          )
                        }
                      />
                      <Button type="button" variant="ghost" size="icon" className="rounded-xl" onClick={() => setEditLinks(editLinks.filter((_, xi) => xi !== i))}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 rounded-2xl bg-secondary p-3">
                  <Label className="text-xs text-muted-foreground">Team members</Label>
                  <Input
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    placeholder="Search people"
                    className="rounded-xl bg-card"
                  />
                  <div className="flex flex-wrap gap-2">
                    {users
                      .filter((u) => (u.name + u.email).toLowerCase().includes(memberQuery.toLowerCase()))
                      .map((u) => {
                        const selected = editMembers.includes(u.id);
                        const locked = u.id === project.leaderId;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            disabled={locked}
                            onClick={() => setEditMembers(selected ? editMembers.filter((id) => id !== u.id) : [...editMembers, u.id])}
                            className={cn(
                              "flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-xs font-medium transition-colors disabled:opacity-70",
                              selected ? "bg-primary text-primary-foreground" : "bg-card text-foreground",
                            )}
                          >
                            <Initials user={u} size={22} />
                            {u.name}
                            {locked ? " (lead)" : null}
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight sm:text-3xl">{project.name}</h1>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium capitalize text-muted-foreground">
                    {project.visibility}
                  </span>
                  {project.isCompleted ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-status-approved/15 px-2.5 py-1 text-[11px] font-semibold text-status-approved">
                      <CheckCircle2 className="size-3.5" /> Completed
                    </span>
                  ) : null}
                  {project.isVideoProject ? (
                    <span className="rounded-full bg-brand-lilac-soft px-2.5 py-1 text-[11px] font-medium">Video editing</span>
                  ) : null}
                </div>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{project.description}</p>
              </>
            )}
            {project.links.length ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {project.links.map((l) => (
                  <LinkChip key={l.id} link={l} />
                ))}
                {canManageProject ? (
                  <Button type="button" variant="secondary" size="icon" className="size-8 rounded-full" aria-label="Add project link" onClick={startAddLink}>
                    <Plus className="size-4" />
                  </Button>
                ) : null}
              </div>
            ) : canManageProject ? (
              <div className="mt-4">
                <Button type="button" variant="secondary" size="sm" className="rounded-full" onClick={startAddLink}>
                  <Plus className="mr-1 size-3.5" /> Add project link
                </Button>
              </div>
            ) : null}
          </div>
          <div className="w-full shrink-0 rounded-2xl bg-secondary/60 p-3 md:w-40 md:bg-transparent md:p-0">
            {canManageProject ? (
              <div className="mb-3 flex items-center justify-between gap-3 md:justify-end">
                <Label htmlFor="project-completed" className="text-[11px] font-medium text-muted-foreground md:text-right">
                  Mark project completed
                </Label>
                <Switch
                  id="project-completed"
                  checked={Boolean(project.isCompleted)}
                  onCheckedChange={(checked) => {
                    updateProjectDetails(project.id, { isCompleted: checked }, checked ? "Marked project as completed" : "Reopened project");
                    toast.success(checked ? "Project marked completed" : "Project reopened");
                  }}
                  aria-label="Mark project as completed"
                />
              </div>
            ) : null}
            <div className="mb-2 flex items-baseline justify-between gap-3 md:block">
              <p className="text-2xl font-bold sm:text-3xl md:text-right">{stats.completion}%</p>
              <p className="text-[11px] text-muted-foreground md:text-right">complete</p>
            </div>
            <ProgressBar value={stats.completion} tone={project.accent} />
            <div className="mt-3 flex md:justify-end">
              <AvatarGroup people={members} />
            </div>
          </div>
        </div>
        {editing ? (
          <div className="sticky bottom-3 z-10 mt-4 flex justify-end gap-2 bg-transparent p-0">
            {hasProjectChanges ? (
              <Button size="sm" className="rounded-full" onClick={saveEdit}>
                <Check className="mr-1 size-3.5" /> Save
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setEditing(false)}>
              <X className="mr-1 size-3.5" /> Cancel
            </Button>
          </div>
        ) : null}
      </Surface>

      {project.isVideoProject ? (
        <Surface>
          <SectionTitle title="Video delivery counter" subtitle={`Payout released every ${vStats.batch} approved videos`} />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Approved videos", value: vStats.approved, tone: "bg-brand-green-soft" },
              { label: "Non-approved", value: vStats.pending, tone: "bg-brand-peach-soft" },
              { label: "Combined total", value: vStats.total, tone: "bg-brand-blue-soft" },
              { label: "Payouts released", value: vStats.payouts, tone: "bg-brand-lilac-soft" },
            ].map((c) => (
              <div key={c.label} className={`rounded-2xl p-4 ${c.tone}`}>
                <p className="text-2xl font-bold">{c.value}</p>
                <p className="text-[11px] text-muted-foreground">{c.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
              <span>Progress to next payment threshold</span>
              <span className="text-foreground">
                {vStats.inBatch}/{vStats.batch}
              </span>
            </div>
            <ProgressBar value={Math.round((vStats.inBatch / vStats.batch) * 100)} tone={project.accent} />
          </div>
        </Surface>
      ) : null}

      {project.settings.showScheduleCount ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Schedules", value: project.schedules.length, tone: "bg-brand-blue-soft" },
            { label: "Scheduled tasks", value: stats.tasks.length, tone: "bg-brand-green-soft" },
            { label: "Approved", value: stats.approved, tone: "bg-brand-lilac-soft" },
            { label: "Pending", value: stats.tasks.length - stats.approved, tone: "bg-brand-peach-soft" },
          ].map((item) => (
            <div key={item.label} className={`rounded-2xl p-4 shadow-card ${item.tone}`}>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-[11px] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      <Surface>
        <SectionTitle
          title={manage ? "Create / edit schedule" : "Schedule timeline"}
          subtitle={manage ? "Completed dates are greyed out and locked" : "Click any block to see each member's task"}
          action={
            canCreateSchedule ? (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="rounded-full" onClick={() => setManage((m) => !m)}>
                  <Settings2 className="mr-1 size-3.5" /> {manage ? "View mode" : isLeader ? "Manage" : "Set schedule"}
                </Button>
                {manage ? (
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      setPresetDate(undefined);
                      setAddOpen(true);
                    }}
                  >
                    <Plus className="mr-1 size-3.5" /> Add schedule
                  </Button>
                ) : null}
              </div>
            ) : undefined
          }
        />
        {project.schedules.length === 0 && !manage ? (
          <EmptyState
            title="No schedule yet"
            description="The team leader hasn't published a timeline for this project. Once they do, tasks appear here week by week."
          />
        ) : (
          <ScheduleTimeline
            project={project}
            mode={manage ? "manage" : "view"}
            onRequestCreate={(d) => {
              setPresetDate(d);
              setAddOpen(true);
            }}
          />
        )}
      </Surface>

      <Surface>
        <SectionTitle title="Team roster" subtitle="Punctuality updates as tasks are approved" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {members.map((m) => {
            const isLead = m.id === project.leaderId;
            const memberTasks = stats.tasks.filter((t) => t.userId === m.id);
            return (
              <div key={m.id} className={`rounded-2xl p-4 ${accent[m.accent].soft}`}>
                <div className="flex items-center gap-3">
                  <Initials user={m} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{m.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{isLead ? "Team leader" : m.title}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{memberTasks.length} tasks</span>
                  <span className="font-bold text-foreground">{projectPunctuality(project, m.id)}% punctual</span>
                </div>
                {memberTasks.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {memberTasks.slice(0, 4).map((t) => (
                      <StatusPill key={t.id} status={t.status} compact />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Surface>

      <AddScheduleDialog
        projectId={project.id}
        memberIds={project.memberIds}
        open={addOpen}
        setOpen={setAddOpen}
        presetDate={presetDate}
      />
    </div>
  );
}
