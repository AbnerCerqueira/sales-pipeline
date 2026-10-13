import { Fragment, type ReactNode } from "react";

const ORDERED_ITEM_PATTERN = /^\d+\.\s+(.*)$/;

// A IA responde em markdown simples (itens `- ` com `**negrito**` nos rótulos).
// Render mínimo e seguro — sem dependência nova — para não exibir a sintaxe crua.
// Listas numeradas (`1. `) caem nos mesmos bullets: o número não carrega significado aqui.
function renderInline(text: string, keyPrefix: string): ReactNode {
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  return segments.map((segment, index) => {
    const key = `${keyPrefix}-${index}`;
    if (
      segment.startsWith("**") &&
      segment.endsWith("**") &&
      segment.length > 4
    ) {
      return (
        <strong className="font-semibold text-zinc-100" key={key}>
          {segment.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={key}>{segment}</Fragment>;
  });
}

// Versão em texto puro para postar o resumo como comentário: a thread não
// renderiza markdown, então as marcas de negrito sairiam cruas por lá também.
function summaryToPlainText(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/\*\*/g, "").trimEnd())
    .join("\n")
    .trim();
}

function SummaryMarkdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }
    const items = listItems;
    listItems = [];
    blocks.push(
      <ul className="list-disc space-y-1 pl-5" key={`list-${blocks.length}`}>
        {items.map((item, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: resposta estática da IA, ordem nunca muda.
          <li key={`item-${index}`}>{renderInline(item, `item-${index}`)}</li>
        ))}
      </ul>
    );
  };

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    const orderedItem = trimmed.match(ORDERED_ITEM_PATTERN)?.[1]?.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      listItems.push(trimmed.slice(2).trim());
    } else if (orderedItem) {
      listItems.push(orderedItem);
    } else if (trimmed === "") {
      flushList();
    } else {
      flushList();
      blocks.push(
        <p key={`paragraph-${blocks.length}`}>
          {renderInline(trimmed, `paragraph-${blocks.length}`)}
        </p>
      );
    }
  }
  flushList();

  return <div className="space-y-1.5">{blocks}</div>;
}

export { SummaryMarkdown, summaryToPlainText };
