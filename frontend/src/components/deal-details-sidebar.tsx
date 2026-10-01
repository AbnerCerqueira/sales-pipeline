import type { CommentDTO, DealDTO } from "@sales/shared";
import { PencilIcon, SendHorizontalIcon } from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  useCommentsQuery,
  useCreateCommentMutation,
} from "../hooks/use-comments.ts";
import { useErrorToast } from "../hooks/use-error-toast.ts";
import { formatDealStatus } from "../lib/deal-options.ts";
import {
  formatCreatedAt,
  formatCurrency,
  formatExpectedCloseDate,
  formatFullDate,
} from "../lib/format.ts";
import { initialsOf } from "../lib/utils.ts";
import { DEAL_COLUMNS } from "../pages/deals/kanban/board-model.ts";
import { Button } from "./ui/button.tsx";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet.tsx";
import { Textarea } from "./ui/textarea.tsx";

interface DealDetailsSidebarProps {
  deal: DealDTO;
  onClose: () => void;
  onEdit: (deal: DealDTO) => void;
}

const NO_COMMENTS: CommentDTO[] = [];

function DealDetailsSidebar({
  deal,
  onClose,
  onEdit,
}: DealDetailsSidebarProps) {
  const [content, setContent] = useState("");
  const [threadEl, setThreadEl] = useState<HTMLDivElement | null>(null);
  const commentsQuery = useCommentsQuery(deal.id);
  const createComment = useCreateCommentMutation(deal.id);
  useErrorToast(commentsQuery);

  const comments = commentsQuery.data ?? NO_COMMENTS;
  const trimmed = content.trim();
  const canSubmit = trimmed !== "" && !createComment.isPending;
  const statusColumn = DEAL_COLUMNS.find(
    ({ status }) => status === deal.status
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      }
    },
    [onClose]
  );

  const handleEdit = useCallback(() => {
    onEdit(deal);
  }, [deal, onEdit]);

  const handleContentChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setContent(event.target.value);
    },
    []
  );

  const sendComment = useCallback(() => {
    if (!canSubmit) {
      return;
    }

    createComment.mutate(
      { content: trimmed, dealId: deal.id },
      { onSuccess: () => setContent("") }
    );
  }, [canSubmit, createComment, deal.id, trimmed]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      sendComment();
    },
    [sendComment]
  );

  const handleContentKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        sendComment();
      }
    },
    [sendComment]
  );

  const commentCount = comments.length;

  useEffect(() => {
    if (commentCount === 0 || !threadEl) {
      return;
    }
    threadEl.scrollTo({ top: threadEl.scrollHeight });
  }, [commentCount, threadEl]);

  let commentsBody: ReactNode;
  if (commentsQuery.isPending) {
    commentsBody = (
      <p className="mt-3 text-sm text-zinc-500">Carregando comentários...</p>
    );
  } else if (comments.length === 0) {
    commentsBody = (
      <p className="mt-3 text-sm text-zinc-500">
        Nenhum comentário ainda. Seja o primeiro a comentar.
      </p>
    );
  } else {
    commentsBody = (
      <ul className="mt-3 space-y-2">
        {comments.map((comment) => (
          <li
            className="rounded-lg border border-zinc-800/80 bg-zinc-900 p-3"
            key={comment.id}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-orange-500/20 bg-orange-500/10 font-semibold text-[9px] text-orange-300"
                >
                  {initialsOf(comment.seller.name)}
                </span>
                <span
                  className="truncate font-medium text-xs text-zinc-100"
                  title={comment.seller.email}
                >
                  {comment.seller.name}
                </span>
              </span>
              <time
                className="shrink-0 text-[11px] text-zinc-500"
                dateTime={comment.createdAt}
                title={formatFullDate(comment.createdAt)}
              >
                {formatCreatedAt(comment.createdAt)}
              </time>
            </div>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-zinc-300">
              {comment.content}
            </p>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <Sheet onOpenChange={handleOpenChange} open>
      <SheetContent className="w-full gap-0 overflow-hidden p-0 data-[side=right]:sm:max-w-xl">
        <SheetHeader className="shrink-0 border-zinc-800/60 border-b px-5 py-4 pr-12">
          <SheetTitle
            className="truncate font-semibold text-white"
            title={deal.title}
          >
            {deal.title}
          </SheetTitle>
          <SheetDescription
            className="truncate text-zinc-400"
            title={`${deal.lead.companyName} — ${deal.lead.fullName}`}
          >
            {deal.lead.companyName} — {deal.lead.fullName}
          </SheetDescription>
        </SheetHeader>

        <section className="shrink-0 border-zinc-800/60 border-b px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm text-zinc-300">
              <span
                aria-hidden
                className={`h-2 w-2 shrink-0 rounded-full ${statusColumn?.dot ?? "bg-zinc-400"}`}
              />
              {formatDealStatus(deal.status)}
            </span>
            <Button
              onClick={handleEdit}
              size="sm"
              type="button"
              variant="secondary"
            >
              <PencilIcon aria-hidden />
              Editar
            </Button>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <dt className="text-xs text-zinc-500">Valor</dt>
              <dd className="font-semibold text-orange-300">
                {formatCurrency(deal.value)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Responsável</dt>
              <dd className="text-zinc-200" title={deal.responsible.email}>
                {deal.responsible.name}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Fechamento previsto</dt>
              <dd className="text-zinc-200">
                {deal.expectedCloseDate
                  ? formatExpectedCloseDate(deal.expectedCloseDate)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Criado</dt>
              <dd
                className="text-zinc-200"
                title={formatFullDate(deal.createdAt)}
              >
                {formatCreatedAt(deal.createdAt)}
              </dd>
            </div>
            {deal.description ? (
              <div className="col-span-2">
                <dt className="text-xs text-zinc-500">Descrição</dt>
                <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-zinc-300">
                  {deal.description}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <div className="min-h-0 flex-1 overflow-y-auto" ref={setThreadEl}>
          <section className="px-5 py-4">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-medium text-sm text-zinc-100">Comentários</h3>
              {commentsQuery.isPending ? null : (
                <span className="text-[11px] text-zinc-500">
                  {comments.length === 1
                    ? "1 comentário"
                    : `${comments.length} comentários`}
                </span>
              )}
            </div>

            {commentsBody}
          </section>
        </div>

        <form
          className="shrink-0 border-zinc-800/60 border-t bg-zinc-950/60 px-5 py-4"
          onSubmit={handleSubmit}
        >
          <Textarea
            aria-label="Novo comentário"
            maxLength={2000}
            onChange={handleContentChange}
            onKeyDown={handleContentKeyDown}
            placeholder="Escreva um comentário... (Ctrl+Enter para enviar)"
            rows={2}
            value={content}
          />
          <div className="mt-2 flex justify-end">
            <Button
              disabled={!canSubmit}
              loading={createComment.isPending}
              type="submit"
            >
              <SendHorizontalIcon aria-hidden />
              Comentar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export { DealDetailsSidebar };
