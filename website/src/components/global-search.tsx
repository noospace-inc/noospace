import { useNavigate } from "@tanstack/react-router";
import { CalendarDays, FolderKanban, LayoutDashboard, ListChecks, Shield, Users, Wallet } from "lucide-react";
import { useEffect, useMemo } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useStore } from "@/lib/store";

const pages = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/cashbook", label: "Cashbook", icon: Wallet },
  { to: "/users", label: "Users & roles", icon: Shield },
] as const;

export function GlobalSearch({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const { projects, users } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const tasks = useMemo(
    () =>
      projects.flatMap((p) =>
        p.schedules.flatMap((s) => s.tasks.map((t) => ({ projectId: p.id, projectName: p.name, label: t.label }))),
      ),
    [projects],
  );

  const go = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search projects, people, tasks…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages.map((p) => (
            <CommandItem key={p.to} value={`page ${p.label}`} onSelect={() => go(() => navigate({ to: p.to }))}>
              <p.icon className="mr-2 size-4" />
              {p.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Projects">
          {projects.map((p) => (
            <CommandItem
              key={p.id}
              value={`project ${p.name} ${p.description}`}
              onSelect={() => go(() => navigate({ to: "/projects/$projectId", params: { projectId: p.id } }))}
            >
              <FolderKanban className="mr-2 size-4" />
              {p.name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="People">
          {users.map((u) => (
            <CommandItem key={u.id} value={`person ${u.name} ${u.title}`} onSelect={() => go(() => navigate({ to: "/employees" }))}>
              <Users className="mr-2 size-4" />
              <span>{u.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">{u.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Tasks">
          {tasks.slice(0, 40).map((t, i) => (
            <CommandItem
              key={i}
              value={`task ${t.label} ${t.projectName}`}
              onSelect={() => go(() => navigate({ to: "/projects/$projectId", params: { projectId: t.projectId } }))}
            >
              <ListChecks className="mr-2 size-4" />
              <span className="truncate">{t.label}</span>
              <span className="ml-2 shrink-0 text-xs text-muted-foreground">{t.projectName}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
