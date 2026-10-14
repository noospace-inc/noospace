export type Role = "staff" | "admin";
export type TaskStatus = "pending" | "approved" | "overdue" | "carried";
export type Importance = "important" | "moderate" | "normal";
export type AccentKey = "blue" | "pink" | "green" | "peach" | "lilac";

export type PropLink = {
  id: string;
  label: string;
  url: string; // empty url => email-only entry
  value: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  role: Role;
  title: string;
  github: string;
  bio: string;
  accent: AccentKey;
  punctuality: number;
  links: PropLink[];
  profileVisibility: "public" | "private";
};

export type Task = {
  id: string;
  userId: string;
  label: string;
  status: TaskStatus;
  deduction: number | null;
  deductionWaived?: boolean;
  edited?: boolean;
  /** optional evidence link submitted by the assignee */
  proof?: string;
  /** used by video-editing projects to match distributions */
  videoName?: string;
};

export type Schedule = {
  id: string;
  startDate: string; // yyyy-mm-dd
  days: number;
  isLast: boolean;
  tasks: Task[];
  /** true when a teammate proposed this schedule themselves */
  proposed?: boolean;
};

export type PaymentStatus = "pending" | "partial" | "paid";

export type PaymentDetails = {
  invoiceNumber: string;
  invoiceDate: string;
  clientName: string;
  invoiceAmount: number;
  amountReceived: number;
  status: PaymentStatus;
  perPersonRate: number;
  notes: string;
  configured: boolean;
};

export type PaymentReceived = {
  id: string;
  date: string;
  amount: number;
  proof?: string;
  note?: string;
  createdBy: string;
};

export type HistoryArea = "details" | "payment" | "settings" | "distribution";

export type HistoryEntry = {
  id: string;
  at: string; // ISO datetime
  actorId: string;
  area: HistoryArea;
  summary: string;
};

export type ProjectSettings = {
  allowSelfSchedule: boolean;
  markDeduction: boolean;
  showScheduleCount: boolean;
};

export type Allocation = {
  userId: string;
  videoNames: string[];
  amount: number;
};

export type Distribution = {
  id: string;
  date: string;
  amountReceived: number;
  perPerson: number;
  allocations: Allocation[];
  unmatched: string[];
  createdBy: string;
};

export type Project = {
  id: string;
  /** Most recently pinned first; omitted for unpinned projects. */
  pinnedAt?: number;
  name: string;
  description: string;
  visibility: "public" | "private";
  accent: AccentKey;
  leaderId: string;
  memberIds: string[];
  links: PropLink[];
  deductionMark: number;
  schedules: Schedule[];
  settings: ProjectSettings;
  payment: PaymentDetails;
  history: HistoryEntry[];
  isVideoProject: boolean;
  videoBatchSize: number;
  distributions: Distribution[];
  paymentsReceived: PaymentReceived[];
};

export const defaultSettings = (): ProjectSettings => ({
  allowSelfSchedule: false,
  markDeduction: true,
  showScheduleCount: false,
});

export const emptyPayment = (): PaymentDetails => ({
  invoiceNumber: "",
  invoiceDate: "",
  clientName: "",
  invoiceAmount: 0,
  amountReceived: 0,
  status: "pending",
  perPersonRate: 0,
  notes: "",
  configured: false,
});

export type CalendarNote = {
  id: string;
  date: string;
  title: string;
  importance: Importance;
  isPrivate?: boolean;
  createdBy?: string;
  projectId?: string;
};

export type AuditEntry = {
  id: string;
  actor: string;
  target: string;
  from: Role;
  to: Role;
  at: string;
};

export type WorkspaceNotification = { id: string; text: string; at: string; kind: "login" | "task" | "schedule" | "money" };

export const iso = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const addDays = (date: string | Date, n: number) => {
  const d = typeof date === "string" ? new Date(date + "T00:00:00") : new Date(date);
  d.setDate(d.getDate() + n);
  return iso(d);
};

