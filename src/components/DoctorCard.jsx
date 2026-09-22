import PrimaryButton from "./PrimaryButton";

export default function DoctorCard({ doctor, onBook }) {
  return (
    <div
      className="rounded-[20px] p-[22px] mb-4"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
    >
      <div className="text-lg leading-6 font-semibold tracking-[-0.015em]" style={{ color: "var(--color-text-primary)" }}>
        {doctor.name}
      </div>
      <div className="mt-1 text-sm leading-5" style={{ color: "var(--color-text-secondary)" }}>
        {doctor.specialization ?? ""}
      </div>
      <div className="mt-2 text-[13px] leading-[18px]" style={{ color: "var(--color-text-faint)" }}>
        {doctor.clinic_name ?? ""} · ₹{doctor.consultation_fee ?? "—"}
      </div>
      <PrimaryButton shadow={false} onClick={() => onBook(doctor.id)} className="mt-[18px]">
        Book appointment
      </PrimaryButton>
    </div>
  );
}
