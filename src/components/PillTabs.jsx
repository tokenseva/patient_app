export default function PillTabs({ tabs, active, onChange }) {
  return (
    <div
      className="flex items-center gap-1 p-1 rounded-2xl"
      style={{ background: "var(--color-surface-subtle)" }}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className="flex-1 rounded-xl font-semibold text-[14px] leading-5 cursor-pointer border-none transition-colors duration-150"
            style={{
              minHeight: 40,
              background: isActive ? "var(--color-surface)" : "transparent",
              color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
              boxShadow: isActive ? "0 1px 4px rgba(36,37,34,0.08)" : "none",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
