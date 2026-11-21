import { useEffect, useRef, useState } from "react";
import { Table2, ChartColumn } from "lucide-react";

/*
 * Column chart for 1-2 series (money in / money out, daily volume).
 * Follows the dataviz rules: one y-axis, bars <= 24px with a 4px rounded top and a
 * square base, a 2px gap between neighbouring bars, recessive gridlines, a legend
 * whenever there are 2+ series, a hover/focus tooltip, and a table view.
 *
 * Series colors are CSS variables (--series-in / --series-out / --accent). The in/out
 * pair was checked with the palette validator in light and dark mode
 * (light #15803d/#6250d6, dark #22a559/#9085e9: all checks pass, CVD dE >= 20).
 */

function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

function niceStep(raw) {
  if (raw <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * pow >= raw) return m * pow;
  return 10 * pow;
}

/** Rounded data-end (top), square at the baseline. */
function barPath(x, y, w, h) {
  if (h <= 0) return "";
  const r = Math.min(4, h, w / 2);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export default function BarChart({
  data, // [{ key, label, fullLabel, values: { [seriesKey]: number } }]
  series, // [{ key, label, color }]
  format, // full value formatter for tooltip/table
  axisFormat, // short formatter for the y-axis
  height = 240,
  title, // accessible name
  extra, // optional (d) => [{label, value}] extra tooltip rows
}) {
  const [ref, width] = useWidth();
  const [active, setActive] = useState(null);
  const [showTable, setShowTable] = useState(false);

  const pad = { top: 12, right: 4, bottom: 28, left: width < 420 ? 44 : 56 };
  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;

  const maxValue = Math.max(0, ...data.flatMap((d) => series.map((s) => Number(d.values[s.key] || 0))));
  const step = niceStep(maxValue / 4 || 1);
  const top = step * 4;
  const ticks = [0, 1, 2, 3, 4].map((i) => i * step);
  const y = (v) => pad.top + innerH - (v / top) * innerH;

  const band = data.length ? innerW / data.length : 0;
  const gap = 2;
  const n = series.length;
  const barW = Math.max(4, Math.min(24, (band * 0.62 - gap * (n - 1)) / n));
  const groupW = barW * n + gap * (n - 1);
  // On narrow screens label every 2nd/3rd column (counting back from the latest) so labels never collide.
  const labelEvery = Math.max(1, Math.ceil(32 / (band || 1)));
  const showLabel = (i) => (data.length - 1 - i) % labelEvery === 0;

  const activeDatum = active != null ? data[active] : null;
  const tipLeft = active != null ? Math.min(Math.max(pad.left + band * active + band / 2, 90), Math.max(width - 90, 90)) : 0;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        {n > 1 ? (
          <ul className="flex flex-wrap items-center gap-4 text-xs text-muted" aria-label="Legend">
            {series.map((s) => (
              <li key={s.key} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
                {s.label}
              </li>
            ))}
          </ul>
        ) : (
          <span />
        )}
        <button
          onClick={() => setShowTable((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-muted pointer-coarse:py-2 hover:bg-subtle hover:text-ink"
        >
          {showTable ? <ChartColumn className="size-3.5" /> : <Table2 className="size-3.5" />}
          {showTable ? "Chart" : "Table"}
        </button>
      </div>

      {showTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="py-2 font-medium">Period</th>
                {series.map((s) => (
                  <th key={s.key} className="py-2 text-right font-medium">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular">
              {data.map((d) => (
                <tr key={d.key} className="border-b border-line last:border-0">
                  <td className="py-2 text-ink">{d.fullLabel || d.label}</td>
                  {series.map((s) => (
                    <td key={s.key} className="py-2 text-right text-ink">
                      {format(d.values[s.key] || 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={ref} className="relative" style={{ height }} onMouseLeave={() => setActive(null)}>
          {width > 0 && (
            <svg width={width} height={height} role="img" aria-label={title} className="block overflow-visible">
              {/* gridlines + y labels */}
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
                  <text x={pad.left - 10} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--faint)" className="tabular">
                    {axisFormat(t)}
                  </text>
                </g>
              ))}

              {data.map((d, i) => {
                const gx = pad.left + band * i + (band - groupW) / 2;
                return (
                  <g key={d.key}>
                    {active === i && (
                      <rect x={pad.left + band * i + 2} y={pad.top} width={band - 4} height={innerH} rx="6" fill="var(--subtle)" />
                    )}
                    {series.map((s, si) => {
                      const v = Number(d.values[s.key] || 0);
                      const h = (v / top) * innerH;
                      return <path key={s.key} d={barPath(gx + si * (barW + gap), y(v), barW, h)} fill={s.color} />;
                    })}
                    {showLabel(i) && (
                      <text x={pad.left + band * i + band / 2} y={height - 8} textAnchor="middle" fontSize="11" fill="var(--faint)">
                        {d.label}
                      </text>
                    )}
                    {/* hit target: the whole column band, bigger than the bars */}
                    <rect
                      x={pad.left + band * i}
                      y={pad.top}
                      width={band}
                      height={innerH}
                      fill="transparent"
                      tabIndex={0}
                      aria-label={`${d.fullLabel || d.label}: ${series.map((s) => `${s.label} ${format(d.values[s.key] || 0)}`).join(", ")}`}
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      onBlur={() => setActive(null)}
                      style={{ outline: "none" }}
                    />
                  </g>
                );
              })}
            </svg>
          )}

          {activeDatum && (
            <div
              className="pointer-events-none absolute top-0 z-10 min-w-44 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg shadow-black/5"
              style={{ left: tipLeft }}
            >
              <p className="mb-1 font-medium text-ink">{activeDatum.fullLabel || activeDatum.label}</p>
              {series.map((s) => (
                <p key={s.key} className="flex items-center justify-between gap-4 text-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-sm" style={{ background: s.color }} />
                    {s.label}
                  </span>
                  <span className="tabular font-medium text-ink">{format(activeDatum.values[s.key] || 0)}</span>
                </p>
              ))}
              {extra?.(activeDatum).map((row) => (
                <p key={row.label} className="flex items-center justify-between gap-4 text-muted">
                  <span>{row.label}</span>
                  <span className="tabular font-medium text-ink">{row.value}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
