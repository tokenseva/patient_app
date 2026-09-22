export default function EmptyState({ icon: Icon, title, description, dashed = true }) {
  return (
    <div
      className="flex flex-col items-center gap-2.5 text-center rounded-[20px]"
      style={{
        padding: dashed ? "32px 20px" : "32px 4px",
        background: dashed ? "var(--color-surface)" : "transparent",
        border: dashed ? "1px dashed var(--color-border)" : "none",
      }}
    >
      {Icon && <Icon size={28} strokeWidth={1.6} color="var(--color-text-faint)" />}
      <span className="text-[15px] leading-5 font-semibold tracking-[-0.005em]" style={{ color: "var(--color-text-primary)" }}>
        {title}
      </span>
      {description && (
        <span
          className="text-[13px] leading-[18px]"
          style={{ color: "var(--color-text-faint)", maxWidth: 260, textWrap: "pretty" }}
        >
          {description}
        </span>
      )}
    </div>
  );
}
