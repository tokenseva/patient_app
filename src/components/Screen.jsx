export default function Screen({ header, footer, children, overlay, bg = "var(--color-bg)", bodyPadding = "16px 20px 132px" }) {
  return (
    <div className="relative flex flex-col" style={{ height: "100dvh", background: bg }}>
      {header}
      <div
        className="flex-1 min-h-0 overflow-y-auto box-border"
        style={{ padding: footer ? bodyPadding : bodyPadding.replace(/\d+px$/, "24px") }}
      >
        <div className="w-full mx-auto flex flex-col" style={{ maxWidth: 430 }}>
          {children}
        </div>
      </div>
      {footer}
      {overlay}
    </div>
  );
}
