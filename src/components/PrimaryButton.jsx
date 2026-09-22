export default function PrimaryButton({
  children,
  onClick,
  shadow = true,
  disabled = false,
  type = "button",
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-center px-5 rounded-[24px] font-semibold text-[15px] leading-5 tracking-[-0.005em] transition-colors duration-150 ${className}`}
      style={{
        minHeight: 52,
        color: "var(--color-ink)",
        background: disabled ? "#EFF2C9" : "var(--color-lime)",
        border: "none",
        boxShadow: shadow && !disabled ? "0 4px 16px rgba(36, 37, 34, 0.28)" : "none",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.background = "var(--color-lime-pressed)";
      }}
      onMouseUp={(e) => {
        if (!disabled) e.currentTarget.style.background = "var(--color-lime)";
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = "var(--color-lime)";
      }}
    >
      {children}
    </button>
  );
}
