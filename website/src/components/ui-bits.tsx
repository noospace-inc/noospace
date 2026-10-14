import { Check, Copy, ExternalLink, Mail } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { AccentKey, PropLink, TaskStatus, User } from "@/lib/mock-data";

export const accent: Record<AccentKey, { soft: string; solid: string; text: string; ring: string }> = {
  blue: { soft: "bg-brand-blue-soft", solid: "bg-brand-blue", text: "text-brand-blue", ring: "ring-brand-blue/30" },
  pink: { soft: "bg-brand-pink-soft", solid: "bg-brand-pink", text: "text-brand-pink", ring: "ring-brand-pink/30" },
  green: { soft: "bg-brand-green-soft", solid: "bg-brand-green", text: "text-brand-green", ring: "ring-brand-green/30" },
  peach: { soft: "bg-brand-peach-soft", solid: "bg-brand-peach", text: "text-brand-peach", ring: "ring-brand-peach/30" },
  lilac: { soft: "bg-brand-lilac-soft", solid: "bg-brand-lilac", text: "text-brand-lilac", ring: "ring-brand-lilac/30" },
};

export function Surface({
  className,
  hover,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div className={cn("card-surface p-5", hover && "card-hover", className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
      <div className="min-w-0">
        <h2 className="truncate text-lg font-semibold tracking-tight">{title}</h2>
        {subtitle ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Initials({ user, size = 32, className }: { user: User; size?: number; className?: string }) {
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  return (
    <Avatar
      title={user.name}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={cn(
        "ring-2 ring-card",
        className,
      )}
    >
      {user.photoUrl ? <AvatarImage src={user.photoUrl} alt={`${user.name}'s Google profile`} referrerPolicy="no-referrer" /> : null}
      <AvatarFallback className={cn("font-semibold text-foreground/80", accent[user.accent].soft)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

export function AvatarGroup({ people, size = 28, max = 4 }: { people: User[]; size?: number; max?: number }) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((p) => (
        <Initials key={p.id} user={p} size={size} />
      ))}
      {rest > 0 ? (
        <span
          style={{ width: size, height: size, fontSize: size * 0.34 }}
          className="inline-flex items-center justify-center rounded-full bg-secondary font-semibold text-muted-foreground ring-2 ring-card"
        >
          +{rest}
        </span>
      ) : null}
    </div>
  );
}

export function ProgressBar({ value, tone = "blue" }: { value: number; tone?: AccentKey }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className={cn("h-full rounded-full transition-all duration-500", accent[tone].solid)}
        style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "blue",
  onClick,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: AccentKey;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className={cn("absolute right-3 top-3 grid size-8 shrink-0 place-items-center rounded-xl sm:size-9", accent[tone].soft)}>
        <Icon className={cn("size-4 sm:size-5", accent[tone].text)} />
      </span>
      <div className="min-w-0 pr-9">
        <p className="text-[11px] font-medium leading-snug text-muted-foreground sm:text-xs">{label}</p>
        <p className="text-xl font-bold leading-tight tracking-tight sm:text-2xl">{value}</p>
        {hint ? <p className="text-[10px] leading-snug text-muted-foreground sm:text-[11px]">{hint}</p> : null}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block h-full w-full text-left">
        <Surface hover className="relative h-full p-3 sm:p-5">
          {content}
        </Surface>
      </button>
    );
  }

  return (
    <Surface hover className="relative h-full p-3 sm:p-5">
      {content}
    </Surface>
  );
}

const statusMeta: Record<TaskStatus, { label: string; className: string; symbol: string }> = {
  pending: { label: "Awaiting approval", className: "bg-status-pending/15 text-status-pending", symbol: "◷" },
  approved: { label: "Approved", className: "bg-status-approved/15 text-status-approved", symbol: "✓" },
  overdue: { label: "Missed deadline", className: "bg-status-overdue/15 text-status-overdue", symbol: "!" },
  carried: { label: "Carried over", className: "bg-status-overdue/15 text-status-overdue", symbol: "↻" },
};

export function StatusPill({ status, compact }: { status: TaskStatus; compact?: boolean }) {
  const meta = statusMeta[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors",
        meta.className,
      )}
    >
      <span aria-hidden>{meta.symbol}</span>
      {!compact && meta.label}
    </span>
  );
}

export function LinkChip({ link }: { link: PropLink }) {
  const [copied, setCopied] = useState(false);
  const isEmail = !link.url;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link.value || link.url);
      setCopied(true);
      toast.success(`${link.label || "Link"} copied`);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error("Could not copy");
    }
  };
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-secondary py-1.5 pl-3 pr-1.5 text-xs font-medium">
      {isEmail ? <Mail className="size-3.5 text-muted-foreground" /> : null}
      <span className="max-w-[180px] truncate">{link.label || link.value}</span>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${link.label}`}
        className="grid size-6 place-items-center rounded-full bg-card text-muted-foreground transition-colors hover:text-foreground"
      >
        {copied ? <Check className="size-3.5 text-status-approved" /> : <Copy className="size-3.5" />}
      </button>
      {!isEmail ? (
        <a
          href={link.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${link.label}`}
          className="grid size-6 place-items-center rounded-full bg-card text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink className="size-3.5" />
        </a>
      ) : null}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <div className="mb-4 flex items-end gap-1.5" aria-hidden>
        <span className="h-6 w-4 rounded-md bg-brand-blue-soft" />
        <span className="h-10 w-4 rounded-md bg-brand-pink-soft" />
        <span className="h-8 w-4 rounded-md bg-brand-green-soft" />
        <span className="h-12 w-4 rounded-md bg-brand-peach-soft" />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
