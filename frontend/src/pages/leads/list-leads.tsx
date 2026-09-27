import type { LeadDTO, SellerDTO } from "@sales/shared";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageCircle,
  RefreshCw,
  SearchX,
  UserPlus,
  UserSearch,
} from "lucide-react";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import AppShell, { useAppShell } from "../../components/app-shell.tsx";
import { ClearFiltersButton } from "../../components/clear-filters-button.tsx";
import { FilterSearchInput } from "../../components/filter-search-input.tsx";
import Highlight from "../../components/highlight.tsx";
import { SellerCombobox } from "../../components/seller-combobox.tsx";
import { Button } from "../../components/ui/button.tsx";
import { useErrorToast } from "../../hooks/use-error-toast.ts";
import { useLeadsQuery } from "../../hooks/use-leads.ts";
import { useSellersQuery } from "../../hooks/use-sellers.ts";
import { formatCreatedAt, formatFullDate } from "../../lib/format.ts";
import {
  formatLeadSource,
  leadSourceBadgeClass,
} from "../../lib/lead-options.ts";
import { whatsappHref } from "../../lib/masks.ts";
import { initialsOf } from "../../lib/utils.ts";

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

function ListLeadsPage() {
  return (
    <AppShell>
      <ListLeadsContent />
    </AppShell>
  );
}

function ListLeadsContent() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [page, setPage] = useState(1);

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

  const handleResponsibleChange = useCallback((value: string) => {
    setResponsibleId(value);
    setPage(1);
  }, []);

  // Limpa o estado já debounced: senão a busca reaplicaria o filtro por 300ms.
  const clearSearch = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setResponsibleId("");
    setPage(1);
  }, []);

  // Página que produziu os dados em tela. Durante o placeholder, `page` já aponta
  // para a próxima e usá-la sozinha produziria um intervalo inconsistente.
  const [renderedPage, setRenderedPage] = useState(page);

  const goToPreviousPage = useCallback(() => {
    setPage((current) => current - 1);
  }, []);

  const goToNextPage = useCallback(() => {
    setPage((current) => current + 1);
  }, []);

  const retryLeads = useCallback(() => {
    leadsQuery.refetch();
  }, [leadsQuery]);

  const { isError, isFetching, isPending, isPlaceholderData } = leadsQuery;
  const leads = leadsQuery.data?.items ?? [];
  const total = leadsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasActiveFilters = responsibleId !== "" || search.trim() !== "";

  useEffect(() => {
    if (!isPlaceholderData) {
      setRenderedPage(page);
    }
  }, [isPlaceholderData, page]);

  const isLoading = isPending;
  // `keepPreviousData`: a query anterior segue na tela enquanto a nova não volta.
  const isPlaceholder = isPlaceholderData;
  const isRefreshing = isFetching && !isLoading;
  // O React Query mantém `data` quando um refetch de background falha, então o
  // erro só vira tela inteira quando não há nada utilizável no cache.
  const showError = isError && leads.length === 0;
  const showEmpty = !(isLoading || showError) && leads.length === 0;
  const showResults = !(isLoading || showError) && leads.length > 0;

  return (
    <>
      <LeadsHeader
        hasActiveFilters={hasActiveFilters}
        isFetching={isFetching}
        onClearFilters={clearFilters}
        onClearSearch={clearSearch}
        onResponsibleChange={handleResponsibleChange}
        onSearchChange={handleSearchChange}
        responsibleId={responsibleId}
        search={search}
        sellers={sellersQuery.data}
        sellersError={sellersQuery.isError}
        sellersPending={sellersQuery.isPending}
        total={total}
      />

      <main className="px-4 py-6 md:px-8">
        <div
          className={`overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50 shadow-black/20 shadow-xl ring-1 ring-white/5 transition-opacity ${
            isRefreshing ? "opacity-60" : "opacity-100"
          }`}
        >
          {isLoading ? <LeadsSkeleton /> : null}
          {showError ? <LeadsError onRetry={retryLeads} /> : null}
          {showEmpty ? (
            <LeadsEmpty filtered={hasActiveFilters} onClear={clearFilters} />
          ) : null}
          {showResults ? (
            <LeadsResults
              count={leads.length}
              // O highlight usa o termo já confirmado pela query: com `search` o
              // destaque piscaria sobre a página anterior durante o placeholder.
              highlightQuery={debouncedSearch}
              isPlaceholder={isPlaceholder}
              leads={leads}
              onNext={goToNextPage}
              onPrevious={goToPreviousPage}
              page={page}
              renderedPage={renderedPage}
              total={total}
              totalPages={totalPages}
            />
          ) : null}
        </div>
      </main>
    </>
  );
}

interface LeadsHeaderProps {
  hasActiveFilters: boolean;
  isFetching: boolean;
  onClearFilters: () => void;
  onClearSearch: () => void;
  onResponsibleChange: (value: string) => void;
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  responsibleId: string;
  search: string;
  sellers: SellerDTO[] | undefined;
  sellersError: boolean;
  sellersPending: boolean;
  total: number;
}

