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
  return `flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-sm transition-colors ${
    isActive
      ? "bg-orange-500/10 text-orange-400"
      : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
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
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col bg-black md:flex">
        <div className="px-6 pt-7 pb-8">
          <Wordmark />
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink className={navLinkClass} key={item.to} to={item.to}>
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 border-zinc-800/60 border-t px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500 font-semibold text-white text-xs">
            {initials}
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

      <header className="flex items-center justify-between border-zinc-800/60 border-b bg-black px-4 py-3 md:hidden">
        <Wordmark />
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 font-semibold text-white text-xs">
          {initials}
        </div>
      </header>

      <div className="md:pl-60">{children}</div>
    </div>
  );
}

function Wordmark() {
  return (
    <span className="font-bold text-xl tracking-tight">
      <span className="text-white">Sales</span>
      <span className="text-orange-500">Pipeline</span>
      <span className="ml-1 align-super font-semibold text-[10px] text-orange-500">
        CRM
      </span>
    </span>
  );
}

export default AppShell;
