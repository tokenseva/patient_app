export default function DoctorRow({ doctor, size = 44 }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex-none flex items-center justify-center rounded-full font-semibold"
        style={{
          width: size,
          height: size,
          background: "var(--color-surface-subtle)",
          color: "var(--color-text-primary)",
          fontSize: size >= 44 ? 14 : 12,
        }}
      >
        {doctor.initials}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-base leading-[22px] font-semibold tracking-[-0.01em] truncate" style={{ color: "var(--color-text-primary)" }}>
          {doctor.name}
        </span>
        <span className="text-[13px] leading-[18px]" style={{ color: "var(--color-text-secondary)" }}>
          {doctor.specialty}
        </span>
      </div>
    </div>
  );
}
