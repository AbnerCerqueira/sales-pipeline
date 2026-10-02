import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DealDTO } from "@sales/shared";
import { CalendarClock, CalendarDays, GripVertical } from "lucide-react";
import type { KeyboardEvent } from "react";
import { memo, useCallback } from "react";
import {
  formatCreatedAt,
  formatCurrency,
  formatExpectedCloseDate,
  formatFullDate,
} from "../../../lib/format.ts";
import { initialsOf } from "../../../lib/utils.ts";

/** Casca visual do card. Compartilhada com o slot para os dois terem a mesma altura. */
export const CARD_SHELL =
  "rounded-xl border border-zinc-800/80 bg-zinc-900 p-3 shadow-sm";

export const DealCard = memo(function MemoDealCard({
  deal,
  disabled,
  onSelect,
  position,
}: {
  deal: DealDTO;
  disabled: boolean;
  onSelect: (deal: DealDTO) => void;
  position: number;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    animateLayoutChanges: () => false,
    data: { dealId: deal.id, status: deal.status },
    disabled,
    id: deal.id,
  });

  // Clique não vira drag: o sensor só ativa após 6px e o dnd-kit suprime o click de um arrasto real.
  const handleCardClick = useCallback(() => {
    onSelect(deal);
  }, [deal, onSelect]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect(deal);
      }
    },
    [deal, onSelect]
  );

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: role/tabIndex/foco vêm de {...attributes} do useSortable; Enter/Espaço tratados em onKeyDown
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: ver comentário acima — o linter não enxerga o role injetado pelo spread
    <div
      className={`group ${CARD_SHELL} transition-colors hover:border-zinc-700/80 focus-visible:outline-2 focus-visible:outline-orange-500/70 focus-visible:outline-offset-2 md:cursor-grab md:active:cursor-grabbing ${
        // Invisible: o overlay é a cópia visível. O nó fica no lugar só para
        // reservar o espaço, e é nele que o dropAnimation do overlay pousa.
        isDragging ? "opacity-0" : ""
      }`}
      data-deal-id={deal.id}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      <DealCardView deal={deal} position={position} />
    </div>
  );
});

/**
 * Sem hooks do dnd-kit: o DragOverlay não pode reenderizar useSortable (colisão
 * de id). E memoizada, porque é o que segura o custo real do arrasto.
 *
 * O `React.memo` do `DealCard` não ajuda aqui: o `useSortable` lê contexto, e
 * contexto passa por cima do memo — medido, o card re-renderiza ~90 vezes por
 * mousemove. Como o corpo do card depende só de `deal` e `position`, e os dois
 * são estáveis enquanto o card não muda de lugar, o memo aqui corta a subárvore
 * inteira (15 elementos, 3 ícones, 4 formatações de data e moeda) fora do
 * caminho crítico do arrasto.
 */
export const DealCardView = memo(function MemoDealCardView({
  deal,
  position,
}: {
  deal: DealDTO;
  position?: number;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 flex-1 items-start gap-1.5">
          {/* O overlay do arrasto não passa posição: durante o drag ela já está obsoleta. */}
          {position === undefined ? null : (
            <span className="mt-0.5 shrink-0 text-[10px] text-zinc-400 tabular-nums">
              {position}º
            </span>
          )}
          <span
            className="line-clamp-2 font-medium text-sm text-zinc-100"
            title={deal.title}
          >
            {deal.title}
          </span>
        </span>
        <GripVertical
          aria-hidden
          className="mt-0.5 hidden shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-400 md:block"
          size={14}
        />
      </div>
      <p
        className="mt-1 truncate text-xs text-zinc-400"
        title={deal.lead.companyName}
      >
        {deal.lead.companyName}
      </p>
      <p className="truncate text-xs text-zinc-400">{deal.lead.fullName}</p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="truncate font-semibold text-orange-300 text-sm">
          {formatCurrency(deal.value)}
        </span>
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-orange-500/20 bg-orange-500/10 font-semibold text-[9px] text-orange-300"
          title={`Responsável: ${deal.responsible.name}`}
        >
          {initialsOf(deal.responsible.name)}
        </span>
      </div>

      <p
        className="mt-2 flex items-center gap-1 whitespace-nowrap text-[11px] text-zinc-400"
        title={`Criado em ${formatFullDate(deal.createdAt)}`}
      >
        <CalendarDays aria-hidden size={11} />
        Criado {formatCreatedAt(deal.createdAt)}
      </p>
      {/* Sempre presente (com "—" quando falta data) para todos os cards
          terem a mesma altura, independente do conteúdo. */}
      <p
        className="mt-1 flex items-center gap-1 whitespace-nowrap text-[11px] text-zinc-400"
        title={
          deal.expectedCloseDate
            ? `Fechamento previsto em ${formatExpectedCloseDate(deal.expectedCloseDate)}`
            : "Sem data de fechamento prevista"
        }
      >
        <CalendarClock aria-hidden size={11} />
        {deal.expectedCloseDate
          ? `Prev. ${formatExpectedCloseDate(deal.expectedCloseDate)}`
          : "Prev. —"}
      </p>
    </>
  );
});
