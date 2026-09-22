export default function SelectableTile({ selected, onClick, children, disabled = false, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center rounded-2xl transition-colors duration-150 cursor-pointer ${className}`}
      style={{
        background: disabled ? "#F5F5F5" : selected ? "var(--color-ink)" : "var(--color-surface-subtle)",
        color: disabled ? "var(--color-text-faint)" : selected ? "#FFFFFF" : "var(--color-text-primary)",
        border: "1px solid transparent",
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}
