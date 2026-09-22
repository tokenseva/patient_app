export default function Collapse({ open, children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: "grid-template-rows 260ms ease-out",
      }}
    >
      <div style={{ overflow: "hidden" }}>{children}</div>
    </div>
  );
}
