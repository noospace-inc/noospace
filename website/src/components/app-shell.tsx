import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  FolderKanban,
  LayoutDashboard,
  Moon,
  Search,
  Shield,
  Sun,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Initials } from "@/components/ui-bits";
import { GlobalSearch } from "@/components/global-search";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/cashbook", label: "Cashbook", icon: Wallet, adminOnly: true },
  { to: "/users", label: "Users & Roles", icon: Shield, adminOnly: true },
] as const;

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return { dark, toggle: () => setDark((d) => !d) };
}

export function AppShell({ children }: { children: ReactNode; onSignOut?: () => void | Promise<void> }) {
  const { currentUser } = useStore();
  const { dark, toggle } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = nav.filter((i) => !("adminOnly" in i && i.adminOnly) || currentUser.role === "admin");

  return (
    <TooltipProvider delayDuration={120}>
      <div className="min-h-screen w-full px-3 pb-6 pt-3 sm:px-5 sm:pt-5">
        <div className="mx-auto flex max-w-[1400px] gap-4">
          <aside className="sticky top-5 hidden h-[calc(100vh-2.5rem)] shrink-0 md:block">
            <div className="flex h-full w-16 flex-col items-center justify-between rounded-3xl bg-sidebar py-4 shadow-card">
              <div className="flex flex-col items-center gap-2">
                <Link to="/" aria-label="Noospace dashboard" className="mb-3 grid size-10 place-items-center overflow-hidden rounded-2xl bg-primary">
                  <img src="/favicon.svg" alt="" className="size-full object-cover" />
                </Link>
                {items.map((item) => {
                  const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                  return (
                    <Tooltip key={item.to}>
                      <TooltipTrigger asChild>
                        <Link
                          to={item.to}
                          className={cn(
                            "grid size-10 place-items-center rounded-2xl text-muted-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-foreground",
                            active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                          )}
                        >
                          <item.icon className="size-[18px]" />
                          <span className="sr-only">{item.label}</span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={toggle}
                aria-label="Toggle dark mode"
                className="grid size-10 place-items-center rounded-2xl text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              >
                {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
              </button>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <header className="sticky top-0 z-40 -mx-3 mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 bg-background/85 px-3 py-2 backdrop-blur-md sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none md:gap-3">
              <nav className="grid grid-flow-col auto-cols-fr items-center gap-1 rounded-full bg-card p-1 shadow-card md:flex">
                {items.map((item) => {
                  const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      aria-label={item.label}
                      className={cn(
                        "flex min-w-0 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium text-muted-foreground transition-colors",
                        "size-9 md:size-auto md:px-4 md:py-2",
                        active && "bg-primary text-primary-foreground",
                      )}
                    >
                      <item.icon className="size-[18px] md:hidden" />
                      <span className="hidden md:inline">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="flex items-center gap-1 rounded-full bg-card p-1.5 shadow-card">
                <button
                  type="button"
                  aria-label="Search"
                  onClick={() => setSearchOpen(true)}
                  className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Search className="size-4" />
                </button>
                <Link to="/notifications" aria-label="Notifications" className="relative grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                  <Bell className="size-4" />
                </Link>
                <button
                  type="button"
                  onClick={toggle}
                  aria-label="Toggle dark mode"
                  className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
                >
                  {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </button>
                <Link to="/profile" aria-label={`Profile: ${currentUser.name}`}><Initials user={currentUser} size={32} /></Link>
              </div>
            </header>
            <main className="pb-10">{children}</main>
          </div>
        </div>
      </div>
      <GlobalSearch open={searchOpen} setOpen={setSearchOpen} />
    </TooltipProvider>
  );
}
