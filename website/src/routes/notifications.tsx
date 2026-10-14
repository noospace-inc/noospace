import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCircle2, CircleDollarSign, LogIn, CalendarPlus } from "lucide-react";

import { SectionTitle, Surface } from "@/components/ui-bits";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Noospace" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { notifications, currentUser } = useStore();
  const visible = currentUser.role === "admin" ? notifications : notifications.filter((item) => item.kind !== "login");
  const icon = (kind: string) => kind === "login" ? LogIn : kind === "money" ? CircleDollarSign : kind === "schedule" ? CalendarPlus : CheckCircle2;

  return <div className="space-y-5">
    <SectionTitle title="Notifications" subtitle="Recent workspace activity and updates." />
    <Surface className="divide-y divide-border p-0">
      {visible.length ? visible.map((item) => {
        const Icon = icon(item.kind);
        return <div key={item.id} className="flex items-start gap-3 p-4 sm:p-5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-primary"><Icon className="size-4" /></span>
          <div className="min-w-0 flex-1"><p className="text-sm">{item.text}</p><time className="mt-1 block text-xs text-muted-foreground" dateTime={item.at}>{new Date(item.at).toLocaleString("en-IN")}</time></div>
        </div>;
      }) : <div className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground"><Bell className="size-6" /><p className="text-sm">No notifications yet.</p></div>}
    </Surface>
  </div>;
}
