import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCircle2, CircleDollarSign, LogIn, CalendarPlus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionTitle, Surface } from "@/components/ui-bits";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/notifications")({ head: () => ({ meta: [{ title: "Notifications — Noospace" }] }), component: NotificationsPage });

function NotificationsPage() {
  const { notifications, currentUser, clearNotifications } = useStore();
  const visible = currentUser.role === "admin" ? notifications : notifications.filter((item) => item.kind !== "login");
  const storageKey = `noospace-seen-notifications-${currentUser.id}`;
  const [seen, setSeen] = useState<string[]>([]);
  useEffect(() => {
    try { setSeen(JSON.parse(localStorage.getItem(storageKey) ?? "[]")); } catch { setSeen([]); }
  }, [storageKey]);
  const visibleIds = visible.map((item) => item.id).join(",");
  useEffect(() => {
    if (!visible.length) return;
    if (visible.every((item) => seen.includes(item.id))) return;
    const timer = window.setTimeout(() => {
      const next = [...new Set([...seen, ...visibleIds.split(",")])];
      setSeen(next);
      localStorage.setItem(storageKey, JSON.stringify(next));
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [visibleIds, storageKey, seen]);
  const icon = (kind: string) => kind === "login" ? LogIn : kind === "money" ? CircleDollarSign : kind === "schedule" ? CalendarPlus : CheckCircle2;

  return <div className="space-y-5">
    <SectionTitle title="Notifications" subtitle="Recent workspace activity and updates." action={<Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" disabled={!visible.length} onClick={clearNotifications}><Trash2 className="mr-1.5 size-4" />Delete all</Button>} />
    <Surface className="divide-y divide-border p-0">
      {visible.length ? visible.map((item) => {
        const Icon = icon(item.kind);
        const isNew = !seen.includes(item.id);
        return <div key={item.id} className={`flex items-start gap-3 p-4 transition-colors sm:p-5 ${isNew ? "bg-brand-blue-soft/60" : "bg-transparent"}`}>
          <span className={`grid size-9 shrink-0 place-items-center rounded-full ${isNew ? "bg-brand-blue/15 text-brand-blue" : "bg-secondary text-muted-foreground"}`}><Icon className="size-4" /></span>
          <div className="min-w-0 flex-1"><p className="text-sm">{item.text}</p><time className="mt-1 block text-xs text-muted-foreground" dateTime={item.at}>{new Date(item.at).toLocaleString("en-IN")}</time></div>
          {isNew && <span className="mt-1 size-2 shrink-0 rounded-full bg-brand-blue" aria-label="New" />}
        </div>;
      }) : <div className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground"><Bell className="size-6" /><p className="text-sm">No notifications yet.</p></div>}
    </Surface>
  </div>;
}
