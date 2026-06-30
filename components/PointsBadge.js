/**
 * Visible points badge for completed matches: 0, +10, or +25
 * @param {{ points: number, className?: string }} props
 */
export default function PointsBadge({ points, className = "" }) {
  const value = points ?? 0;

  const styles =
    value === 25
      ? "bg-amber-500/20 text-amber-300 ring-amber-500/40"
      : value === 10
        ? "bg-emerald-500/20 text-emerald-300 ring-emerald-500/40"
        : "bg-zinc-700/60 text-zinc-400 ring-zinc-600";

  const label = value === 25 ? "+25" : value === 10 ? "+10" : "0";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${styles} ${className}`}
      title={
        value === 25
          ? "Exact score!"
          : value === 10
            ? "Correct outcome"
            : "Incorrect outcome"
      }
    >
      {label}
    </span>
  );
}
