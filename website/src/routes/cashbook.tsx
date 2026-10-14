import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Paperclip,
  Pencil,
  Plus,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, SectionTitle, Surface } from "@/components/ui-bits";
import { iso, type CashEntry, type CashEntryType } from "@/lib/mock-data";
import { cashPeople, cashProjectTotals, cashTotals, inr, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cashbook")({
  head: () => ({
    meta: [
      { title: "Cashbook — Noospace" },
      {
        name: "description",
        content: "Shared fund ledger with deposits, expenses, personal withdrawals and per-person dues.",
      },
      { property: "og:title", content: "Cashbook — Noospace" },
      { property: "og:description", content: "Track cash in hand, expected balance and who owes what." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CashbookPage,
});

type FilterKey = "all" | "pending" | "month" | "deposits" | "expenses" | "projects";

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending dues" },
  { key: "month", label: "This month" },
  { key: "deposits", label: "Deposits" },
  { key: "expenses", label: "Expenses" },
  { key: "projects", label: "Projects" },
];

const typeMeta: Record<CashEntryType, { label: string; sign: string; tone: string }> = {
  deposit: { label: "Deposit", sign: "+", tone: "text-status-approved" },
  expense: { label: "Expense", sign: "−", tone: "text-status-overdue" },
  withdrawal: { label: "Withdrawal", sign: "−", tone: "text-status-pending" },
};

const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

const genericPartyLabels = new Set(["person", "company", "expense", "company expense"]);

function CashbookPage() {
  const { cash, users, projects, currentUser, addCashEntry, updateCashEntry, setCashSettled } = useStore();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [person, setPerson] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CashEntry | null>(null);
  const [detail, setDetail] = useState<CashEntry | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressedEntry = useRef<string | null>(null);

  const totals = useMemo(() => cashTotals(cash), [cash]);
  const people = useMemo(() => cashPeople(cash, users.map((u) => u.name)), [cash, users]);
  const projectRows = useMemo(() => cashProjectTotals(cash, projects), [cash, projects]);
  const entryPerson = (entry: CashEntry) => {
    const personOrCompany = entry.takenBy ?? entry.putBy;
    const project = projects.find((item) => item.id === entry.projectId);
    const party = personOrCompany?.trim() ?? "";
    const normalizedParty = party.toLowerCase();
    if (!genericPartyLabels.has(normalizedParty)) return party || "Name not recorded";
    if (normalizedParty === "company expense" && entry.note.startsWith("Distributed to ")) {
      return entry.note.slice("Distributed to ".length).replace(/\s*\([^)]*\)/g, "");
    }
    if (!project && entry.note.trim()) return entry.note.trim();
    if (!project) return "Name not recorded";
    return project?.payment.clientName.trim() || project?.name || "—";
  };
  const canManageCash = currentUser.role === "admin";

  const monthPrefix = iso(new Date()).slice(0, 7);
  const rows = cash
    .filter((e) => {
      if (filter === "pending") return e.entryType === "withdrawal" && !e.isSettled;
      if (filter === "month") return e.date.startsWith(monthPrefix);
      if (filter === "deposits") return e.entryType === "deposit";
      if (filter === "expenses") return e.entryType === "expense";
      if (filter === "projects") return Boolean(e.projectId);
      return true;
    })
    .filter((e) => person === "all" || e.takenBy === person || e.putBy === person)
    .sort((a, b) => b.date.localeCompare(a.date));

  const openAdd = () => {
    if (!canManageCash) return;
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (entry: CashEntry) => {
    if (!canManageCash) {
      toast.error("Only admins can edit money entries");
      return;
    }
    setDetail(null);
    setEditing(entry);
    setOpen(true);
  };

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const startLongPress = (entry: CashEntry) => {
    clearLongPress();
    if (!canManageCash) return;
    longPressTimer.current = setTimeout(() => {
      longPressedEntry.current = entry.id;
      openEdit(entry);
    }, 550);
  };

  return (
    <div className="space-y-5 pb-24">
      <div className="sticky top-[52px] z-30 -mx-3 bg-background/90 px-3 py-2 backdrop-blur-md sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <Surface className="relative grid gap-3 p-4 pr-28 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] sm:items-center sm:p-5 sm:pr-5">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">Current balance</p>
            <p className="text-3xl font-bold leading-tight tracking-tight text-primary sm:text-4xl">
              {inr(totals.current)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">Expected balance</p>
            <p className="text-xl font-semibold leading-tight sm:text-2xl">{inr(totals.expected)}</p>
            <p className="text-[10px] text-muted-foreground">if all dues are cleared</p>
          </div>
          <button
            type="button"
            onClick={() => document.getElementById("people-tab")?.scrollIntoView({ behavior: "smooth" })}
            className="absolute right-4 top-4 justify-self-start rounded-full bg-status-pending/15 px-3 py-1.5 text-xs font-semibold text-status-pending sm:static"
          >
            {inr(totals.owed)} owed
          </button>
        </Surface>
      </div>

      {!canManageCash ? (
        <Surface className="flex items-center gap-3 p-4">
          <ShieldCheck className="size-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold">Read-only cashbook</p>
            <p className="text-xs text-muted-foreground">Only administrators can deposit, withdraw, settle or edit money entries.</p>
          </div>
        </Surface>
      ) : null}

      <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "shrink-0 rounded-full bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-card transition-colors",
              filter === f.key && "bg-primary text-primary-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Tabs defaultValue="entries">
        <TabsList className="rounded-full">
          <TabsTrigger value="entries" className="rounded-full">
            Entries
          </TabsTrigger>
          <TabsTrigger value="people" className="rounded-full">
            Per person
          </TabsTrigger>
          <TabsTrigger value="projects" className="rounded-full">
            Projects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="mt-4">
          <Surface className="p-0">
            {rows.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No entries yet" description="Log a deposit, expense or withdrawal to get started." />
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <table className="hidden w-full text-sm sm:table">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-3 py-3 font-medium">Type</th>
                      <th className="px-3 py-3 font-medium">Amount</th>
                      <th className="px-3 py-3 font-medium">Person</th>
                      <th className="px-3 py-3 font-medium">Note</th>
                      <th className="px-3 py-3 font-medium">Proof</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((e) => (
                      <tr
                        key={e.id}
                        onClick={() => setDetail(e)}
                        className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-secondary/50"
                      >
                        <td className="px-5 py-3 text-xs text-muted-foreground">{fmtDate(e.date)}</td>
                        <td className="px-3 py-3 text-xs">{typeMeta[e.entryType].label}</td>
                        <td className={cn("px-3 py-3 font-semibold", typeMeta[e.entryType].tone)}>
                          {typeMeta[e.entryType].sign}
                          {inr(e.amount)}
                        </td>
                        <td className="px-3 py-3 text-xs">{entryPerson(e)}</td>
                        <td className="max-w-[220px] truncate px-3 py-3 text-xs text-muted-foreground">{e.note}</td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {e.proof ? <Paperclip className="size-3.5" /> : "—"}
                        </td>
                        <td className="px-5 py-3">
                          {e.entryType === "withdrawal" ? (
                            <StatusBadge entry={e} canManage={canManageCash} onSettle={() => settle(e)} />
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile cards */}
                <ul className="divide-y divide-border/60 sm:hidden">
                  {rows.map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        onPointerDown={() => startLongPress(e)}
                        onPointerUp={clearLongPress}
                        onPointerLeave={clearLongPress}
                        onPointerCancel={clearLongPress}
                        onContextMenu={(ev) => ev.preventDefault()}
                        onClick={() => {
                          if (longPressedEntry.current === e.id) {
                            longPressedEntry.current = null;
                            return;
                          }
                          setDetail(e);
                        }}
                        className="w-full px-4 py-3 text-left"
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <span className={cn("text-lg font-bold", typeMeta[e.entryType].tone)}>
                            {typeMeta[e.entryType].sign}
                            {inr(e.amount)}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{fmtDate(e.date)}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-medium">{entryPerson(e)}</span>
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            {typeMeta[e.entryType].label}
                          </span>
                        </div>
                        {e.note ? <p className="mt-1 truncate text-[11px] text-muted-foreground">{e.note}</p> : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Surface>
        </TabsContent>

        <TabsContent value="people" className="mt-4" id="people-tab">
          <Surface>
            <SectionTitle title="Who owes what" subtitle="Withdrawals minus deposits, including credit when someone pays extra" />
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPerson("all")}
                className={cn(
                  "rounded-full bg-secondary px-3 py-1 text-xs font-medium",
                  person === "all" && "bg-primary text-primary-foreground",
                )}
              >
                Everyone
              </button>
              {people.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setPerson(p.name)}
                  className={cn(
                    "rounded-full bg-secondary px-3 py-1 text-xs font-medium",
                    person === p.name && "bg-primary text-primary-foreground",
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
            {people.length === 0 ? (
              <EmptyState title="Nothing tracked yet" description="Withdrawals and deposits by person show up here." />
            ) : (
              <ul className="space-y-2">
                {people
                  .filter((p) => person === "all" || p.name === person)
                  .map((p) => (
                    <li
                      key={p.name}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Taken {inr(p.taken)} · Given {inr(p.given)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-bold",
                          p.net > 0 ? "text-status-overdue" : "text-status-approved",
                        )}
                      >
                        {p.net > 0 ? `${inr(p.net)} owed` : p.net < 0 ? `${inr(-p.net)} credit` : "Settled"}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </Surface>
        </TabsContent>
        <TabsContent value="projects" className="mt-4">
          <Surface>
            <SectionTitle title="Projects" subtitle="Deposits and distributions tracked per project" />
            {projectRows.length === 0 ? (
              <EmptyState title="No project money yet" description="Link a deposit or expense to a project to see its totals here." />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border/60">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/40 text-left text-xs text-muted-foreground">
                      <th scope="col" className="px-4 py-3 font-medium">Project</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Deposited</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Distributed</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Balance left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectRows.map(({ project, deposited, distributed, balance }) => (
                      <tr key={project.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
                        <th scope="row" className="px-4 py-3 text-left text-sm font-semibold">{project.name}</th>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-status-approved">{inr(deposited)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-status-overdue">{inr(distributed)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold">{inr(balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Surface>
        </TabsContent>
      </Tabs>

      {canManageCash ? (
        <button
          type="button"
          onClick={openAdd}
          aria-label="Add cashbook entry"
          className="fixed bottom-6 right-5 z-40 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-card transition-transform hover:scale-105"
        >
          <Plus className="size-6" />
        </button>
      ) : null}

      <AddEntrySheet
        open={open}
        setOpen={(next) => {
          setOpen(next);
          if (!next) setEditing(null);
        }}
        initialEntry={editing}
        names={[...new Set([...users.map((u) => u.name), ...people.map((p) => p.name)])].filter((name) => !genericPartyLabels.has(name.trim().toLowerCase()))}
        projects={projects}
        onSubmit={(entry) => {
          if (editing) {
            updateCashEntry(editing.id, entry);
            toast.success(`${typeMeta[entry.entryType].label} updated`);
          } else {
            addCashEntry(entry);
            toast.success(`${typeMeta[entry.entryType].label} of ${inr(entry.amount)} logged`);
          }
        }}
      />

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>{detail ? typeMeta[detail.entryType].label : ""} detail</DialogTitle>
          </DialogHeader>
          {detail ? (
            <div className="space-y-3 text-sm">
              <p className={cn("text-3xl font-bold", typeMeta[detail.entryType].tone)}>
                {typeMeta[detail.entryType].sign}
                {inr(detail.amount)}
              </p>
              <p className="text-xs text-muted-foreground">
                {fmtDate(detail.date)} · {entryPerson(detail)}
              </p>
              <p className="rounded-2xl bg-secondary/60 p-3 text-xs">{detail.note || "No note added."}</p>
              {detail.proof ? (
                <img src={detail.proof} alt="Receipt proof" className="w-full rounded-2xl" loading="lazy" />
              ) : (
                <p className="text-xs text-muted-foreground">No proof attached.</p>
              )}
              {canManageCash ? (
                <Button variant="outline" className="w-full rounded-full" onClick={() => openEdit(detail)}>
                  <Pencil className="mr-1 size-4" /> Edit entry
                </Button>
              ) : null}
              {canManageCash && detail.entryType === "withdrawal" && !detail.isSettled ? (
                <Button
                  className="w-full rounded-full"
                  onClick={() => {
                    settle(detail);
                    setDetail(null);
                  }}
                >
                  <Check className="mr-1 size-4" /> Mark as settled
                </Button>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );

  function settle(entry: CashEntry) {
    if (!canManageCash) {
      toast.error("Only admins can settle money entries");
      return;
    }
    setCashSettled(entry.id, true);
    addCashEntry({
      entryType: "deposit",
      amount: entry.amount,
      takenBy: null,
      putBy: entry.takenBy,
      date: iso(new Date()),
      note: `Repayment for "${entry.note || "withdrawal"}"`,
      proof: "",
      isRepayment: true,
      isSettled: false,
    });
    toast.success(`${entry.takenBy} settled ${inr(entry.amount)}`);
  }
}

function StatusBadge({
  entry,
  canManage,
  onSettle,
}: {
  entry: CashEntry;
  canManage: boolean;
  onSettle: () => void;
}) {
  if (entry.isSettled) {
    return (
      <span className="rounded-full bg-status-approved/15 px-2 py-0.5 text-[11px] font-semibold text-status-approved">
        Settled
      </span>
    );
  }
  if (!canManage) {
    return (
      <span className="rounded-full bg-status-pending/15 px-2 py-0.5 text-[11px] font-semibold text-status-pending">
        Pending
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={(ev) => {
        ev.stopPropagation();
        onSettle();
      }}
      className="rounded-full bg-status-pending/15 px-2 py-0.5 text-[11px] font-semibold text-status-pending"
    >
      Pending · settle
    </button>
  );
}

function AddEntrySheet({
  open,
  setOpen,
  initialEntry,
  names,
  projects,
  onSubmit,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  initialEntry: CashEntry | null;
  names: string[];
  projects: { id: string; name: string }[];
  onSubmit: (entry: Omit<CashEntry, "id" | "createdBy" | "createdAt">) => void;
}) {
  const [type, setType] = useState<CashEntryType>("deposit");
  const [amount, setAmount] = useState("");
  const [who, setWho] = useState("");
  const [date, setDate] = useState(iso(new Date()));
  const [note, setNote] = useState("");
  const [proof, setProof] = useState("");
  const [projectId, setProjectId] = useState("");
  const isEditing = Boolean(initialEntry);

  useEffect(() => {
    if (!open) return;
    setType(initialEntry?.entryType ?? "deposit");
    setAmount(initialEntry ? String(initialEntry.amount) : "");
    const savedParty = initialEntry?.putBy ?? initialEntry?.takenBy ?? "";
    setWho(genericPartyLabels.has(savedParty.trim().toLowerCase()) ? "" : savedParty);
    setDate(initialEntry?.date ?? iso(new Date()));
    setNote(initialEntry?.note ?? "");
    setProof(initialEntry?.proof ?? "");
    setProjectId(initialEntry?.projectId ?? "");
  }, [initialEntry, open]);

  const submit = () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Enter an amount greater than zero");
      return;
    }
    if (!who.trim() || genericPartyLabels.has(who.trim().toLowerCase())) {
      toast.error("Enter the person or company name for this entry");
      return;
    }
    onSubmit({
      entryType: type,
      amount: value,
      projectId: projectId || null,
      takenBy: type !== "deposit" ? who.trim() : null,
      putBy: type === "deposit" ? who.trim() : null,
      date,
      note: note.trim(),
      proof,
      isRepayment: initialEntry?.isRepayment ?? false,
      isSettled: initialEntry?.isSettled ?? false,
    });
    setAmount("");
    setWho("");
    setNote("");
    setProof("");
    setProjectId("");
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit cashbook entry" : "Add cashbook entry"}</SheetTitle>
        </SheetHeader>
        <div className="mx-auto w-full max-w-lg space-y-4 px-4 pb-6">
          <div className="grid grid-cols-3 gap-1 rounded-full bg-secondary p-1">
            {(["deposit", "expense", "withdrawal"] as CashEntryType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "rounded-full py-2 text-xs font-semibold capitalize text-muted-foreground transition-colors",
                  type === t && "bg-card text-foreground shadow-card",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cash-amount">Amount</Label>
            <Input
              id="cash-amount"
              inputMode="decimal"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="h-12 rounded-2xl text-lg font-semibold"
            />
          </div>

          {type === "expense" ? (
            <p className="flex items-center gap-2 rounded-2xl bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
              <Receipt className="size-3.5" /> Logged as an expense.
            </p>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="cash-person">
              {type === "deposit" ? "Put in by" : type === "expense" ? "Paid to (person or company)" : "Taken by"}
            </Label>
            <Input
              id="cash-person"
              list="cash-people"
              value={who}
              onChange={(e) => setWho(e.target.value)}
              placeholder="Enter the actual person or company name"
              className="h-11 rounded-2xl"
            />
            <datalist id="cash-people">
              {names.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cash-date">Date</Label>
              <Input
                id="cash-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 rounded-2xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cash-proof">Proof</Label>
              <Input
                id="cash-proof"
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setProof(URL.createObjectURL(file));
                }}
                className="h-11 rounded-2xl text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cash-project">Project name</Label>
            <Input
              id="cash-project"
              list="cash-projects"
              value={projects.find((project) => project.id === projectId)?.name ?? ""}
              onChange={(e) => setProjectId(projects.find((project) => project.name === e.target.value)?.id ?? "")}
              placeholder="Search and select a project"
              className="h-11 rounded-2xl"
            />
            <datalist id="cash-projects">
              {projects.map((project) => <option key={project.id} value={project.name} />)}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cash-note">Note</Label>
            <Input
              id="cash-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Diwali groceries, advance for travel…"
              className="h-11 rounded-2xl"
            />
          </div>

          <Button onClick={submit} className="h-12 w-full rounded-full">
            {type === "deposit" ? <ArrowUpRight className="mr-1 size-4" /> : <ArrowDownRight className="mr-1 size-4" />}
            {isEditing ? "Update entry" : "Save entry"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
