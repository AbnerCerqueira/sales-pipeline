import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
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
import { formatDate, formatLeadSource } from "../../lib/lead-options.ts";

const PAGE_SIZE = 10;

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

  let tableBody: ReactNode;
  if (leadsQuery.isPending) {
    tableBody = (
      <tr>
        <td
          className="px-5 py-12 text-center text-zinc-500"
          colSpan={TABLE_HEADERS.length}
        >
          Carregando leads...
        </td>
      </tr>
    );
  } else if (leads.length === 0) {
    tableBody = (
      <tr>
        <td
          className="px-5 py-12 text-center text-zinc-500"
          colSpan={TABLE_HEADERS.length}
        >
          Nenhum lead encontrado
        </td>
      </tr>
    );
  } else {
    tableBody = leads.map((lead) => (
      <tr
        className="border-zinc-800/60 border-b transition-colors last:border-b-0 hover:bg-zinc-800/40"
        key={lead.id}
      >
        <td className="px-5 py-4 font-medium text-white">
          <Highlight query={search} text={lead.fullName} />
        </td>
        <td className="px-5 py-4 text-zinc-300">{lead.companyName}</td>
        <td className="px-5 py-4 text-zinc-400">{lead.email}</td>
        <td className="px-5 py-4 text-zinc-400">{lead.whatsapp}</td>
        <td className="px-5 py-4 text-zinc-300">{lead.responsible.name}</td>
        <td className="px-5 py-4">
          <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 font-medium text-xs text-zinc-300">
            {formatLeadSource(lead.source)}
          </span>
        </td>
        <td className="whitespace-nowrap px-5 py-4 text-zinc-400">
          {formatDate(lead.createdAt)}
        </td>
      </tr>
    ));
  }

  return (
    <AppShell>
      <header className="border-zinc-800/60 border-b bg-black px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="font-bold text-2xl text-white tracking-tight">
            Lista de Leads
          </h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-500"
                size={16}
              />
              <Input
                aria-label="Buscar lead por nome"
                className="w-full pl-9 md:w-64"
                onChange={handleSearchChange}
                placeholder="Buscar nome..."
                type="search"
                value={search}
              />
            </div>
            <Button onClick={openModal} type="button">
              <Plus size={16} />
              Novo Lead
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 md:px-8">
        <div className="flex items-center justify-between gap-3">
          <Select
            aria-label="Filtrar por vendedor responsável"
            className="w-48"
            onChange={handleResponsibleChange}
            value={responsibleId}
          >
            <option value="">Vendedor: Todos</option>
            {sellersQuery.data?.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.name}
              </option>
            ))}
          </Select>
          <span className="text-sm text-zinc-500">
            {total} {total === 1 ? "lead encontrado" : "leads encontrados"}
          </span>
        </div>

        <div
          className={`mt-4 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 transition-opacity ${
            leadsQuery.isFetching && !leadsQuery.isPending
              ? "opacity-60"
              : "opacity-100"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-zinc-800 border-b">
                  {TABLE_HEADERS.map((header) => (
                    <th
                      className="px-5 py-4 font-semibold text-white"
                      key={header}
                      scope="col"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>{tableBody}</tbody>
            </table>
          </div>

          {leads.length > 0 ? (
            <div className="flex items-center justify-between border-zinc-800 border-t px-5 py-3">
              <span className="text-sm text-zinc-500">
                Página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  aria-label="Página anterior"
                  disabled={page <= 1}
                  onClick={goToPreviousPage}
                  type="button"
                  variant="secondary"
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  aria-label="Próxima página"
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
