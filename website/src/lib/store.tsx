import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  addDays,
  auditLog as seedAudit,
  calendarNotes as seedNotes,
  cashbookEntries as seedCash,
  currentUserId,
  defaultSettings,
  emptyPayment,
  iso,
  projects as seedProjects,
  users as seedUsers,
  type AuditEntry,
  type CalendarNote,
  type CashEntry,
  type Distribution,
  type HistoryArea,
  type Importance,
  type PaymentDetails,
  type PaymentReceived,
  type Project,
  type ProjectSettings,
  type PropLink,
  type Role,
  type Schedule,
  type User,
} from "./mock-data";

type State = {
  users: User[];
  projects: Project[];
  notes: CalendarNote[];
  audit: AuditEntry[];
  cash: CashEntry[];
  currentUser: User;
};

export type NewProjectInput = Pick<
  Project,
  "name" | "description" | "visibility" | "accent" | "leaderId" | "memberIds" | "links" | "deductionMark"
> &
  Partial<Pick<Project, "settings" | "isVideoProject" | "videoBatchSize" | "payment">>;

type Actions = {
  approveTask: (projectId: string, taskId: string) => void;
  revertDeduction: (projectId: string, taskId: string) => void;
  updateTask: (projectId: string, taskId: string, label: string) => void;
  setTaskProof: (projectId: string, taskId: string, proof: string) => void;
  addProject: (input: NewProjectInput) => string;
  addSchedule: (projectId: string, schedule: Omit<Schedule, "id">) => void;
  shiftSchedule: (projectId: string, scheduleId: string) => void;
  deleteSchedule: (projectId: string, scheduleId: string) => void;
  deleteTask: (projectId: string, scheduleId: string, taskId: string) => void;
  setDeductionMark: (projectId: string, value: number) => void;
  updateProjectDetails: (projectId: string, patch: Partial<Project>, summary: string) => void;
  deleteProject: (projectId: string) => void;
  updatePayment: (projectId: string, patch: Partial<PaymentDetails>, summary: string) => void;
  addPaymentReceived: (projectId: string, payment: Omit<PaymentReceived, "id" | "createdBy">) => void;
  setProjectSetting: <K extends keyof ProjectSettings>(projectId: string, key: K, value: ProjectSettings[K]) => void;
  addDistribution: (projectId: string, distribution: Omit<Distribution, "id" | "createdBy">) => void;
  addNote: (note: { date: string; title: string; importance: Importance }) => void;
  addCashEntry: (entry: Omit<CashEntry, "id" | "createdBy" | "createdAt">) => void;
  updateCashEntry: (entryId: string, entry: Omit<CashEntry, "id" | "createdBy" | "createdAt">) => void;
  setCashSettled: (entryId: string, settled: boolean) => void;
  setRole: (userId: string, role: Role) => void;
  addUser: (input: Pick<User, "name" | "email" | "role" | "title"> & Partial<Pick<User, "github" | "bio" | "accent">>) => void;
  updateProfile: (patch: Partial<User>) => void;
};

const StoreContext = createContext<(State & Actions) | null>(null);

