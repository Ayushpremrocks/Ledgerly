/**
 * Ranked horizontal bars (spending by category, top payees). One series, so one
 * color and no legend; each row is named and valued in text, so nothing relies on color.
 */
export default function BarList({ items, format }) {
  const max = Math.max(...items.map((i) => Number(i.value)), 0) || 1;
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.key}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-ink">
              {item.label}
              {item.sub && <span className="ml-2 text-xs text-faint">{item.sub}</span>}
            </span>
            <span className="tabular shrink-0 font-medium text-ink">{format(item.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-subtle">
            <div
              className="h-2 rounded-full bg-accent"
              style={{ width: `${Math.max(2, (Number(item.value) / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
