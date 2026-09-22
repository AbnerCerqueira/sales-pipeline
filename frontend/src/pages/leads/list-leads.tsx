import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  UserSearch,
  X,
} from "lucide-react";
import type { ChangeEvent } from "react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import AppShell from "../../components/app-shell.tsx";
import Button from "../../components/button.tsx";
import CreateLeadModal from "../../components/create-lead-modal.tsx";
import Highlight from "../../components/highlight.tsx";
import Input from "../../components/input.tsx";
import Select from "../../components/select.tsx";
import { useErrorToast } from "../../hooks/use-error-toast.ts";
import { useLeadsQuery } from "../../hooks/use-leads.ts";
import { useSellersQuery } from "../../hooks/use-sellers.ts";
import { formatCreatedAt, formatLeadSource } from "../../lib/lead-options.ts";

const PAGE_SIZE = 12;

const TABLE_HEADERS = [
  "Nome",
  "Empresa",
  "E-mail",
  "WhatsApp",
  "Vendedor",
  "Origem",
  "Cadastrado em",
];

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ListLeadsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sellersQuery = useSellersQuery();
  const leadsQuery = useLeadsQuery({
    name: debouncedSearch || undefined,
    page,
    pageSize: PAGE_SIZE,
    responsibleId: responsibleId || undefined,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useErrorToast(leadsQuery);
  useErrorToast(sellersQuery);

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSearch(event.target.value);
    },
    []
  );

  const handleResponsibleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      setResponsibleId(event.target.value);
      setPage(1);
    },
    []
  );

  const clearSearch = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  }, []);

  const clearSellerFilter = useCallback(() => {
    setResponsibleId("");
    setPage(1);
  }, []);

  const goToPreviousPage = useCallback(() => {
    setPage((current) => current - 1);
  }, []);

  const goToNextPage = useCallback(() => {
    setPage((current) => current + 1);
  }, []);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const leads = leadsQuery.data?.items ?? [];
  const total = leadsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isRefreshing = leadsQuery.isFetching && !leadsQuery.isPending;
  const hasSellerFilter = responsibleId !== "";

  let tableBody: ReactNode;
  if (leadsQuery.isPending) {
    tableBody = Array.from({ length: 5 }).map((_, index) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: placeholder rows are positional
      <tr className="transition-colors hover:bg-zinc-800/30" key={index}>
        <td className="px-5 py-4" colSpan={TABLE_HEADERS.length}>
          <div className="h-4 animate-pulse rounded-md bg-zinc-800" />
        </td>
      </tr>
    ));
  } else if (leads.length === 0) {
    tableBody = (
      <tr>
        <td className="px-5 py-14 text-center" colSpan={TABLE_HEADERS.length}>
          <UserSearch className="mx-auto text-zinc-700" size={28} />
          <p className="mt-3 font-medium text-sm text-zinc-300">
            Nenhum lead encontrado
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Ajuste a busca ou cadastre um novo lead para começar.
          </p>
        </td>
      </tr>
    );
  } else {
    tableBody = leads.map((lead) => (
      <tr className="transition-colors hover:bg-zinc-800/30" key={lead.id}>
        <td className="px-5 py-3.5">
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-orange-500/20 bg-orange-500/10 font-semibold text-[11px] text-orange-300">
              {initialsOf(lead.fullName)}
            </span>
            <span className="whitespace-nowrap font-medium text-zinc-100">
              <Highlight query={search} text={lead.fullName} />
            </span>
          </span>
        </td>
        <td className="whitespace-nowrap px-5 py-3.5 text-zinc-300">
          {lead.companyName}
        </td>
        <td className="whitespace-nowrap px-5 py-3.5 text-zinc-400">
          {lead.email}
        </td>
        <td className="whitespace-nowrap px-5 py-3.5 text-zinc-400">
          {lead.whatsapp}
        </td>
        <td className="whitespace-nowrap px-5 py-3.5 text-zinc-300">
          {lead.responsible.name}
        </td>
        <td className="px-5 py-3.5">
          <span className="inline-flex whitespace-nowrap rounded-full border border-zinc-700/60 bg-zinc-800/60 px-2.5 py-0.5 font-medium text-xs text-zinc-300">
            {formatLeadSource(lead.source)}
          </span>
        </td>
        <td className="whitespace-nowrap px-5 py-3.5 text-zinc-500">
          {formatCreatedAt(lead.createdAt)}
        </td>
      </tr>
    ));
  }

  return (
    <AppShell>
      <header className="border-zinc-800/60 border-b px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-semibold text-[11px] text-orange-400/80 uppercase tracking-widest">
              CRM — Vendas
            </p>
            <h1 className="mt-1 font-bold text-2xl text-white tracking-tight">
              Leads
            </h1>
          </div>
          <Button
            className="self-start px-4 shadow-lg shadow-orange-950/40 sm:self-auto"
            onClick={openModal}
            type="button"
          >
            <Plus size={16} strokeWidth={2.5} />
            Novo Lead
          </Button>
        </div>
      </header>

      <main className="px-4 py-6 md:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-600"
              size={16}
            />
            <Input
              aria-label="Buscar lead por nome"
              className="pr-9 pl-9 [&::-webkit-search-cancel-button]:appearance-none"
              onChange={handleSearchChange}
              placeholder="Buscar nome..."
              type="search"
              value={search}
            />
            {search === "" ? null : (
              <button
                aria-label="Limpar busca"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1 text-zinc-500 transition-colors hover:text-zinc-200"
                onClick={clearSearch}
                type="button"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <Select
            aria-label="Filtrar por vendedor responsável"
            className="w-52"
            onChange={handleResponsibleChange}
            value={responsibleId}
          >
            <option value="">Vendedor: Todos</option>
            {sellersQuery.data?.map((seller) => (
              <option key={seller.id} value={seller.id}>
                Vendedor: {seller.name}
              </option>
            ))}
          </Select>
          {hasSellerFilter ? (
            <button
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 font-medium text-orange-300 text-xs transition-colors hover:bg-orange-500/15"
              onClick={clearSellerFilter}
              type="button"
            >
              <X size={12} />
              Limpar filtros
            </button>
          ) : null}
          <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1 font-medium text-xs text-zinc-400">
            {leadsQuery.isFetching ? (
              <Loader2 className="animate-spin text-orange-400" size={12} />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
            {total} {total === 1 ? "lead encontrado" : "leads encontrados"}
          </span>
        </div>

        <div
          className={`mt-4 overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50 shadow-black/20 shadow-xl ring-1 ring-white/5 transition-opacity ${
            isRefreshing ? "opacity-60" : "opacity-100"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-zinc-800/80 border-b bg-zinc-900/60">
                  {TABLE_HEADERS.map((header) => (
                    <th
                      className="whitespace-nowrap px-5 py-3 font-semibold text-[11px] text-zinc-500 uppercase tracking-widest"
                      key={header}
                      scope="col"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">{tableBody}</tbody>
            </table>
          </div>

          {leads.length > 0 ? (
            <div className="flex items-center justify-between border-zinc-800/80 border-t bg-zinc-900/60 px-5 py-3">
              <span className="text-xs text-zinc-500">
                Página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  aria-label="Página anterior"
                  className="px-2.5"
                  disabled={page <= 1}
                  onClick={goToPreviousPage}
                  type="button"
                  variant="secondary"
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  aria-label="Próxima página"
                  className="px-2.5"
                  disabled={page >= totalPages}
                  onClick={goToNextPage}
                  type="button"
                  variant="secondary"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {isModalOpen ? <CreateLeadModal onClose={closeModal} /> : null}
    </AppShell>
  );
}

export default ListLeadsPage;