const uid = () => Math.random().toString(36).slice(2, 9);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(seedUsers);
  const [projects, setProjects] = useState<Project[]>(seedProjects);
  const [notes, setNotes] = useState<CalendarNote[]>(seedNotes);
  const [audit, setAudit] = useState<AuditEntry[]>(seedAudit);
  const [cash, setCash] = useState<CashEntry[]>(seedCash);

  const patchProject = useCallback((projectId: string, fn: (p: Project) => Project) => {
    setProjects((prev) => prev.map((p) => (p.id === projectId ? fn(p) : p)));
  }, []);

  useEffect(() => {
    const today = iso(new Date());
    setProjects((prev) => {
      let changed = false;
      const next = prev.map((p) => {
        if (!p.settings.markDeduction) return p;
        const schedules = p.schedules.map((s) => {
          const ended = addDays(s.startDate, s.days - 1) < today;
          if (!ended) return s;
          const tasks = s.tasks.map((t) => {
            if (t.status === "approved" || t.deduction != null || t.deductionWaived) return t;
            changed = true;
            return { ...t, status: "overdue" as const, deduction: p.deductionMark };
          });
          return tasks === s.tasks ? s : { ...s, tasks };
        });
        return schedules === p.schedules ? p : { ...p, schedules };
      });
      return changed ? next : prev;
    });
  }, []);

  const logged = useCallback(
    (p: Project, area: HistoryArea, summary: string): Project => ({
      ...p,
      history: [
        { id: `h_${uid()}`, at: new Date().toISOString(), actorId: currentUserId, area, summary },
        ...p.history,
      ],
    }),
    [],
  );

  const approveTask = useCallback<Actions["approveTask"]>(
    (projectId, taskId) => {
      patchProject(projectId, (p) => ({
        ...p,
        schedules: p.schedules.map((s) => ({
          ...s,
          tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status: "approved" as const } : t)),
        })),
      }));
    },
    [patchProject],
  );

  const revertDeduction = useCallback<Actions["revertDeduction"]>(
    (projectId, taskId) => {
      let owner: string | null = null;
      let amount = 0;
      patchProject(projectId, (p) => ({
        ...p,
        schedules: p.schedules.map((s) => ({
          ...s,
          tasks: s.tasks.map((t) => {
            if (t.id !== taskId || t.deduction == null) return t;
            owner = t.userId;
            amount = t.deduction;
            return { ...t, deduction: null, deductionWaived: true };
          }),
        })),
      }));
      if (owner) {
        setUsers((prev) =>
          prev.map((u) => (u.id === owner ? { ...u, punctuality: Math.min(100, u.punctuality + amount) } : u)),
        );
      }
    },
    [patchProject],
  );

  const updateTask = useCallback<Actions["updateTask"]>(
    (projectId, taskId, label) => {
      patchProject(projectId, (p) => ({
        ...p,
        schedules: p.schedules.map((s) => ({
          ...s,
          tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, label, edited: true } : t)),
        })),
      }));
    },
    [patchProject],
  );

  const setTaskProof = useCallback<Actions["setTaskProof"]>(
    (projectId, taskId, proof) => {
      patchProject(projectId, (p) => ({
        ...p,
        schedules: p.schedules.map((s) => ({
          ...s,
          tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, proof } : t)),
        })),
      }));
    },
    [patchProject],
  );

  const addProject = useCallback<Actions["addProject"]>((input) => {
    const id = `p_${uid()}`;
    setProjects((prev) => [
      {
        settings: defaultSettings(),
        payment: emptyPayment(),
        isVideoProject: false,
        videoBatchSize: 10,
        ...input,
        id,
        schedules: [],
        distributions: [],
        paymentsReceived: [],
        history: [
          { id: `h_${uid()}`, at: new Date().toISOString(), actorId: currentUserId, area: "details", summary: "Created the project" },
        ],
      },
      ...prev,
    ]);
    return id;
  }, []);

  const addSchedule = useCallback<Actions["addSchedule"]>(
    (projectId, schedule) => {
      patchProject(projectId, (p) => ({
        ...p,
        schedules: [...p.schedules, { ...schedule, id: `s_${uid()}` }].sort((a, b) =>
          a.startDate.localeCompare(b.startDate),
        ),
      }));
    },
    [patchProject],
  );

  const shiftSchedule = useCallback<Actions["shiftSchedule"]>(
    (projectId, scheduleId) => {
      patchProject(projectId, (p) => {
        const target = p.schedules.find((s) => s.id === scheduleId);
        if (!target) return p;
        return {
          ...p,
          schedules: p.schedules.map((s) =>
            s.startDate >= target.startDate ? { ...s, startDate: addDays(s.startDate, 1) } : s,
          ),
        };
      });
    },
    [patchProject],
  );

  const deleteSchedule = useCallback<Actions["deleteSchedule"]>(
    (projectId, scheduleId) => {
      patchProject(projectId, (p) =>
        logged({ ...p, schedules: p.schedules.filter((s) => s.id !== scheduleId) }, "settings", "Deleted a schedule"),
      );
    },
    [patchProject, logged],
  );

  const deleteTask = useCallback<Actions["deleteTask"]>(
    (projectId, scheduleId, taskId) => {
      patchProject(projectId, (p) => {
        const schedules = p.schedules
          .map((s) => (s.id === scheduleId ? { ...s, tasks: s.tasks.filter((t) => t.id !== taskId) } : s))
          .filter((s) => s.tasks.length > 0);
        return logged({ ...p, schedules }, "settings", "Deleted a scheduled task");
      });
    },
    [patchProject, logged],
  );

  const setDeductionMark = useCallback<Actions["setDeductionMark"]>(
    (projectId, value) =>
      patchProject(projectId, (p) => logged({ ...p, deductionMark: value }, "settings", `Set deduction mark to ${value}`)),
    [patchProject, logged],
  );

  const updateProjectDetails = useCallback<Actions["updateProjectDetails"]>(
    (projectId, patch, summary) => patchProject(projectId, (p) => logged({ ...p, ...patch }, "details", summary)),
    [patchProject, logged],
  );

  const deleteProject = useCallback<Actions["deleteProject"]>((projectId) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setCash((prev) => prev.filter((e) => e.projectId !== projectId));
  }, []);

  const updatePayment = useCallback<Actions["updatePayment"]>(
    (projectId, patch, summary) =>
      patchProject(projectId, (p) =>
        logged({ ...p, payment: { ...p.payment, ...patch, configured: true } }, "payment", summary),
      ),
    [patchProject, logged],
  );

  const addPaymentReceived = useCallback<Actions["addPaymentReceived"]>(
    (projectId, payment) =>
      patchProject(projectId, (p) => {
        const received = p.payment.amountReceived + payment.amount;
        const status = p.payment.invoiceAmount > 0 && received >= p.payment.invoiceAmount ? "paid" : "partial";
        const entry = { ...payment, id: `pr_${uid()}`, createdBy: currentUserId };
        setCash((prev) => [
          {
            id: `c_${uid()}`,
            entryType: "deposit",
            amount: payment.amount,
            projectId,
            takenBy: null,
            putBy: p.payment.clientName || "Company",
            date: payment.date,
            note: payment.note || `Payment received for ${p.name}`,
            proof: payment.proof ?? "",
            isRepayment: false,
            isSettled: false,
            createdBy: currentUserId,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        return logged(
          {
            ...p,
            payment: { ...p.payment, amountReceived: received, status, configured: true },
            paymentsReceived: [entry, ...p.paymentsReceived],
          },
          "payment",
          `Added payment received ${inr(payment.amount)}`,
        );
      }),
    [patchProject, logged],
  );

  const setProjectSetting = useCallback<Actions["setProjectSetting"]>(
    (projectId, key, value) =>
      patchProject(projectId, (p) =>
        logged({ ...p, settings: { ...p.settings, [key]: value } }, "settings", `${key} turned ${value ? "on" : "off"}`),
      ),
    [patchProject, logged],
  );

  const addDistribution = useCallback<Actions["addDistribution"]>(
    (projectId, distribution) =>
      patchProject(projectId, (p) => {
        const distributed = distribution.allocations.reduce((sum, a) => sum + a.amount, 0);
        const received = p.payment.amountReceived + distribution.amountReceived;
        const status = received >= p.payment.invoiceAmount && p.payment.invoiceAmount > 0 ? "paid" : "partial";
        const memberNames = distribution.allocations
          .map((a) => `${users.find((u) => u.id === a.userId)?.name ?? "Unknown"} (${inr(a.amount)})`)
          .join(", ");
        setCash((prev) => [
          {
            id: `c_${uid()}`,
            entryType: "expense",
            amount: distributed,
            projectId,
            takenBy: "Company expense",
            putBy: null,
            date: distribution.date,
            note: `Distributed to ${memberNames}`,
            proof: "",
            isRepayment: false,
            isSettled: false,
            createdBy: currentUserId,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        return logged(
          {
            ...p,
            payment: { ...p.payment, amountReceived: received, status, configured: true },
            distributions: [
              { ...distribution, id: `d_${uid()}`, createdBy: currentUserId },
              ...p.distributions,
            ],
          },
          "distribution",
          `Distributed ₹${distributed.toLocaleString("en-IN")} across ${distribution.allocations.length} members`,
        );
      }),
    [patchProject, logged, users],
  );

  const addNote = useCallback<Actions["addNote"]>((note) => {
    setNotes((prev) => [...prev, { ...note, id: `n_${uid()}` }]);
  }, []);

  const addCashEntry = useCallback<Actions["addCashEntry"]>((entry) => {
    if (entry.projectId && entry.entryType === "deposit") {
      patchProject(entry.projectId, (p) => {
        const received = p.payment.amountReceived + entry.amount;
        const status = p.payment.invoiceAmount > 0 && received >= p.payment.invoiceAmount ? "paid" : "partial";
        return logged(
          {
            ...p,
            payment: { ...p.payment, amountReceived: received, status, configured: true },
            paymentsReceived: [
              {
                id: `pr_${uid()}`,
                date: entry.date,
                amount: entry.amount,
                proof: entry.proof || undefined,
                note: entry.note || "Added from cashbook",
                createdBy: currentUserId,
              },
              ...p.paymentsReceived,
            ],
          },
          "payment",
          `Added payment received ${inr(entry.amount)} from cashbook`,
        );
      });
    }
    setCash((prev) => [
      { ...entry, id: `c_${uid()}`, createdBy: currentUserId, createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }, [patchProject, logged]);

  const updateCashEntry = useCallback<Actions["updateCashEntry"]>((entryId, entry) => {
    setCash((prev) => prev.map((e) => (e.id === entryId ? { ...e, ...entry } : e)));
  }, []);

  const setCashSettled = useCallback<Actions["setCashSettled"]>((entryId, settled) => {
    setCash((prev) => prev.map((e) => (e.id === entryId ? { ...e, isSettled: settled } : e)));
  }, []);

  const setRole = useCallback<Actions["setRole"]>((userId, role) => {
    setUsers((prev) => {
      const target = prev.find((u) => u.id === userId);
      if (target && target.role !== role) {
        setAudit((log) => [
          {
            id: `a_${uid()}`,
            actor: seedUsers.find((u) => u.id === currentUserId)?.name ?? "Admin",
            target: target.name,
            from: target.role,
            to: role,
            at: iso(new Date()),
          },
          ...log,
        ]);
      }
      return prev.map((u) => (u.id === userId ? { ...u, role } : u));
    });
  }, []);

  const addUser = useCallback<Actions["addUser"]>((input) => {
    const accents: User["accent"][] = ["blue", "pink", "green", "peach", "lilac"];
    setUsers((prev) => [
      {
        id: `u_${uid()}`,
        name: input.name,
        email: input.email,
        role: input.role,
        title: input.title,
        github: input.github ?? "",
        bio: input.bio ?? "",
        accent: input.accent ?? accents[prev.length % accents.length]!,
        punctuality: 100,
        links: [],
        profileVisibility: "public",
      },
      ...prev,
    ]);
  }, []);

  const updateProfile = useCallback<Actions["updateProfile"]>((patch) => {
    setUsers((prev) => prev.map((u) => (u.id === currentUserId ? { ...u, ...patch } : u)));
  }, []);

  const value = useMemo(() => {
    const currentUser = users.find((u) => u.id === currentUserId) ?? users[0]!;
    return {
      users,
      projects,
      notes,
      audit,
      cash,
      currentUser,
      approveTask,
      revertDeduction,
      updateTask,
      setTaskProof,
      addProject,
      addSchedule,
      shiftSchedule,
      deleteSchedule,
      deleteTask,
      setDeductionMark,
      updateProjectDetails,
      deleteProject,
      updatePayment,
      addPaymentReceived,
      setProjectSetting,
      addDistribution,
      addNote,
      addCashEntry,
      updateCashEntry,
      setCashSettled,
      setRole,
      addUser,
      updateProfile,
    };
  }, [
    users,
    projects,
    notes,
    audit,
    cash,
    approveTask,
    revertDeduction,
    updateTask,
    setTaskProof,
    addProject,
    addSchedule,
    shiftSchedule,
    deleteSchedule,
    deleteTask,
    setDeductionMark,
    updateProjectDetails,
    deleteProject,
    updatePayment,
    addPaymentReceived,
    setProjectSetting,
    addDistribution,
    addNote,
    addCashEntry,
    updateCashEntry,
    setCashSettled,
    setRole,
    addUser,
    updateProfile,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function useUserMap() {
  const { users } = useStore();
  return useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])) as Record<string, User>, [users]);
}

export function projectStats(project: Project) {
  const tasks = project.schedules.flatMap((s) => s.tasks);
  const approved = tasks.filter((t) => t.status === "approved").length;
  const completion = tasks.length ? Math.round((approved / tasks.length) * 100) : 0;
  const dates = project.schedules.map((s) => s.startDate).sort();
  const start = dates[0] ?? null;
  const end = project.schedules.length
    ? project.schedules
        .map((s) => addDays(s.startDate, s.days - 1))
        .sort()
        .at(-1)!
    : null;
  return { tasks, approved, completion, start, end };
}

export function projectPunctuality(project: Project, userId: string) {
  const deductions = project.schedules
    .flatMap((s) => s.tasks)
    .filter((t) => t.userId === userId)
    .reduce((sum, t) => sum + (t.deduction ?? 0), 0);
  return Math.max(0, Math.min(100, 100 - deductions));
}

export function userPunctuality(projects: Project[], user: User) {
  const mine = projects.filter((p) => p.memberIds.includes(user.id));
  if (!mine.length) return user.punctuality;
  const total = mine.reduce((sum, p) => sum + projectPunctuality(p, user.id), 0);
  return Math.round(total / mine.length);
}

export function emptyLink(): PropLink {
  return { id: `link_${uid()}`, label: "", url: "", value: "" };
}

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function videoStats(project: Project) {
  const tasks = project.schedules.flatMap((s) => s.tasks);
  const approved = tasks.filter((t) => t.status === "approved").length;
  const pending = tasks.length - approved;
  const batch = Math.max(1, project.videoBatchSize);
  const inBatch = approved % batch === 0 && approved > 0 ? batch : approved % batch;
  return {
    approved,
    pending,
    total: tasks.length,
    batch,
    inBatch,
    remaining: Math.max(0, batch - inBatch),
    payouts: Math.floor(approved / batch),
  };
}

export function distributionTotals(project: Project) {
  const distributed = project.distributions.reduce(
    (sum, d) => sum + d.allocations.reduce((s, a) => s + a.amount, 0),
    0,
  );
  const received = project.payment.amountReceived;
  const perMember: Record<string, number> = {};
  for (const d of project.distributions) {
    for (const a of d.allocations) perMember[a.userId] = (perMember[a.userId] ?? 0) + a.amount;
  }
  return { distributed, received, commission: Math.max(0, received - distributed), perMember };
}

export function cashProjectTotals(entries: CashEntry[], projects: Project[]) {
  return projects
    .map((project) => {
      const projectEntries = entries.filter((e) => e.projectId === project.id);
      const deposited = projectEntries
        .filter((e) => e.entryType === "deposit")
        .reduce((sum, e) => sum + e.amount, 0);
      const distributed = projectEntries
        .filter((e) => e.entryType === "expense")
        .reduce((sum, e) => sum + e.amount, 0);
      return { project, deposited, distributed, balance: deposited - distributed };
    })
    .filter((row) => row.deposited > 0 || row.distributed > 0)
    .sort((a, b) => b.deposited - a.deposited);
}

export function cashTotals(entries: CashEntry[]) {
  let deposits = 0;
  let expenses = 0;
  let withdrawals = 0;
  for (const e of entries) {
    if (e.entryType === "deposit") deposits += e.amount;
    if (e.entryType === "expense") expenses += e.amount;
    if (e.entryType === "withdrawal") {
      withdrawals += e.amount;
    }
  }
  const owed = cashPeople(entries).reduce((sum, p) => sum + Math.max(0, p.net), 0);
  const current = deposits - expenses - withdrawals;
  return { deposits, expenses, withdrawals, owed, current, expected: current + owed };
}

export type PersonSummary = { name: string; taken: number; given: number; net: number };

export function cashPeople(entries: CashEntry[], names: string[] = []): PersonSummary[] {
  const map = new Map<string, PersonSummary>();
  const get = (name: string) => {
    let row = map.get(name);
    if (!row) {
      row = { name, taken: 0, given: 0, net: 0 };
      map.set(name, row);
    }
    return row;
  };
  for (const name of names) {
    const trimmed = name.trim();
    if (trimmed) get(trimmed);
  }
  for (const e of entries) {
    if (e.entryType === "withdrawal" && e.takenBy) {
      const row = get(e.takenBy);
      row.taken += e.amount;
      row.net += e.amount;
    }
    if (e.entryType === "deposit" && e.putBy) {
      const row = get(e.putBy);
      row.given += e.amount;
      row.net -= e.amount;
    }
  }
  return [...map.values()].sort((a, b) => b.net - a.net);
}
