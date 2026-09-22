import { Handshake, LayoutGrid, UserRoundCog, Users } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { icon: LayoutGrid, label: "Dashboard", to: "/dashboard" },
  { icon: Users, label: "Leads", to: "/leads" },
  { icon: Handshake, label: "Negócios", to: "/deals" },
  { icon: UserRoundCog, label: "Vendedores", to: "/sellers" },
];

const CURRENT_USER = {
  name: "Rodrigo Ramos",
  role: "Diretor de Vendas",
};

interface AppShellProps {
  children: ReactNode;
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-sm transition-colors duration-150 ${
    isActive
      ? "border border-orange-500/20 bg-gradient-to-r from-orange-500/15 to-orange-500/5 text-orange-300 shadow-sm shadow-orange-950/20"
      : "border border-transparent text-zinc-400 hover:border-zinc-800/60 hover:bg-zinc-900 hover:text-zinc-200"
  }`;
}

function AppShell({ children }: AppShellProps) {
  const initials = CURRENT_USER.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-zinc-800/60 border-r bg-zinc-950 md:flex">
        <div className="px-6 pt-7 pb-8">
          <Wordmark />
        </div>

        <nav className="flex-1 space-y-1 px-3">
          <p className="px-3 pb-2 font-semibold text-[11px] text-zinc-600 uppercase tracking-widest">
            Menu
          </p>
          {NAV_ITEMS.map((item) => (
            <NavLink className={navLinkClass} key={item.to} to={item.to}>
              <item.icon size={18} strokeWidth={2.2} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 border-zinc-800/60 border-t px-4 py-4">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 font-semibold text-white text-xs shadow-md shadow-orange-950/40">
            {initials}
            <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 bg-emerald-500" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-sm text-white">
              {CURRENT_USER.name}
            </p>
            <p className="truncate text-xs text-zinc-500">
              {CURRENT_USER.role}
            </p>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-10 flex items-center justify-between border-zinc-800/60 border-b bg-zinc-950/80 px-4 py-3 backdrop-blur-md md:hidden">
        <Wordmark />
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 font-semibold text-white text-xs shadow-md shadow-orange-950/40">
          {initials}
        </div>
      </header>

      <div className="relative md:pl-60">
        <div
          aria-hidden
          className="app-backdrop pointer-events-none absolute inset-x-0 top-0 h-80"
        />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 shadow-md shadow-orange-950/40">
        <Handshake className="text-white" size={17} strokeWidth={2.4} />
      </span>
      <span className="font-bold text-[17px] tracking-tight">
        <span className="text-white">Sales</span>
        <span className="text-orange-500">Pipeline</span>
        <span className="ml-1.5 rounded-md border border-orange-500/20 bg-orange-500/10 px-1.5 py-0.5 align-middle font-semibold text-[9px] text-orange-400 uppercase tracking-widest">
          CRM
        </span>
      </span>
    </span>
  );
}

export default AppShell;
