import {
  Handshake,
  LayoutGrid,
  LogOut,
  Menu,
  UserPlus,
  UserRoundCog,
  Users,
} from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/auth.tsx";
import { useMeQuery } from "../hooks/use-auth.ts";
import { useErrorToast } from "../hooks/use-error-toast.ts";
import { initialsOf } from "../lib/utils.ts";
import CreateDealModal from "./create-deal-modal.tsx";
import CreateLeadModal from "./create-lead-modal.tsx";
import { Button } from "./ui/button.tsx";

interface NavItem {
  icon: typeof LayoutGrid;
  label: string;
  /** Rota ainda não implementada: renderiza desabilitado com badge. */
  soon?: boolean;
  to: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutGrid, label: "Dashboard", soon: true, to: "/dashboard" },
  { icon: Users, label: "Leads", to: "/leads" },
  { icon: Handshake, label: "Negócios", to: "/deals" },
  { icon: UserRoundCog, label: "Vendedores", soon: true, to: "/sellers" },
];

interface AppShellActions {
  openDealModal: () => void;
  openLeadModal: () => void;
}

const AppShellContext = createContext<AppShellActions | null>(null);

function useAppShell(): AppShellActions {
  const actions = useContext(AppShellContext);
  if (!actions) {
    throw new Error("useAppShell deve ser usado dentro de AppShell");
  }
  return actions;
}

type ActiveModal = "deal" | "lead" | null;

