import type { ReactNode } from "react";
import { BarChart3, BriefcaseBusiness, ClipboardList, FileText, GraduationCap, LogOut, Search, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "../../shared/components/Button";
import { cn } from "../../shared/utils/cn";
import { useAuth } from "../../features/auth/AuthProvider";

const appLinks = [
  { to: "/app", label: "Overview", icon: BarChart3 },
  { to: "/app/freshers", label: "Freshers Hub", icon: GraduationCap },
  { to: "/app/jobs", label: "Jobs", icon: Search },
  { to: "/app/recommended", label: "Recommended", icon: Sparkles },
  { to: "/app/resume", label: "Resume", icon: FileText },
  { to: "/app/saved", label: "Saved", icon: BriefcaseBusiness },
  { to: "/app/applications", label: "Applications", icon: ClipboardList },
  { to: "/app/profile", label: "Profile", icon: UserRound },
];

export function AppLayout() {
  const { user, signout } = useAuth();
  const navigate = useNavigate();

  async function handleSignout() {
    await signout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-stone-200 bg-white px-4 py-5 lg:block">
        <div className="flex items-center gap-3 px-2 text-lg font-semibold">
          <span className="grid size-10 place-items-center rounded-md bg-teal-700 text-white">
            <BriefcaseBusiness size={21} />
          </span>
          CareerOS India
        </div>
        <nav className="mt-8 grid gap-1">
          {appLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/app"}
              className={({ isActive }) =>
                cn(
                  "focus-ring flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-950",
                  isActive && "bg-teal-50 text-teal-900",
                )
              }
            >
              <link.icon size={18} />
              {link.label}
            </NavLink>
          ))}
          {user?.role === "ADMIN" ? (
            <NavLink
              to="/admin/ingestion"
              className={({ isActive }) =>
                cn(
                  "focus-ring flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-950",
                  isActive && "bg-teal-50 text-teal-900",
                )
              }
            >
              <ShieldCheck size={18} />
              Ingestion
            </NavLink>
          ) : null}
        </nav>
        <div className="absolute bottom-5 left-4 right-4">
          <div className="mb-3 rounded-md bg-stone-100 p-3">
            <p className="truncate text-sm font-medium text-stone-950">{user?.email}</p>
            <p className="mt-1 text-xs text-stone-500">{user?.role}</p>
          </div>
          <Button className="w-full" variant="secondary" icon={<LogOut size={17} />} onClick={handleSignout}>
            Sign out
          </Button>
        </div>
      </aside>
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-base font-semibold">
            <BriefcaseBusiness size={20} />
            CareerOS
          </div>
          <Button variant="ghost" icon={<LogOut size={18} />} onClick={handleSignout} aria-label="Sign out" />
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {appLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/app"}
              className={({ isActive }) =>
                cn(
                  "focus-ring inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium text-stone-600",
                  isActive && "bg-teal-50 text-teal-900",
                )
              }
            >
              <link.icon size={16} />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function PageHeader({ title, body, action }: { readonly title: string; readonly body?: string; readonly action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-stone-950">{title}</h1>
        {body ? <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}