export const startOfWeek = (date: string | Date) => {
  const d = typeof date === "string" ? new Date(date + "T00:00:00") : new Date(date);
  const day = (d.getDay() + 6) % 7; // monday first
  d.setDate(d.getDate() - day);
  return iso(d);
};

const today = iso(new Date());
const weekStart = startOfWeek(today);

export const users: User[] = [
  {
    id: "u1",
    name: "Anna Morgan",
    email: "anna@northlight.studio",
    role: "admin",
    title: "Product Lead",
    github: "https://github.com/annamorgan",
    bio: "Runs delivery across the platform squad. Obsessed with tidy timelines.",
    accent: "blue",
    punctuality: 96,
    profileVisibility: "public",
    links: [
      { id: "l1", label: "Portfolio", url: "https://anna.design", value: "https://anna.design" },
      { id: "l2", label: "Work email", url: "", value: "anna@northlight.studio" },
    ],
  },
  {
    id: "u2",
    name: "Jake Thompson",
    email: "jake@northlight.studio",
    role: "staff",
    title: "Frontend Engineer",
    github: "https://github.com/jakethompson",
    bio: "Builds interfaces that stay fast under pressure.",
    accent: "green",
    punctuality: 92,
    profileVisibility: "public",
    links: [],
  },
  {
    id: "u3",
    name: "Sofia Bennett",
    email: "sofia@northlight.studio",
    role: "staff",
    title: "Product Designer",
    github: "https://github.com/sofiab",
    bio: "Design systems, motion, and the small details in between.",
    accent: "pink",
    punctuality: 89,
    profileVisibility: "public",
    links: [],
  },
  {
    id: "u4",
    name: "Emily Carter",
    email: "emily@northlight.studio",
    role: "staff",
    title: "Backend Engineer",
    github: "https://github.com/emilyc",
    bio: "APIs, queues, and very strong coffee.",
    accent: "peach",
    punctuality: 84,
    profileVisibility: "public",
    links: [],
  },
  {
    id: "u5",
    name: "Daniel Okafor",
    email: "daniel@northlight.studio",
    role: "staff",
    title: "QA Engineer",
    github: "https://github.com/danokafor",
    bio: "If it can break, it will break on my machine first.",
    accent: "lilac",
    punctuality: 78,
    profileVisibility: "public",
    links: [],
  },
  {
    id: "u6",
    name: "Priya Raman",
    email: "priya@northlight.studio",
    role: "staff",
    title: "Data Analyst",
    github: "https://github.com/priyaraman",
    bio: "Turns messy delivery data into decisions.",
    accent: "blue",
    punctuality: 81,
    profileVisibility: "public",
    links: [],
  },
];

export const currentUserId = "u1";

let tid = 0;
const task = (userId: string, label: string, status: TaskStatus = "pending", deduction: number | null = null): Task => ({
  id: `t${++tid}`,
  userId,
  label,
  status,
  deduction,
});

type ProjectSeed = Omit<
  Project,
  "settings" | "payment" | "history" | "isVideoProject" | "videoBatchSize" | "distributions" | "paymentsReceived"
> &
  Partial<Pick<Project, "settings" | "payment" | "history" | "isVideoProject" | "videoBatchSize" | "distributions" | "paymentsReceived">>;

