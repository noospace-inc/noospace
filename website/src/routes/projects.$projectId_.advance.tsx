import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, History, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, Initials, ProgressBar, SectionTitle, Surface } from "@/components/ui-bits";
import type { PaymentStatus } from "@/lib/mock-data";
import { distributionTotals, inr, useStore, useUserMap } from "@/lib/store";

export const Route = createFileRoute("/projects/$projectId_/advance")({
  head: () => ({
    meta: [
      { title: "Advance info — Noospace" },
      { name: "description", content: "Invoice, payment status, distribution split and the full edit history for this project." },
      { property: "og:title", content: "Advance info — Noospace" },
      { property: "og:description", content: "Invoice, payment status, distribution split and edit history." },
    ],
  }),
  component: AdvanceInfo,
});

const statuses: PaymentStatus[] = ["pending", "partial", "paid"];
const statusLabel: Record<PaymentStatus, string> = { pending: "Pending", partial: "Partially paid", paid: "Fully paid" };
const statusTone: Record<PaymentStatus, string> = {
  pending: "bg-brand-peach-soft",
  partial: "bg-brand-blue-soft",
  paid: "bg-brand-green-soft",
};

function AdvanceInfo() {
  const { projectId } = Route.useParams();
  const { projects, currentUser, updatePayment, addPaymentReceived, setDeductionMark, setProjectSetting, deleteProject } = useStore();
  const navigate = useNavigate();
  const userMap = useUserMap();
  const project = projects.find((p) => p.id === projectId);
  if (!project) throw notFound();

  const isAdmin = currentUser.role === "admin";
  const isLeader = currentUser.id === project.leaderId || isAdmin;
  const totals = distributionTotals(project);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(project.payment);
  const [addingPayment, setAddingPayment] = useState(false);
  const [showProof, setShowProof] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: "", proof: "", note: "" });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const startEdit = () => {
    setForm(project.payment);
    setEditing(true);
  };

  const save = () => {
    const diffs: string[] = [];
    if (form.invoiceNumber !== project.payment.invoiceNumber) diffs.push(`invoice no. → ${form.invoiceNumber || "—"}`);
    if (form.invoiceDate !== project.payment.invoiceDate) diffs.push("invoice date updated");
    if (form.invoiceAmount !== project.payment.invoiceAmount) diffs.push(`invoice amount → ${inr(form.invoiceAmount)}`);
    if (form.amountReceived !== project.payment.amountReceived) diffs.push(`received → ${inr(form.amountReceived)}`);
    if (form.status !== project.payment.status) diffs.push(`status → ${statusLabel[form.status]}`);
    if (form.perPersonRate !== project.payment.perPersonRate) diffs.push(`per-person rate → ${inr(form.perPersonRate)}`);
    if (form.clientName !== project.payment.clientName) diffs.push(`client → ${form.clientName || "—"}`);
    if (form.notes !== project.payment.notes) diffs.push("notes updated");
    updatePayment(project.id, form, diffs.length ? `Updated payment ${diffs.join(", ")}` : "Saved payment details");
    setEditing(false);
    toast.success("Payment details saved");
  };

  const hasPaymentChanges =
    form.invoiceNumber !== project.payment.invoiceNumber ||
    form.invoiceDate !== project.payment.invoiceDate ||
    form.clientName !== project.payment.clientName ||
    form.invoiceAmount !== project.payment.invoiceAmount ||
    form.amountReceived !== project.payment.amountReceived ||
    form.status !== project.payment.status ||
    form.perPersonRate !== project.payment.perPersonRate ||
    form.notes !== project.payment.notes;

  const cancelEdit = () => {
    setForm(project.payment);
    setEditing(false);
  };

  const received = project.payment.amountReceived;
  const invoiced = project.payment.invoiceAmount;
  const pct = invoiced > 0 ? Math.min(100, Math.round((received / invoiced) * 100)) : received > 0 ? 100 : 0;

  const submitPaymentReceived = () => {
    const amount = Number(paymentForm.amount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }
    addPaymentReceived(project.id, {
      date: new Date().toISOString().slice(0, 10),
      amount,
      ...(paymentForm.proof.trim() ? { proof: paymentForm.proof.trim() } : {}),
      ...(paymentForm.note.trim() ? { note: paymentForm.note.trim() } : {}),
    });
    toast.success("Payment added");
    setPaymentForm({ amount: "", proof: "", note: "" });
    setAddingPayment(false);
    setShowProof(false);
    setShowNote(false);
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
        <h1 className="text-xl font-bold tracking-tight sm:text-3xl">Advance info</h1>
        {isLeader && !editing ? (
          <Button size="sm" variant="secondary" className="rounded-full" onClick={startEdit}>
            <Pencil className="mr-1 size-3.5" /> {project.payment.configured ? "Edit" : "Add payment details"}
          </Button>
        ) : null}
      </div>

      <Tabs defaultValue="payment">
        <TabsList className="rounded-full">
          <TabsTrigger value="payment" className="rounded-full">Payment</TabsTrigger>
          <TabsTrigger value="history" className="rounded-full">History</TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="mt-4 space-y-4">
          <Surface>
            <SectionTitle title="Invoice details" subtitle="Client details, invoice date and notes" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Client">
                {editing ? (
                  <Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} className="rounded-xl" />
                ) : (
                  <Readout value={project.payment.clientName} />
                )}
              </Field>
              <Field label="Invoice date">
                {editing ? (
                  <Input type="date" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} className="rounded-xl" />
                ) : (
                  <Readout value={project.payment.invoiceDate} />
                )}
              </Field>
              <div className="sm:col-span-2">
                <Field label="Notes">
                  {editing ? (
                    <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-xl" />
                  ) : (
                    <Readout value={project.payment.notes} />
                  )}
                </Field>
              </div>
            </div>
          </Surface>

          <div className="grid gap-4 lg:grid-cols-2">
            <Surface>
              <SectionTitle
                title="Payment received"
                subtitle="Record each received payment"
                action={
                  isLeader && !addingPayment ? (
                    <Button size="sm" className="rounded-full" onClick={() => setAddingPayment(true)}>
                      <Plus className="mr-1 size-3.5" /> Add payment
                    </Button>
                  ) : undefined
                }
              />
              <p className="text-3xl font-bold">{inr(received)}</p>
              <p className="mb-3 text-[11px] text-muted-foreground">{project.paymentsReceived.length} payment entries recorded</p>
              {invoiced > 0 ? <ProgressBar value={pct} tone={project.accent} /> : null}
              {editing ? (
                <div className="mt-4">
                  <Field label="Amount received">
                    <Input
                      type="number"
                      value={form.amountReceived}
                      onChange={(e) => setForm({ ...form, amountReceived: Number(e.target.value) })}
                      className="rounded-xl"
                    />
                  </Field>
                </div>
              ) : null}
              {addingPayment ? (
                <div className="mt-4 space-y-3 rounded-2xl bg-secondary p-3">
                  <Input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="rounded-xl bg-card"
                    placeholder="Payment amount"
                  />
                  <div className="flex flex-wrap gap-3 text-[11px] font-semibold">
                    {!showProof ? (
                      <button type="button" className="text-primary" onClick={() => setShowProof(true)}>
                        Add proof
                      </button>
                    ) : null}
                    {!showNote ? (
                      <button type="button" className="text-primary" onClick={() => setShowNote(true)}>
                        Add note
                      </button>
                    ) : null}
                  </div>
                  {showProof ? (
                    <Input
                      value={paymentForm.proof}
                      onChange={(e) => setPaymentForm({ ...paymentForm, proof: e.target.value })}
                      className="rounded-xl bg-card"
                      placeholder="Payment proof link"
                    />
                  ) : null}
                  {showNote ? (
                    <Textarea
                      value={paymentForm.note}
                      onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                      className="rounded-xl bg-card"
                      rows={3}
                      placeholder="Payment note"
                    />
                  ) : null}
                  <div className="flex gap-2">
                    <Button size="sm" className="rounded-full" onClick={submitPaymentReceived}>
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full"
                      onClick={() => {
                        setAddingPayment(false);
                        setShowProof(false);
                        setShowNote(false);
                        setPaymentForm({ amount: "", proof: "", note: "" });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
              {project.paymentsReceived.length ? (
                <div className="mt-4 space-y-2">
                  {project.paymentsReceived.map((p) => (
                    <div key={p.id} className="rounded-2xl bg-secondary p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{inr(p.amount)}</p>
                          <p className="text-[11px] text-muted-foreground">{p.date}</p>
                        </div>
                        {p.proof ? (
                          <a href={p.proof} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-primary underline-offset-2 hover:underline">
                            Proof
                          </a>
                        ) : null}
                      </div>
                      {p.note ? <p className="mt-2 text-xs text-muted-foreground">{p.note}</p> : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </Surface>

            <Surface>
              <SectionTitle title="Payment status" subtitle="Set by the team leader" />
              {editing ? (
                <div className="flex flex-wrap gap-2">
                  {statuses.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, status: s })}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        form.status === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {statusLabel[s]}
                    </button>
                  ))}
                </div>
              ) : (
                <span className={`inline-block rounded-full px-3 py-1.5 text-xs font-semibold ${statusTone[project.payment.status]}`}>
                  {statusLabel[project.payment.status]}
                </span>
              )}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-secondary p-3">
                  <p className="text-lg font-bold">{inr(totals.distributed)}</p>
                  <p className="text-[11px] text-muted-foreground">Distributed</p>
                </div>
                <div className="rounded-2xl bg-secondary p-3">
                  <p className="text-lg font-bold">{inr(totals.commission)}</p>
                  <p className="text-[11px] text-muted-foreground">Commission</p>
                </div>
              </div>
            </Surface>
          </div>

          <Surface>
            <SectionTitle
              title="Payment split"
              subtitle={project.payment.perPersonRate ? `Base rate ${inr(project.payment.perPersonRate)} per video` : "Per-member distribution so far"}
            />
            {editing ? (
              <div className="mb-4 max-w-xs">
                <Field label="Payment per person / video">
                  <Input
                    type="number"
                    value={form.perPersonRate}
                    onChange={(e) => setForm({ ...form, perPersonRate: Number(e.target.value) })}
                    className="rounded-xl"
                  />
                </Field>
              </div>
            ) : null}
            {project.memberIds.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {project.memberIds.map((id) => {
                  const u = userMap[id];
                  if (!u) return null;
                  const amount = totals.perMember[id] ?? 0;
                  return (
                    <div key={id} className="flex items-center gap-3 rounded-2xl bg-secondary p-3">
                      <Initials user={u} size={36} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{u.name}</p>
                        <p className="text-[11px] text-muted-foreground">{amount ? inr(amount) : "Not paid yet"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </Surface>

          {isLeader ? (
            <Surface>
              <SectionTitle title="Project settings" subtitle="Schedule permissions and punctuality deduction rules" />
              <div className="space-y-3">
                <SettingRow
                  title="Allow self schedule"
                  description="Team members can propose their own schedules."
                  checked={project.settings.allowSelfSchedule}
                  onCheckedChange={(v) => setProjectSetting(project.id, "allowSelfSchedule", v)}
                />
                <SettingRow
                  title="Mark deductions"
                  description="Missed tasks can reduce punctuality."
                  checked={project.settings.markDeduction}
                  onCheckedChange={(v) => setProjectSetting(project.id, "markDeduction", v)}
                />
                <SettingRow
                  title="Show schedule count"
                  description="Show schedule summary boxes on the project profile."
                  checked={project.settings.showScheduleCount}
                  onCheckedChange={(v) => setProjectSetting(project.id, "showScheduleCount", v)}
                />
                <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-secondary p-3">
                  <Field label="Deduction mark">
                    <Input
                      type="number"
                      value={project.deductionMark}
                      onChange={(e) => setDeductionMark(project.id, Number(e.target.value))}
                      className="h-9 w-28 rounded-xl bg-card"
                    />
                  </Field>
                  <p className="max-w-lg text-[11px] text-muted-foreground">
                    Applied to a member's punctuality score when a task misses approval.
                  </p>
                </div>
              </div>
            </Surface>
          ) : null}
          {editing ? (
            <div className="sticky bottom-3 z-10 flex justify-end gap-2 bg-transparent p-0">
              {hasPaymentChanges ? (
                <Button size="sm" className="rounded-full" onClick={save}>
                  <Check className="mr-1 size-3.5" /> Save
                </Button>
              ) : null}
              <Button size="sm" variant="ghost" className="rounded-full" onClick={cancelEdit}>
                <X className="mr-1 size-3.5" /> Cancel
              </Button>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Surface>
            <SectionTitle title="Edit history" subtitle="Every change to project or payment details" />
            {project.history.length === 0 ? (
              <EmptyState title="Nothing logged yet" description="Edits to project details and payment info will appear here with who changed what." />
            ) : (
              <div className="space-y-3">
                {project.history.map((h) => (
                  <div key={h.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-2xl bg-secondary p-3">
                    <span className="mt-1 size-2 rounded-full bg-primary" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium">
                        {new Date(h.at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        - {userMap[h.actorId]?.name ?? "Unknown"} - {h.summary}
                      </p>
                      <p className="mt-1 text-[11px] capitalize text-muted-foreground">{h.area}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <History className="size-3.5" /> History entries are immutable.
            </p>
          </Surface>
        </TabsContent>
      </Tabs>
      {isAdmin ? (
        <Surface className="flex justify-end p-4">
          <Button variant="destructive" className="rounded-full" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="mr-1 size-4" /> Delete project
          </Button>
        </Surface>
      ) : null}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes “{project.name}” and its related cashbook entries. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep project</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                try {
                  await deleteProject(project.id);
                  toast.success("Project deleted");
                  navigate({ to: "/projects" });
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to delete project");
                }
              }}
            >
              Yes, delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Readout({ value }: { value: string }) {
  return <p className="text-sm font-medium">{value || <span className="text-muted-foreground">Not set</span>}</p>;
}

function SettingRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-secondary p-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
