import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Initials, SectionTitle, Surface } from "@/components/ui-bits";
import type { Role } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "Users & roles — Noospace" },
      { name: "description", content: "Admin panel for promoting or demoting staff, with a role change audit trail." },
      { property: "og:title", content: "Users & roles — Noospace" },
      { property: "og:description", content: "Admin-only role management with an audit trail." },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const { users, audit, setRole, addUser, currentUser } = useStore();
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", title: "", role: "staff" as Role, github: "", bio: "" });

  if (currentUser.role !== "admin") {
    return (
      <Surface className="p-10 text-center">
        <ShieldCheck className="mx-auto mb-3 size-6 text-muted-foreground" />
        <p className="text-sm font-semibold">Admins only</p>
        <p className="mt-1 text-xs text-muted-foreground">This area is restricted to administrator accounts.</p>
      </Surface>
    );
  }

  const filtered = users.filter(
    (u) => (roleFilter === "all" || u.role === roleFilter) && (u.name + u.email).toLowerCase().includes(q.toLowerCase()),
  );

  const submitUser = () => {
    if (!form.name.trim() || !form.email.trim() || !form.title.trim()) {
      toast.error("Name, email and title are required");
      return;
    }
    addUser({
      name: form.name.trim(),
      email: form.email.trim(),
      title: form.title.trim(),
      role: form.role,
      github: form.github.trim(),
      bio: form.bio.trim(),
    });
    toast.success("User added");
    setAddOpen(false);
    setForm({ name: "", email: "", title: "", role: "staff", github: "", bio: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">Users &amp; roles</h1>
        <Button className="rounded-full" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1 size-4" /> Add user
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email"
            className="h-12 rounded-full border-0 bg-card pl-11 shadow-card"
          />
        </div>
        <div className="flex items-center gap-1 rounded-full bg-card p-1.5 shadow-card">
          {(["all", "staff", "admin"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium capitalize text-muted-foreground transition-colors",
                roleFilter === r && "bg-primary text-primary-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <Surface>
        <SectionTitle title="All users" subtitle={`${filtered.length} accounts`} />
        <ul className="divide-y divide-border">
          {filtered.map((u) => (
            <li key={u.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <Initials user={u} size={40} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{u.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{u.email}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
                    u.role === "admin" ? "bg-brand-lilac-soft text-brand-lilac" : "bg-secondary text-muted-foreground",
                  )}
                >
                  {u.role}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    const next: Role = u.role === "admin" ? "staff" : "admin";
                    setRole(u.id, next);
                    toast.success(`${u.name} is now ${next}`);
                  }}
                >
                  {u.role === "admin" ? "Demote to staff" : "Promote to admin"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Surface>

      <Surface>
        <SectionTitle title="Audit trail" subtitle="Who changed what role, and when" />
        <ul className="space-y-2">
          {audit.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-2 rounded-2xl bg-secondary px-3 py-2 text-xs">
              <span className="font-semibold">{a.actor}</span>
              <span className="text-muted-foreground">changed</span>
              <span className="font-semibold">{a.target}</span>
              <span className="text-muted-foreground">
                from {a.from} to {a.to}
              </span>
              <span className="ml-auto text-[11px] text-muted-foreground">{a.at}</span>
            </li>
          ))}
        </ul>
      </Surface>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
              </Field>
              <Field label="Email">
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl" />
              </Field>
              <Field label="Title">
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl" />
              </Field>
              <Field label="Role">
                <div className="flex gap-2 rounded-xl bg-secondary p-1">
                  {(["staff", "admin"] as Role[]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setForm({ ...form, role })}
                      className={cn(
                        "flex-1 rounded-lg px-3 py-2 text-xs font-semibold capitalize",
                        form.role === role ? "bg-card text-foreground shadow-card" : "text-muted-foreground",
                      )}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="sm:col-span-2">
                <Field label="GitHub">
                  <Input value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} className="rounded-xl" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Bio">
                  <Input value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="rounded-xl" />
                </Field>
              </div>
            </div>
            <Button className="w-full rounded-xl" onClick={submitUser}>
              Add user
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