const projectSeeds: ProjectSeed[] = [
  {
    id: "p1",
    name: "Aurora Design System",
    description:
      "Unify every product surface on one component library, tokens and documentation site.",
    visibility: "public",
    accent: "blue",
    leaderId: "u1",
    memberIds: ["u1", "u2", "u3", "u4"],
    links: [
      { id: "pl1", label: "Figma file", url: "https://figma.com/file/aurora", value: "https://figma.com/file/aurora" },
      { id: "pl2", label: "Repository", url: "https://github.com/northlight/aurora", value: "https://github.com/northlight/aurora" },
      { id: "pl3", label: "Client contact", url: "", value: "hello@auroraclient.com" },
    ],
    deductionMark: 5,
    schedules: [
      {
        id: "s1",
        startDate: weekStart,
        days: 2,
        isLast: false,
        tasks: [
          task("u2", "Token pipeline + build script", "approved"),
          task("u3", "Audit legacy component inventory", "approved"),
          task("u4", "Storybook deployment pipeline", "overdue", 5),
        ],
      },
      {
        id: "s2",
        startDate: addDays(weekStart, 2),
        days: 3,
        isLast: false,
        tasks: [
          task("u2", "Build Button, Input, Card primitives"),
          task("u3", "Motion spec for card hover states"),
          task("u4", "Docs site content model", "carried"),
          task("u1", "Review and sign off primitives"),
        ],
      },
      {
        id: "s3",
        startDate: addDays(weekStart, 5),
        days: 2,
        isLast: true,
        tasks: [
          task("u2", "Release v1.0 to internal registry"),
          task("u3", "Handover deck for product teams"),
        ],
      },
    ],
  },
  {
    id: "p2",
    name: "Client Portal Revamp",
    description: "Rebuild the customer-facing portal with a faster onboarding flow and self-serve billing.",
    visibility: "private",
    accent: "pink",
    leaderId: "u3",
    memberIds: ["u3", "u4", "u5", "u6"],
    links: [
      { id: "pl4", label: "Spec doc", url: "https://notion.so/portal-revamp", value: "https://notion.so/portal-revamp" },
      { id: "pl5", label: "Stakeholder", url: "", value: "ops@clientco.io" },
    ],
    deductionMark: 4,
    schedules: [
      {
        id: "s4",
        startDate: addDays(weekStart, 1),
        days: 2,
        isLast: false,
        tasks: [
          task("u4", "Billing service contract", "approved"),
          task("u5", "Regression suite for onboarding", "pending"),
          task("u6", "Funnel drop-off analysis", "approved"),
        ],
      },
      {
        id: "s5",
        startDate: addDays(weekStart, 4),
        days: 3,
        isLast: true,
        tasks: [
          task("u5", "End-to-end smoke pass"),
          task("u6", "Launch metrics dashboard"),
          task("u3", "Final visual QA"),
        ],
      },
    ],
  },
  {
    id: "p3",
    name: "Mobile Offline Sync",
    description: "Conflict-free offline editing for the field app, with background sync and merge resolution.",
    visibility: "public",
    accent: "green",
    leaderId: "u2",
    memberIds: ["u2", "u5", "u6"],
    links: [],
    deductionMark: 6,
    schedules: [
      {
        id: "s6",
        startDate: addDays(weekStart, 3),
        days: 4,
        isLast: true,
        tasks: [
          task("u5", "Merge conflict test matrix"),
          task("u6", "Sync telemetry events"),
        ],
      },
    ],
  },
  {
    id: "p4",
    name: "Onboarding Automation",
    description: "Automate account provisioning, welcome sequences and first-week checklists.",
    visibility: "public",
    accent: "peach",
    leaderId: "u4",
    memberIds: ["u4", "u1", "u6"],
    links: [],
    deductionMark: 3,
    schedules: [],
  },
  {
    id: "p5",
    name: "Vertex Video Cuts",
    description: "Rolling client video edits delivered in batches, paid out every ten approved videos.",
    visibility: "private",
    accent: "lilac",
    leaderId: "u1",
    memberIds: ["u1", "u2", "u3", "u5"],
    links: [{ id: "pl6", label: "Drive folder", url: "https://drive.google.com/vertex", value: "https://drive.google.com/vertex" }],
    deductionMark: 4,
    isVideoProject: true,
    videoBatchSize: 10,
    settings: { allowSelfSchedule: true, markDeduction: true, showScheduleCount: true },
    payment: {
      invoiceNumber: "INV-2044",
      invoiceDate: addDays(today, -9),
      clientName: "Vertex Media",
      invoiceAmount: 90000,
      amountReceived: 45000,
      status: "partial",
      perPersonRate: 1200,
      notes: "Batch billing — released every 10 approved videos.",
      configured: true,
    },
    history: [
      { id: "h1", at: new Date(Date.now() - 86400000 * 6).toISOString(), actorId: "u1", area: "details", summary: "Created the project" },
      { id: "h2", at: new Date(Date.now() - 86400000 * 4).toISOString(), actorId: "u1", area: "payment", summary: "Added invoice INV-2044 (₹90,000)" },
      { id: "h3", at: new Date(Date.now() - 86400000 * 2).toISOString(), actorId: "u1", area: "payment", summary: "Marked payment status as Partially paid" },
    ],
    distributions: [
      {
        id: "d1",
        date: addDays(today, -3),
        amountReceived: 20000,
        perPerson: 1200,
        allocations: [
          { userId: "u2", videoNames: ["VX-001", "VX-004"], amount: 2400 },
          { userId: "u3", videoNames: ["VX-002"], amount: 1200 },
          { userId: "u5", videoNames: ["VX-003"], amount: 1500 },
        ],
        unmatched: [],
        createdBy: "u1",
      },
    ],
    paymentsReceived: [
      {
        id: "pr1",
        date: addDays(today, -5),
        amount: 25000,
        proof: "https://drive.google.com/vertex/payment-1",
        note: "First batch advance from client.",
        createdBy: "u1",
      },
      {
        id: "pr2",
        date: addDays(today, -2),
        amount: 20000,
        createdBy: "u1",
      },
    ],
    schedules: [
      {
        id: "s7",
        startDate: weekStart,
        days: 2,
        isLast: false,
        tasks: [
          { id: "vt1", userId: "u2", label: "Edit VX-001 teaser", status: "approved", deduction: null, videoName: "VX-001", proof: "https://frame.io/vx-001" },
          { id: "vt2", userId: "u3", label: "Edit VX-002 reel", status: "approved", deduction: null, videoName: "VX-002" },
          { id: "vt3", userId: "u5", label: "Edit VX-003 long form", status: "approved", deduction: null, videoName: "VX-003" },
        ],
      },
      {
        id: "s8",
        startDate: addDays(weekStart, 2),
        days: 3,
        isLast: false,
        tasks: [
          { id: "vt4", userId: "u2", label: "Edit VX-004 cutdown", status: "approved", deduction: null, videoName: "VX-004" },
          { id: "vt5", userId: "u3", label: "Edit VX-005 reel", status: "pending", deduction: null, videoName: "VX-005" },
          { id: "vt6", userId: "u5", label: "Edit VX-006 promo", status: "pending", deduction: null, videoName: "VX-006" },
          { id: "vt7", userId: "u2", label: "Edit VX-007 shorts pack", status: "approved", deduction: null, videoName: "VX-007" },
        ],
      },
    ],
  },
];

