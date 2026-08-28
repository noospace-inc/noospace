import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ClipboardList, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, Initials, SectionTitle, StatusPill, Surface } from "@/components/ui-bits";
import { iso } from "@/lib/mock-data";
import { distributionTotals, inr, projectPunctuality, useStore, useUserMap } from "@/lib/store";

export const Route = createFileRoute("/projects/$projectId_/distribute")({
  head: () => ({
    meta: [
      { title: "Payment distribution - Noospace" },
      { name: "description", content: "Team leader flow to split a received payment across members by video name." },
      { property: "og:title", content: "Payment distribution - Noospace" },
      { property: "og:description", content: "Split a received payment across members by video name." },
    ],
  }),
  component: DistributePage,
});

type ReviewRow = {
  name: string;
  userId: string | null;
  amount: number;
  score?: number;
};

type DistributionMode = "videos" | "all";

function DistributePage() {
  const { projectId } = Route.useParams();
  const { projects, currentUser, addDistribution } = useStore();
  const userMap = useUserMap();
  const project = projects.find((p) => p.id === projectId);
  if (!project) throw notFound();

  const isLeader = currentUser.id === project.leaderId;
  const totals = distributionTotals(project);
  const [date, setDate] = useState(iso(new Date()));
  const [received, setReceived] = useState(project.payment.perPersonRate ? project.payment.perPersonRate * 10 : 0);
  const [perPerson, setPerPerson] = useState(project.payment.perPersonRate || 0);
  const [mode, setMode] = useState<DistributionMode>("videos");
  const [videoText, setVideoText] = useState("");
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});

  const tasks = useMemo(
    () =>
      project.schedules.flatMap((s) =>
        s.tasks.map((t) => ({
          ...t,
          scheduleDate: s.startDate,
        })),
      ),
    [project.schedules],
  );

  const completedItems = tasks.filter((t) => t.status === "approved");

  const match = (name: string) => {
    const cleaned = name.trim().toLowerCase();
    if (!cleaned) return null;
    return tasks.find(
      (t) => (t.videoName ?? "").toLowerCase() === cleaned || t.label.toLowerCase().includes(cleaned),
    );
  };

  const names = useMemo(
    () =>
      videoText
        .split(/\r?\n|,/)
        .map((v) => v.trim())
        .filter(Boolean),
    [videoText],
  );

  const videoReviewRows: ReviewRow[] = names.map((name) => {
    const owner = match(name)?.userId ?? null;
    return { name, userId: owner, amount: adjustments[name] ?? perPerson };
  });

  const allReviewRows: ReviewRow[] = project.memberIds.map((userId) => {
    const score = projectPunctuality(project, userId);
    const name = userMap[userId]?.name ?? "Unknown member";
    return {
      name,
      userId,
      score,
      amount: adjustments[name] ?? Math.round(perPerson * (score / 100)),
    };
  });

  const reviewRows = mode === "all" ? allReviewRows : videoReviewRows;
  const matched = reviewRows.filter((r) => r.userId);
  const unmatched = mode === "videos" ? reviewRows.filter((r) => !r.userId).map((r) => r.name) : [];
  const allocated = matched.reduce((sum, r) => sum + r.amount, 0);

  const memberReview = Object.values(
    matched.reduce<Record<string, { userId: string; videoNames: string[]; amount: number }>>((acc, row) => {
      const cur = acc[row.userId!] ?? { userId: row.userId!, videoNames: [], amount: 0 };
      cur.videoNames.push(mode === "all" ? "To all" : row.name);
      cur.amount += row.amount;
      acc[row.userId!] = cur;
      return acc;
    }, {}),
  );

  if (!isLeader) {
    return (
      <Surface>
        <EmptyState title="Team leader only" description="Payment distribution is restricted to the leader of this project." />
      </Surface>
    );
  }

  const submit = () => {
    if (!received || received <= 0) {
      toast.error("Enter the amount received");
      return;
    }
    if (!matched.length) {
      toast.error(mode === "all" ? "Add at least one project member" : "Add at least one video that matches a completed task");
      return;
    }
    addDistribution(project.id, {
      date,
      amountReceived: received,
      perPerson,
      allocations: memberReview,
      unmatched,
    });
    toast.success("Distribution recorded");
    setReceived(0);
    setVideoText("");
    setAdjustments({});
  };

  return (
    <div className="space-y-4">
      <Link
        to="/projects/$projectId"
        params={{ projectId: project.id }}
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> {project.name}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-3xl">Payment distribution</h1>
        <span className="w-full rounded-full bg-secondary px-3 py-1.5 text-center text-xs font-medium text-muted-foreground sm:w-auto">
          Allocated: {inr(allocated)} / Received: {inr(received)}
        </span>
      </div>

      <Surface className="p-4 sm:p-5">
        <SectionTitle title="Dashboard" />
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          <div className="rounded-2xl bg-brand-blue-soft p-3 sm:p-4">
            <p className="break-words text-lg font-bold sm:text-xl">{inr(totals.received)}</p>
            <p className="text-[11px] text-muted-foreground">Total received</p>
          </div>
          <div className="rounded-2xl bg-brand-green-soft p-3 sm:p-4">
            <p className="break-words text-lg font-bold sm:text-xl">{inr(totals.distributed)}</p>
            <p className="text-[11px] text-muted-foreground">Distributed</p>
          </div>
          <div className="rounded-2xl bg-brand-peach-soft p-3 sm:p-4">
            <p className="break-words text-lg font-bold sm:text-xl">{inr(totals.commission)}</p>
            <p className="text-[11px] text-muted-foreground">Commission</p>
          </div>
          <div className="rounded-2xl bg-brand-lilac-soft p-3 sm:p-4">
            <p className="text-lg font-bold sm:text-xl">{project.distributions.length}</p>
            <p className="text-[11px] text-muted-foreground">Runs</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {project.memberIds.map((id) =>
            userMap[id] ? (
              <div key={id} className="flex items-center gap-3 rounded-2xl bg-secondary p-3">
                <Initials user={userMap[id]!} size={32} />
                <p className="min-w-0 flex-1 truncate text-sm font-medium">{userMap[id]!.name}</p>
                <span className="text-xs font-semibold">{inr(totals.perMember[id] ?? 0)}</span>
              </div>
            ) : null,
          )}
        </div>
      </Surface>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
        <div className="flex flex-col gap-4">
          <Surface className="order-2 p-4 sm:p-5">
            <SectionTitle title="Completed items" />
            {completedItems.length === 0 ? (
              <EmptyState title="No approved work yet" description="Approved scheduled items will appear here for payment review." />
            ) : (
              <>
              <div className="space-y-2 md:hidden">
                {completedItems.map((t) => {
                  const paid = project.distributions.some((d) =>
                    d.allocations.some((a) => a.videoNames.includes(t.videoName ?? t.label)),
                  );
                  return (
                    <div key={t.id} className="rounded-2xl bg-secondary p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{t.videoName ?? t.label}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {userMap[t.userId]?.name ?? "-"} - {t.scheduleDate}
                          </p>
                        </div>
                        <StatusPill status={t.status} compact />
                      </div>
                      <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                        Payment: <span className={paid ? "text-status-approved" : "text-status-pending"}>{paid ? "Received" : "Pending"}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="no-scrollbar hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedItems.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="min-w-[180px] text-xs font-medium">{t.videoName ?? t.label}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{userMap[t.userId]?.name ?? "-"}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{t.scheduleDate}</TableCell>
                        <TableCell>
                          <StatusPill status={t.status} compact />
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {project.distributions.some((d) => d.allocations.some((a) => a.videoNames.includes(t.videoName ?? t.label)))
                            ? "Received"
                            : "Pending"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              </>
            )}
          </Surface>

          <Surface className="order-1 p-4 sm:p-5">
            <SectionTitle title="Distribute payment" />
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Amount received</Label>
                <Input type="number" value={received} onChange={(e) => setReceived(Number(e.target.value))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Payment per person</Label>
                <Input type="number" value={perPerson} onChange={(e) => setPerPerson(Number(e.target.value))} className="rounded-xl" />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label className="text-xs text-muted-foreground">Distribution option</Label>
              <div className="flex w-full gap-1 rounded-full bg-secondary p-1 sm:w-fit">
                {([
                  ["videos", "By video names"],
                  ["all", "To all"],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMode(key)}
                    className={`flex-1 rounded-full px-4 py-2 text-xs font-semibold sm:flex-none ${
                      mode === key ? "bg-card text-foreground shadow-card" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {mode === "videos" ? (
              <div className="mt-4 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Video names</Label>
                <Textarea
                  value={videoText}
                  onChange={(e) => setVideoText(e.target.value)}
                  rows={5}
                  className="rounded-xl"
                  placeholder="VX-001&#10;VX-002&#10;VX-004"
                />
              </div>
            ) : null}

            <div className="mt-4 grid gap-2 rounded-2xl bg-secondary p-3 sm:grid-cols-3 sm:gap-3 sm:p-4">
              <div>
                <p className="break-words text-base font-bold sm:text-lg">{inr(allocated)}</p>
                <p className="text-[11px] text-muted-foreground">Allocated</p>
              </div>
              <div>
                <p className="break-words text-base font-bold sm:text-lg">{inr(received)}</p>
                <p className="text-[11px] text-muted-foreground">Received</p>
              </div>
              <div>
                <p className="break-words text-base font-bold sm:text-lg">{inr(received - allocated)}</p>
                <p className="text-[11px] text-muted-foreground">Commission</p>
              </div>
            </div>

            <div className="mt-4">
              <SectionTitle title="Review matches" />
              {reviewRows.length === 0 ? (
                <EmptyState
                  title={mode === "all" ? "No project members" : "Paste video names"}
                  description={mode === "all" ? "Add project members before distributing to all." : "Matched members and payment totals will be calculated here."}
                />
              ) : (
                <div className="space-y-2">
                  {reviewRows.map((row) => (
                    <div
                      key={row.name}
                      className={`grid gap-2 rounded-2xl p-3 md:grid-cols-[minmax(0,1fr)_150px_auto] lg:grid-cols-[minmax(0,1fr)_160px_130px] ${
                        row.userId ? "bg-secondary" : "bg-status-overdue/10"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{row.name}</p>
                        <p className={row.userId ? "text-[11px] text-muted-foreground" : "text-[11px] font-semibold text-status-overdue"}>
                          {row.userId
                            ? mode === "all"
                              ? `${row.score}% punctual on this project`
                              : userMap[row.userId]?.name
                            : "Unmatched video name"}
                        </p>
                      </div>
                      <Input
                        type="number"
                        value={row.amount}
                        disabled={!row.userId}
                        className="h-9 rounded-xl bg-card"
                        onChange={(e) => setAdjustments({ ...adjustments, [row.name]: Number(e.target.value) })}
                      />
                      {mode === "videos" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="justify-center rounded-full md:justify-start"
                          onClick={() => setVideoText(names.filter((n) => n !== row.name).join("\n"))}
                        >
                          <Trash2 className="mr-1 size-3.5" /> Remove
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button className="mt-4 w-full rounded-xl" onClick={submit}>
              <Plus className="mr-1 size-4" /> Save distribution
            </Button>
          </Surface>
        </div>

        <div className="space-y-4">
          <Surface className="p-4 sm:p-5">
            <SectionTitle title="Current review" action={<ClipboardList className="size-4 text-muted-foreground" />} />
            {memberReview.length === 0 ? (
              <EmptyState title="No matched members" description="Matched payment allocations will be summarized here." />
            ) : (
              <div className="space-y-2">
                {memberReview.map((row) => (
                  <div key={row.userId} className="rounded-2xl bg-secondary p-3">
                    <div className="flex items-center gap-2">
                      {userMap[row.userId] ? <Initials user={userMap[row.userId]!} size={28} /> : null}
                      <p className="min-w-0 flex-1 truncate text-sm font-medium">{userMap[row.userId]?.name ?? "Unknown"}</p>
                      <span className="text-xs font-bold">{inr(row.amount)}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-[11px] text-muted-foreground">{row.videoNames.join(", ")}</p>
                  </div>
                ))}
              </div>
            )}
          </Surface>
        </div>
      </div>

      <Surface className="p-4 sm:p-5">
        <SectionTitle title="Payment history" />
        {project.distributions.length === 0 ? (
          <EmptyState title="No distributions yet" description="Record your first payment split and it will be listed here." />
        ) : (
          <>
          <div className="space-y-2 md:hidden">
            {project.distributions.map((d) => {
              const distributed = d.allocations.reduce((s, a) => s + a.amount, 0);
              return (
                <div key={d.id} className="rounded-2xl bg-secondary p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">
                        {new Date(d.date + "T00:00:00").toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">Per person: {inr(d.perPerson)}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold">{inr(distributed)}</p>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Received: {inr(d.amountReceived)}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                    {d.allocations.map((a) => `${userMap[a.userId]?.name ?? "?"} (${a.videoNames.length})`).join(", ")}
                  </p>
                  {d.unmatched.length ? <p className="mt-1 text-[11px] text-status-overdue">Unmatched: {d.unmatched.join(", ")}</p> : null}
                </div>
              );
            })}
          </div>
          <div className="no-scrollbar hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Per person</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Unmatched</TableHead>
                  <TableHead className="text-right">Distributed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.distributions.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {new Date(d.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-xs">{inr(d.amountReceived)}</TableCell>
                    <TableCell className="text-xs">{inr(d.perPerson)}</TableCell>
                    <TableCell className="min-w-[220px] text-xs">
                      {d.allocations.map((a) => `${userMap[a.userId]?.name ?? "?"} (${a.videoNames.length})`).join(", ")}
                    </TableCell>
                    <TableCell className="text-xs text-status-overdue">{d.unmatched.join(", ")}</TableCell>
                    <TableCell className="text-right text-xs font-semibold">
                      {inr(d.allocations.reduce((s, a) => s + a.amount, 0))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          </>
        )}
      </Surface>
    </div>
  );
}
