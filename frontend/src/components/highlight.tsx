interface HighlightProps {
  query: string;
  text: string;
}

const REGEX_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

function Highlight({ query, text }: HighlightProps) {
  const match = query.trim();

  if (!match) {
    return text;
  }

  const escaped = match.replace(REGEX_SPECIAL_CHARS, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));

  return parts.map((part, index) =>
    part.toLowerCase() === match.toLowerCase() ? (
      <mark
        className="rounded-xs bg-orange-500/25 px-0.5 text-orange-300"
        // biome-ignore lint/suspicious/noArrayIndexKey: split parts are positional by definition
        key={index}
      >
        {part}
      </mark>
    ) : (
      <span
        // biome-ignore lint/suspicious/noArrayIndexKey: split parts are positional by definition
        key={index}
      >
        {part}
      </span>
    )
  );
}

export default Highlight;