export const projects: Project[] = projectSeeds.map((p) => ({
  settings: defaultSettings(),
  payment: emptyPayment(),
  history: [],
  isVideoProject: false,
  videoBatchSize: 10,
  distributions: [],
  paymentsReceived: [],
  ...p,
}));

export const calendarNotes: CalendarNote[] = [
  { id: "n1", date: addDays(weekStart, 3), title: "Quarterly delivery review", importance: "important" },
  { id: "n2", date: addDays(weekStart, 5), title: "Design critique session", importance: "moderate" },
  { id: "n3", date: addDays(weekStart, 9), title: "Team lunch", importance: "normal" },
];

export const auditLog: AuditEntry[] = [
  { id: "a1", actor: "Anna Morgan", target: "Jake Thompson", from: "admin", to: "staff", at: addDays(today, -12) },
  { id: "a2", actor: "Anna Morgan", target: "Sofia Bennett", from: "staff", to: "staff", at: addDays(today, -5) },
];

export const punctualityTrend = [
  { day: "Mon", score: 78, team: 72, target: 85 },
  { day: "Tue", score: 83, team: 74, target: 85 },
  { day: "Wed", score: 81, team: 78, target: 85 },
  { day: "Thu", score: 90, team: 80, target: 85 },
  { day: "Fri", score: 94, team: 84, target: 85 },
  { day: "Sat", score: 88, team: 82, target: 85 },
  { day: "Sun", score: 96, team: 86, target: 85 },
];

