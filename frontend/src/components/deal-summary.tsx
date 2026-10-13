import {
  CheckIcon,
  Loader2Icon,
  MessageSquarePlusIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import { type ReactNode, useCallback, useState } from "react";
import { useCreateCommentMutation } from "../hooks/use-comments.ts";
import { useDealSummaryMutation } from "../hooks/use-deal-summary.ts";
import {
  SummaryMarkdown,
  summaryToPlainText,
} from "../lib/summary-markdown.tsx";
import { Button } from "./ui/button.tsx";

interface DealSummaryProps {
  commentCount: number;
  dealId: string;
}

// Bloco fixo no rodapé da sidebar: o botão nunca some para baixo da rolagem,
// mesmo em threads longas. O card abre acima dele, com rolagem própria.
function DealSummary({ commentCount, dealId }: DealSummaryProps) {
  const summary = useDealSummaryMutation(dealId);
  const addToComments = useCreateCommentMutation(dealId);
  const summaryText = summary.data?.summary ?? null;
  // Texto exato já publicado na thread: dois cliques não geram dois comentários.
  const [postedSummary, setPostedSummary] = useState<string | null>(null);
  const alreadyPosted = summaryText !== null && postedSummary === summaryText;
  // Quantidade de comentários no clique que gerou o resumo atual: se chegou
  // comentário depois, o card avisa que está desatualizado.
  const [generatedForCount, setGeneratedForCount] = useState<number | null>(
    null
  );
  const newCommentsCount =
    generatedForCount === null ? 0 : commentCount - generatedForCount;

  const handleSummarize = useCallback(() => {
    setGeneratedForCount(commentCount);
    summary.mutate();
  }, [commentCount, summary]);

  const handleDismissSummary = useCallback(() => {
    summary.reset();
  }, [summary]);

  const handleAddToComments = useCallback(() => {
    if (!summaryText || addToComments.isPending) {
      return;
    }
    if (postedSummary === summaryText) {
      return;
    }
    addToComments.mutate(
      {
        content: `Resumo da IA:\n${summaryToPlainText(summaryText)}`,
        dealId,
      },
      { onSuccess: () => setPostedSummary(summaryText) }
    );
  }, [addToComments, dealId, postedSummary, summaryText]);

  let actionLabel = "Resumir com IA";
  if (summary.isPending) {
    actionLabel = "Resumindo...";
  } else if (summary.data) {
    actionLabel = "Atualizar resumo";
  }

  // Sem ramo de erro aqui de propósito: falha vai só no toast (via hook) para
  // não poluir a interface — a nova tentativa é o próprio botão principal.
  let summaryBody: ReactNode = null;
  if (summary.isPending) {
    summaryBody = (
      <div
        aria-busy="true"
        aria-live="polite"
        className="rounded-lg border border-orange-500/25 bg-orange-500/[0.07] p-3"
        role="status"
      >
        <p className="flex items-center gap-2 font-medium text-orange-200 text-xs">
          <Loader2Icon aria-hidden className="animate-spin" size={14} />
          Gerando resumo com IA...
        </p>
        <div aria-hidden className="mt-2.5 space-y-1.5">
          <div className="h-2.5 animate-pulse rounded bg-orange-200/15" />
          <div className="h-2.5 w-11/12 animate-pulse rounded bg-orange-200/15" />
          <div className="h-2.5 w-4/6 animate-pulse rounded bg-orange-200/15" />
        </div>
        <p className="mt-2 text-[11px] text-zinc-500">
          Isso pode levar alguns segundos.
        </p>
      </div>
    );
  } else if (summary.data) {
    summaryBody = (
      <div
        aria-live="polite"
        className="rounded-lg border border-orange-500/25 bg-gradient-to-b from-orange-500/15 to-orange-500/[0.04] p-3"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 font-semibold text-orange-200 text-xs">
            <SparklesIcon aria-hidden size={14} />
            Resumo da IA
          </p>
          <Button
            aria-label="Dispensar resumo"
            className="text-zinc-400 hover:text-zinc-100"
            onClick={handleDismissSummary}
            size="icon-xs"
            title="Dispensar resumo"
            type="button"
            variant="ghost"
          >
            <XIcon aria-hidden />
          </Button>
        </div>
        {newCommentsCount > 0 ? (
          <p className="mt-1.5 text-[11px] text-amber-200/80">
            {newCommentsCount === 1
              ? "1 comentário novo desde este resumo."
              : `${newCommentsCount} comentários novos desde este resumo.`}
          </p>
        ) : null}
        <div className="mt-2 break-words text-sm text-zinc-200 leading-relaxed">
          <SummaryMarkdown text={summary.data.summary} />
        </div>
        <p className="mt-2 text-[11px] text-zinc-500">
          Gerado por IA — pode conter imprecisões.
        </p>
        <Button
          className="mt-3 w-full"
          disabled={alreadyPosted}
          loading={addToComments.isPending}
          onClick={handleAddToComments}
          size="sm"
          title={
            alreadyPosted
              ? "Este resumo já está nos comentários"
              : "Publicar este resumo como um comentário na thread"
          }
          type="button"
          variant="secondary"
        >
          {alreadyPosted ? (
            <CheckIcon aria-hidden />
          ) : (
            <MessageSquarePlusIcon aria-hidden />
          )}
          {alreadyPosted
            ? "Adicionado aos comentários"
            : "Adicionar aos comentários"}
        </Button>
      </div>
    );
  }

  return (
    <>
      {summaryBody ? (
        <div className="max-h-96 overflow-y-auto border-zinc-800/60 border-b px-5 py-3">
          {summaryBody}
        </div>
      ) : null}

      <div className="px-5 pt-3">
        <Button
          className="w-full border-orange-500/25 bg-orange-500/10 text-orange-200 hover:bg-orange-500/20 hover:text-orange-100"
          loading={summary.isPending}
          onClick={handleSummarize}
          size="sm"
          title="Gerar resumo do negócio com IA a partir dos comentários"
          type="button"
          variant="outline"
        >
          {summary.isPending ? null : <SparklesIcon aria-hidden />}
          {actionLabel}
        </Button>
      </div>
    </>
  );
}

export { DealSummary };
