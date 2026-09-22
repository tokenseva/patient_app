export default function UnderlineTabs({ tabs, active, onChange }) {
  return (
    <div className="flex items-stretch" style={{ borderBottom: "1px solid #EFEFEF" }}>
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className="flex-1 pb-2.5 font-sans text-[14.5px] cursor-pointer bg-transparent border-none"
            style={{
              fontWeight: isActive ? 600 : 400,
              color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
              boxShadow: isActive ? "inset 0 -2px 0 var(--color-ink)" : "none",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