export type CashEntryType = "deposit" | "expense" | "withdrawal";

export type CashEntry = {
  id: string;
  entryType: CashEntryType;
  amount: number;
  projectId?: string | null;
  /** person for withdrawal, category label for expense */
  takenBy: string | null;
  /** person for deposit */
  putBy: string | null;
  date: string;
  note: string;
  proof: string;
  /** deposit that repays an earlier withdrawal */
  isRepayment: boolean;
  isSettled: boolean;
  createdBy: string;
  createdAt: string;
};

export const cashbookEntries: CashEntry[] = [
  {
    id: "c1",
    entryType: "deposit",
    amount: 50000,
    projectId: null,
    takenBy: null,
    putBy: "Anna Morgan",
    date: addDays(today, -24),
    note: "Client advance deposited to the shared fund",
    proof: "",
    isRepayment: false,
    isSettled: false,
    createdBy: currentUserId,
    createdAt: addDays(today, -24),
  },
  {
    id: "c2",
    entryType: "expense",
    amount: 8200,
    projectId: null,
    takenBy: "Expense",
    putBy: null,
    date: addDays(today, -18),
    note: "Studio rent — October",
    proof: "",
    isRepayment: false,
    isSettled: false,
    createdBy: currentUserId,
    createdAt: addDays(today, -18),
  },
  {
    id: "c3",
    entryType: "withdrawal",
    amount: 5000,
    projectId: null,
    takenBy: "Jake Thompson",
    putBy: null,
    date: addDays(today, -12),
    note: "Advance for travel",
    proof: "",
    isRepayment: false,
    isSettled: false,
    createdBy: currentUserId,
    createdAt: addDays(today, -12),
  },
  {
    id: "c4",
    entryType: "withdrawal",
    amount: 1500,
    projectId: null,
    takenBy: "Sofia Bennett",
    putBy: null,
    date: addDays(today, -9),
    note: "Diwali groceries for the team",
    proof: "",
    isRepayment: false,
    isSettled: true,
    createdBy: currentUserId,
    createdAt: addDays(today, -9),
  },
  {
    id: "c5",
    entryType: "deposit",
    amount: 1500,
    projectId: null,
    takenBy: null,
    putBy: "Sofia Bennett",
    date: addDays(today, -6),
    note: "Returned the grocery advance",
    proof: "",
    isRepayment: true,
    isSettled: false,
    createdBy: currentUserId,
    createdAt: addDays(today, -6),
  },
  {
    id: "c6",
    entryType: "expense",
    amount: 2400,
    projectId: null,
    takenBy: "Expense",
    putBy: null,
    date: addDays(today, -3),
    note: "Design software subscriptions",
    proof: "",
    isRepayment: false,
    isSettled: false,
    createdBy: currentUserId,
    createdAt: addDays(today, -3),
  },
  {
    id: "c7",
    entryType: "withdrawal",
    amount: 3000,
    projectId: null,
    takenBy: "Emily Carter",
    putBy: null,
    date: addDays(today, -1),
    note: "Shoot props, receipt pending",
    proof: "",
    isRepayment: false,
    isSettled: false,
    createdBy: currentUserId,
    createdAt: addDays(today, -1),
  },
];
