export function HighlightedTerm({ text, term }: { text: string; term: string }) {
  const parts = text.split(term);

  return parts.map((part, index) => (
    <span key={index}>
      {index > 0 && <mark>{term}</mark>}
      {part}
    </span>
  ));
}
