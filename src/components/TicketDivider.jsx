export default function TicketDivider({ lineColor = "#EFEFEF", notchColor = "#FFFFFF" }) {
  return (
    <div style={{ position: "relative", height: 1, borderTop: `1.5px dashed ${lineColor}` }}>
      <span
        style={{
          position: "absolute",
          left: -9,
          top: -9,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: notchColor,
        }}
      />
      <span
        style={{
          position: "absolute",
          right: -9,
          top: -9,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: notchColor,
        }}
      />
    </div>
  );
}
