export default function TokenBlock({ label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span
        className="text-xs font-semibold uppercase"
        style={{ letterSpacing: "0.06em", color: "var(--color-text-muted)" }}
      >
        {label}
      </span>
      <span className="text-[48px] leading-[54px] font-semibold" style={{ letterSpacing: "-0.02em", color: "var(--color-text-primary)" }}>
        {value}
      </span>
    </div>
  );
}
