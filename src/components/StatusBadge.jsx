const TONES = {
  upcoming: { fg: "var(--color-status-upcoming)", bg: "var(--color-status-upcoming-bg)" },
  completed: { fg: "var(--color-status-completed)", bg: "var(--color-status-completed-bg)" },
  cancelled: { fg: "var(--color-status-cancelled)", bg: "var(--color-status-cancelled-bg)" },
  pending: { fg: "var(--color-status-pending)", bg: "var(--color-status-pending-bg)" },
};

export default function StatusBadge({ status, label }) {
  const tone = TONES[status] || TONES.pending;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-4"
      style={{ color: tone.fg, background: tone.bg }}
    >
      {label}
    </span>
  );
}