interface AppShellProps {
  children: ReactNode;
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-sm transition-colors duration-150 ${
    isActive
      ? "bg-zinc-800/80 text-white [&_svg]:text-orange-400"
      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100 [&_svg]:text-zinc-500"
  }`;
}

function miniNavLinkClass({ isActive }: { isActive: boolean }) {
  return `flex w-full flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 text-center text-[10px] leading-tight font-medium transition-colors duration-150 ${
    isActive
      ? "bg-zinc-800/80 text-white [&_svg]:text-orange-400"
      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100 [&_svg]:text-zinc-500"
  }`;
}

function SoonBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`rounded-md border border-zinc-800 bg-zinc-900 font-semibold text-zinc-500 uppercase tracking-wider ${
        compact ? "px-1 py-px text-[8px]" : "px-1.5 py-0.5 text-[9px]"
      }`}
    >
      Em breve
    </span>
  );
}

interface SidebarLinkProps {
  item: NavItem;
  mini?: boolean;
  onNavigate?: () => void;
}

function SidebarLink({ item, mini = false, onNavigate }: SidebarLinkProps) {
  if (item.soon) {
    if (mini) {
      return (
        <span
          aria-disabled="true"
          className="flex w-full cursor-not-allowed flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-center font-medium text-[10px] text-zinc-600 leading-tight"
          title={`${item.label} — em breve`}
        >
          <item.icon size={20} strokeWidth={2.2} />
          <span className="w-full truncate text-center">{item.label}</span>
          <SoonBadge compact />
        </span>
      );
    }
    return (
      <span
        aria-disabled="true"
        className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-sm text-zinc-600"
        title={`${item.label} — em breve`}
      >
        <item.icon size={18} strokeWidth={2.2} />
        {item.label}
        <span className="ml-auto">
          <SoonBadge />
        </span>
      </span>
    );
  }

  if (mini) {
    return (
      <NavLink className={miniNavLinkClass} onClick={onNavigate} to={item.to}>
        <item.icon size={20} strokeWidth={2.2} />
        <span className="w-full truncate text-center" title={item.label}>
          {item.label}
        </span>
      </NavLink>
    );
  }
  return (
    <NavLink className={navLinkClass} onClick={onNavigate} to={item.to}>
      <item.icon size={18} strokeWidth={2.2} />
      {item.label}
    </NavLink>
  );
}

function AppShell({ children }: AppShellProps) {
  const meQuery = useMeQuery();
  const { logout } = useAuth();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const seller = meQuery.data;
  useErrorToast(meQuery);
  const displayName = seller?.name ?? "…";
  const initials = initialsOf(displayName);

  const openLeadModal = useCallback(() => {
    setMobileOpen(false);
    setActiveModal("lead");
  }, []);

  const openDealModal = useCallback(() => {
    setMobileOpen(false);
    setActiveModal("deal");
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const toggleSidebar = useCallback(() => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      setCollapsed((current) => !current);
    } else {
      setMobileOpen(true);
    }
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const actions = useMemo<AppShellActions>(
    () => ({ openDealModal, openLeadModal }),
    [openDealModal, openLeadModal]
  );

  return (
    <AppShellContext.Provider value={actions}>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-zinc-800/60 border-b bg-zinc-950/90 px-3 backdrop-blur-md md:px-4">
          <Button
            aria-label="Alternar menu"
            onClick={toggleSidebar}
            size="icon"
            title="Menu"
            type="button"
            variant="ghost"
          >
            <Menu size={20} />
          </Button>

          <Link aria-label="SalesPipeline - início" to="/leads">
            <Wordmark />
          </Link>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <Button
              className="hidden sm:inline-flex"
              onClick={openLeadModal}
              size="sm"
              type="button"
              variant="secondary"
            >
              <UserPlus size={16} strokeWidth={2.5} />
              Novo Lead
            </Button>
            <Button
              aria-label="Novo Lead"
              className="sm:hidden"
              onClick={openLeadModal}
              size="icon-sm"
              title="Novo Lead"
              type="button"
              variant="secondary"
            >
              <UserPlus size={16} strokeWidth={2.5} />
            </Button>

            <Button
              className="hidden sm:inline-flex"
              onClick={openDealModal}
              size="sm"
              type="button"
            >
              <Handshake size={16} strokeWidth={2.5} />
              Novo Deal
            </Button>
            <Button
              aria-label="Novo Deal"
              className="sm:hidden"
              onClick={openDealModal}
              size="icon-sm"
              title="Novo Deal"
              type="button"
            >
              <Handshake size={16} strokeWidth={2.5} />
            </Button>

            <span
              aria-hidden
              className="mx-1 hidden h-6 w-px bg-zinc-800 sm:block"
            />

            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 font-semibold text-white text-xs shadow-md shadow-orange-950/40"
              title={displayName}
            >
              {initials}
            </div>
            <Button
              aria-label="Sair"
              onClick={logout}
              size="icon-sm"
              title="Sair"
              type="button"
              variant="ghost"
            >
              <LogOut size={16} strokeWidth={2.2} />
            </Button>
          </div>
        </header>

        <div className="flex">
          <aside
            className={`sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 flex-col border-zinc-800/60 border-r bg-zinc-950 py-3 transition-[width] duration-200 md:flex ${
              collapsed ? "w-[88px] px-2" : "w-60 px-3"
            }`}
          >
            <nav className="flex-1 space-y-1">
              {NAV_ITEMS.map((item) => (
                <SidebarLink item={item} key={item.to} mini={collapsed} />
              ))}
            </nav>

            {collapsed ? (
              <div className="flex justify-center border-zinc-800/60 border-t pt-3">
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 font-semibold text-white text-xs"
                  title={displayName}
                >
                  {initials}
                  <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 bg-emerald-500" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 border-zinc-800/60 border-t px-2 pt-4">
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 font-semibold text-white text-xs shadow-md shadow-orange-950/40">
                  {initials}
                  <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 bg-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-sm text-white">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {seller?.email ?? " "}
                  </p>
                </div>
              </div>
            )}
          </aside>

          {mobileOpen ? (
            <div className="fixed inset-0 z-40 md:hidden">
              <button
                aria-label="Fechar menu"
                className="absolute inset-0 cursor-default bg-black/60"
                onClick={closeMobile}
                type="button"
              />
              <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-zinc-800/60 border-r bg-zinc-950">
                <div className="flex h-14 items-center gap-2 border-zinc-800/60 border-b px-3">
                  <Button
                    aria-label="Fechar menu"
                    onClick={closeMobile}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Menu size={20} />
                  </Button>
                  <Wordmark />
                </div>
                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
                  {NAV_ITEMS.map((item) => (
                    <SidebarLink
                      item={item}
                      key={item.to}
                      onNavigate={closeMobile}
                    />
                  ))}
                </nav>
                <div className="flex items-center gap-3 border-zinc-800/60 border-t px-4 py-4">
                  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 font-semibold text-white text-xs">
                    {initials}
                    <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 bg-emerald-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-sm text-white">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {seller?.email ?? " "}
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          ) : null}

          <div className="relative min-w-0 flex-1">
            <div
              aria-hidden
              className="app-backdrop pointer-events-none absolute inset-x-0 top-0 h-80"
            />
            <div className="relative">{children}</div>
          </div>
        </div>

        {activeModal === "lead" ? (
          <CreateLeadModal onClose={closeModal} />
        ) : null}
        {activeModal === "deal" ? (
          <CreateDealModal onClose={closeModal} />
        ) : null}
      </div>
    </AppShellContext.Provider>
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
        <span className="ml-1.5 hidden rounded-md border border-orange-500/20 bg-orange-500/10 px-1.5 py-0.5 align-middle font-semibold text-[9px] text-orange-400 uppercase tracking-widest sm:inline-block">
          CRM
        </span>
      </span>
    </span>
  );
}

export default AppShell;
export type { AppShellActions };
export { useAppShell };
