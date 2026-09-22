import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { useApp } from "../context/AppContext";
import Screen from "../components/Screen";
import ScreenHeader from "../components/ScreenHeader";
import CtaFooter from "../components/CtaFooter";
import PrimaryButton from "../components/PrimaryButton";
import UnderlineTabs from "../components/UnderlineTabs";
import EmptyState from "../components/EmptyState";

const TABS = [
  { value: "about", label: "About" },
  { value: "avail", label: "Availability" },
  { value: "rev", label: "Reviews" },
];

// Real working_hours.day_of_week is a Postgres extract(dow) int, 0=Sunday...6=Saturday —
// not a weekday-name string, so it's mapped to a label here rather than displayed directly.
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Postgres `time` columns come back as "HH:MM:SS" — reformatted to a friendlier "h:mm am/pm"
// for display, matching the rest of the app's time formatting.
function formatTime12h(time) {
  if (!time) return "";
  const [hStr, mStr] = time.split(":");
  let hour = parseInt(hStr, 10);
  const period = hour >= 12 ? "pm" : "am";
  hour = hour % 12 || 12;
  return `${hour}:${mStr} ${period}`;
}

export default function DoctorDetailPage() {
  const { doctorId } = useParams();
  const { getDoctorById, workingHours, workingHoursLoading } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState("about");

  const doctor = getDoctorById(doctorId);
  if (!doctor) {
    return (
      <Screen header={<ScreenHeader onBack={() => navigate(-1)} title="Doctor profile" />}>
        <div className="text-center text-sm py-10" style={{ color: "var(--color-text-muted)" }}>
          Doctor not found.
        </div>
      </Screen>
    );
  }

  const doctorHours = workingHours.filter((w) => w.doctor_id === doctor.id);
  const weekRows = DAY_NAMES.map((label, dow) => {
    const row = doctorHours.find((w) => w.day_of_week === dow);
    return row
      ? { label, hours: `${formatTime12h(row.start_time)} – ${formatTime12h(row.end_time)}`, closed: false }
      : { label, hours: "Closed", closed: true };
  });

  return (
    <Screen
      bg="var(--color-surface)"
      header={
        <ScreenHeader
          onBack={() => navigate(-1)}
          title="Doctor profile"
          onAccount={() => navigate("/profile")}
        />
      }
      footer={
        <CtaFooter>
          <PrimaryButton onClick={() => navigate(`/book/${doctor.id}`)}>Book appointment</PrimaryButton>
        </CtaFooter>
      }
      bodyPadding="24px 20px 132px"
    >
      <div className="flex flex-col items-center gap-3.5" style={{ padding: "8px 0 24px" }}>
        <div
          className="flex items-center justify-center rounded-full font-semibold"
          style={{ width: 88, height: 88, background: "var(--color-surface-subtle)", fontSize: 26, letterSpacing: "-0.02em", color: "var(--color-text-primary)" }}
        >
          {doctor.initials}
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="text-[22px] leading-7 font-semibold text-center" style={{ letterSpacing: "-0.02em", color: "var(--color-text-primary)" }}>
            {doctor.name}
          </div>
          <div className="text-sm leading-5 font-medium text-center" style={{ color: "var(--color-text-primary)" }}>
            {doctor.specialization ?? ""}
          </div>
          <div className="text-[13px] leading-[18px] text-center" style={{ color: "var(--color-text-muted)" }}>
            {[doctor.clinic_name, doctor.location].filter(Boolean).join(", ")} · ₹{doctor.consultation_fee ?? "—"} consultation
          </div>
        </div>
      </div>

      <div className="flex items-stretch rounded-[24px]" style={{ padding: "16px 4px", background: "var(--color-ink)" }}>
        {[
          { label: "Qualification", value: (doctor.qualifications ?? "").split(",")[0]?.trim() || "—" },
          { label: "Working days", value: `${doctorHours.length} day${doctorHours.length === 1 ? "" : "s"}/week` },
          { label: "Consultation fee", value: `₹${doctor.consultation_fee ?? "—"}` },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="flex-1 min-w-0 flex flex-col items-center gap-[3px]"
            style={i > 0 ? { borderLeft: "1px solid rgba(255,255,255,0.16)" } : undefined}
          >
            <span className="text-[15px] leading-5 font-semibold text-center" style={{ color: "#FFFFFF" }}>
              {stat.value}
            </span>
            <span className="text-xs leading-4 text-center" style={{ color: "#C9C7BC" }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-[22px]">
        <UnderlineTabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === "about" && (
        <div style={{ paddingTop: 20 }}>
          {[
            { label: "Qualification", value: doctor.qualifications ?? "" },
            { label: "Specialization", value: doctor.specialization ?? "" },
            { label: "Clinic", value: [doctor.clinic_name, doctor.location].filter(Boolean).join(", ") },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              className="flex items-start justify-between gap-4"
              style={{ padding: "13px 0", borderBottom: i < arr.length - 1 ? "1px solid #EFEFEF" : "none" }}
            >
              <span className="flex-none text-[13px] leading-5" style={{ color: "var(--color-text-faint)" }}>
                {row.label}
              </span>
              <span className="text-sm leading-5 font-semibold text-right" style={{ color: "var(--color-text-primary)" }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "avail" && (
        <div style={{ paddingTop: 20 }}>
          {workingHoursLoading && (
            <div className="text-center text-sm py-6" style={{ color: "var(--color-text-muted)" }}>
              Loading availability…
            </div>
          )}
          {!workingHoursLoading &&
            weekRows.map((row, i, arr) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-4"
                style={{ padding: "13px 0", borderBottom: i < arr.length - 1 ? "1px solid #EFEFEF" : "none" }}
              >
                <span className="text-sm leading-5 font-semibold" style={{ color: row.closed ? "var(--color-text-faint)" : "var(--color-text-primary)" }}>
                  {row.label}
                </span>
                <span className="text-sm leading-5" style={{ color: row.closed ? "var(--color-text-faint)" : "var(--color-text-secondary)" }}>
                  {row.hours}
                </span>
              </div>
            ))}
        </div>
      )}

      {tab === "rev" && (
        <div style={{ padding: "32px 4px" }}>
          <EmptyState
            icon={MessageSquare}
            dashed={false}
            title="No reviews yet"
            description="Patient feedback isn't part of TokenSeva yet. When it is, it will show up here."
          />
        </div>
      )}
    </Screen>
  );
}