function LeadsHeader({
  hasActiveFilters,
  isFetching,
  onClearFilters,
  onClearSearch,
  onResponsibleChange,
  onSearchChange,
  responsibleId,
  search,
  sellers,
  sellersError,
  sellersPending,
  total,
}: LeadsHeaderProps) {
  return (
    <section
      aria-labelledby="leads-title"
      className="border-zinc-800/60 border-b px-6 py-5 md:px-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-52">
          <p className="font-semibold text-[11px] text-orange-400/80 uppercase tracking-widest">
            CRM — Vendas
          </p>
          <h1
            className="mt-1 font-bold text-2xl text-white tracking-tight"
            id="leads-title"
          >
            Leads
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
            {isFetching ? (
              <Loader2
                aria-hidden
                className="animate-spin text-orange-400"
                size={12}
              />
            ) : (
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-emerald-500"
              />
            )}
            {total} {total === 1 ? "lead encontrado" : "leads encontrados"}
          </p>
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2.5">
          <FilterSearchInput
            ariaLabel="Buscar lead por nome ou empresa"
            onChange={onSearchChange}
            onClear={onClearSearch}
            placeholder="Buscar por nome ou empresa..."
            value={search}
          />
          <SellerCombobox
            className="w-full sm:w-52"
            emptyLabel="Vendedor: Todos"
            isError={sellersError}
            isPending={sellersPending}
            onValueChange={onResponsibleChange}
            placeholder="Buscar vendedor..."
            selectedPrefix="Vendedor: "
            sellers={sellers}
            showAllLabel="Todos"
            value={responsibleId}
          />
          {hasActiveFilters ? (
            <ClearFiltersButton onClear={onClearFilters} />
          ) : null}
        </div>
      </div>
    </section>
  );
}

interface LeadsResultsProps {
  count: number;
  highlightQuery: string;
  isPlaceholder: boolean;
  leads: LeadDTO[];
  onNext: () => void;
  onPrevious: () => void;
  page: number;
  /** Página que originou os dados exibidos; durante o placeholder difere de `page`. */
  renderedPage: number;
  total: number;
  totalPages: number;
}

function LeadsResults({
  count,
  highlightQuery,
  isPlaceholder,
  leads,
  onNext,
  onPrevious,
  page,
  renderedPage,
  total,
  totalPages,
}: LeadsResultsProps) {
  return (
    <>
      {/* Abaixo de `sm` a tabela vira cards: rolagem horizontal esconde colunas sem nenhuma pista visual. */}
      <LeadsCardList highlightQuery={highlightQuery} leads={leads} />
      <div className="hidden overflow-x-auto sm:block">
        <LeadsTable highlightQuery={highlightQuery} leads={leads} />
      </div>

      <div
        aria-busy={isPlaceholder}
        className="flex items-center justify-between gap-3 border-zinc-800/80 border-t bg-zinc-900/60 px-5 py-3"
      >
        <span
          aria-live="polite"
          className="flex items-center gap-1.5 text-xs text-zinc-400"
        >
          {isPlaceholder ? (
            <Loader2
              aria-hidden
              className="animate-spin text-orange-400"
              size={12}
            />
          ) : null}
          {/* Durante o placeholder o intervalo exibido é o da página anterior, ainda em revisão. */}
          <span className={isPlaceholder ? "opacity-60" : ""}>
            {showRange(count, renderedPage, total)}
          </span>
          <span aria-hidden>·</span>
          <span>
            Página {renderedPage} de {totalPages}
          </span>
        </span>
        <div className="flex gap-2">
          <Button
            aria-label="Página anterior"
            disabled={page <= 1}
            onClick={onPrevious}
            size="icon-sm"
            type="button"
            variant="secondary"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            aria-label="Próxima página"
            disabled={page >= totalPages}
            onClick={onNext}
            size="icon-sm"
            type="button"
            variant="secondary"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </>
  );
}

function showRange(count: number, page: number, total: number): string {
  const start = count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = (page - 1) * PAGE_SIZE + count;
  return `${start}–${end} de ${total}`;
}

function LeadsSkeleton() {
  return (
    <div
      aria-label="Carregando leads"
      className="divide-y divide-zinc-800/60"
      role="status"
    >
      <SkeletonLeadRow />
      <SkeletonLeadRow />
      <SkeletonLeadRow />
      <SkeletonLeadRow />
      <SkeletonLeadRow />
    </div>
  );
}

function SkeletonLeadRow() {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-zinc-800" />
      <div className="h-4 flex-1 animate-pulse rounded-md bg-zinc-800" />
    </div>
  );
}

function LeadsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <RefreshCw aria-hidden className="text-zinc-600" size={28} />
      <p className="mt-3 font-medium text-sm text-zinc-200">
        Erro ao carregar os leads
      </p>
      <p className="mt-1 text-sm text-zinc-400">
        Não foi possível buscar os leads. Verifique a conexão e tente novamente.
      </p>
      <Button
        className="mt-4"
        onClick={onRetry}
        size="sm"
        type="button"
        variant="secondary"
      >
        <RefreshCw size={14} strokeWidth={2.5} />
        Tentar novamente
      </Button>
    </div>
  );
}

