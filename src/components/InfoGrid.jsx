export default function InfoGrid({ items }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="text-xs leading-4" style={{ color: "var(--color-text-muted)" }}>
            {item.label}
          </div>
          <div className="mt-0.5 text-sm leading-5 font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
