export default function IconButton({
  icon: Icon,
  onClick,
  label,
  size = 40,
  strokeColor = "#5F605B",
  filled = false,
  type = "button",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={label}
      className="flex-none flex items-center justify-center rounded-full cursor-pointer transition-colors duration-150"
      style={{
        width: size,
        height: size,
        background: filled ? "var(--color-ink)" : "transparent",
        border: filled ? "none" : "1px solid var(--color-border-icon)",
      }}
      onMouseEnter={(e) => {
        if (!filled) e.currentTarget.style.background = "var(--color-surface-subtle)";
      }}
      onMouseLeave={(e) => {
        if (!filled) e.currentTarget.style.background = "transparent";
      }}
    >
      <Icon
        size={size <= 36 ? 18 : 20}
        color={filled ? "#FFFFFF" : strokeColor}
        strokeWidth={1.75}
      />
    </button>
  );
}