function LeadsEmpty({
  filtered,
  onClear,
}: {
  filtered: boolean;
  onClear: () => void;
}) {
  const { openLeadModal } = useAppShell();

  if (filtered) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
        <SearchX aria-hidden className="text-zinc-600" size={28} />
        <p className="mt-3 font-medium text-sm text-zinc-200">
          Nenhum lead encontrado para estes filtros
        </p>
        <p className="mt-1 text-sm text-zinc-400">
          Ajuste a busca ou limpe os filtros para ver todos os leads.
        </p>
        <ClearFiltersButton className="mt-4" onClear={onClear} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <UserSearch aria-hidden className="text-zinc-600" size={28} />
      <p className="mt-3 font-medium text-sm text-zinc-200">
        Nenhum lead cadastrado
      </p>
      <p className="mt-1 text-sm text-zinc-400">
        Cadastre o primeiro lead para começar a montar seu pipeline.
      </p>
      <Button className="mt-4" onClick={openLeadModal} size="sm" type="button">
        <UserPlus size={16} strokeWidth={2.5} />
        Cadastrar lead
      </Button>
    </div>
  );
}

function LeadsTable({
  highlightQuery,
  leads,
}: {
  highlightQuery: string;
  leads: LeadDTO[];
}) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-zinc-800/80 border-b bg-zinc-900/60">
          {TABLE_HEADERS.map((header) => (
            <th
              className="whitespace-nowrap px-5 py-3 font-semibold text-[11px] text-zinc-400 uppercase tracking-widest"
              key={header}
              scope="col"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-800/60">
        {leads.map((lead) => {
          const whatsappUrl = whatsappHref(lead.whatsapp);
          return (
            <tr
              className="transition-colors hover:bg-zinc-800/30"
              key={lead.id}
            >
              <td className="px-5 py-3.5">
                <span className="flex items-center gap-3">
                  <LeadAvatar name={lead.fullName} />
                  <span className="whitespace-nowrap font-medium text-zinc-100">
                    <Highlight query={highlightQuery} text={lead.fullName} />
                  </span>
                </span>
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-zinc-300">
                <Highlight query={highlightQuery} text={lead.companyName} />
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-zinc-400">
                {lead.email}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5">
                {whatsappUrl ? (
                  <a
                    className="inline-flex items-center gap-1.5 text-zinc-400 transition-colors hover:text-emerald-300 hover:underline"
                    href={whatsappUrl}
                    rel="noreferrer"
                    target="_blank"
                    title="Conversar no WhatsApp"
                  >
                    <MessageCircle size={13} />
                    {lead.whatsapp}
                  </a>
                ) : (
                  <span className="text-zinc-400">{lead.whatsapp}</span>
                )}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-zinc-300">
                {lead.responsible.name}
              </td>
              <td className="px-5 py-3.5">
                <span
                  className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 font-medium text-xs ${leadSourceBadgeClass(lead.source)}`}
                >
                  {formatLeadSource(lead.source)}
                </span>
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-zinc-400">
                <span title={formatFullDate(lead.createdAt)}>
                  {formatCreatedAt(lead.createdAt)}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function LeadsCardList({
  highlightQuery,
  leads,
}: {
  highlightQuery: string;
  leads: LeadDTO[];
}) {
  return (
    <ul className="divide-y divide-zinc-800/60 sm:hidden">
      {leads.map((lead) => {
        const whatsappUrl = whatsappHref(lead.whatsapp);
        return (
          <li className="px-5 py-4" key={lead.id}>
            <div className="flex items-start gap-3">
              <LeadAvatar name={lead.fullName} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm text-zinc-100">
                  <Highlight query={highlightQuery} text={lead.fullName} />
                </p>
                <p className="truncate text-xs text-zinc-400">
                  <Highlight query={highlightQuery} text={lead.companyName} />
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 font-medium text-xs ${leadSourceBadgeClass(lead.source)}`}
              >
                {formatLeadSource(lead.source)}
              </span>
            </div>

            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <dt className="text-zinc-500">E-mail</dt>
              <dd className="truncate text-zinc-300">{lead.email}</dd>
              <dt className="text-zinc-500">WhatsApp</dt>
              <dd className="truncate text-zinc-300">
                {whatsappUrl ? (
                  <a
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-emerald-300 hover:underline"
                    href={whatsappUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <MessageCircle size={13} />
                    {lead.whatsapp}
                  </a>
                ) : (
                  lead.whatsapp
                )}
              </dd>
              <dt className="text-zinc-500">Vendedor</dt>
              <dd className="truncate text-zinc-300">
                {lead.responsible.name}
              </dd>
              <dt className="text-zinc-500">Cadastrado</dt>
              <dd
                className="truncate text-zinc-300"
                title={formatFullDate(lead.createdAt)}
              >
                {formatCreatedAt(lead.createdAt)}
              </dd>
            </dl>
          </li>
        );
      })}
    </ul>
  );
}

function LeadAvatar({ name }: { name: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-orange-500/20 bg-orange-500/10 font-semibold text-[11px] text-orange-300">
      {initialsOf(name)}
    </span>
  );
}

export default ListLeadsPage;
