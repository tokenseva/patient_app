import { useNavigate, useParams } from "react-router-dom";
import { FileText } from "lucide-react";
import { useApp } from "../context/AppContext";
import Screen from "../components/Screen";
import ScreenHeader from "../components/ScreenHeader";
import EmptyState from "../components/EmptyState";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatNoteDate(date) {
  return `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export default function PrescriptionPage() {
  const { doctorId } = useParams();
  const { getDoctorById, getPrescriptions, medicalHistoryLoading, medicalHistoryError } = useApp();
  const navigate = useNavigate();

  const doctor = getDoctorById(doctorId);
  const notes = doctor ? getPrescriptions(doctor.id) : [];

  if (!doctor) {
    return (
      <Screen header={<ScreenHeader onBack={() => navigate(-1)} title="Prescription" />}>
        <div className="text-center text-sm py-10" style={{ color: "var(--color-text-muted)" }}>
          Doctor not found.
        </div>
      </Screen>
    );
  }

  return (
    <Screen
      bg="var(--color-surface)"
      header={
        <ScreenHeader
          onBack={() => navigate(-1)}
          title={doctor.name}
          subtitle="Notes from your visits"
          avatarInitials={doctor.initials}
          onAccount={() => navigate("/profile")}
        />
      }
      bodyPadding="20px 20px 20px"
    >
      {medicalHistoryLoading && (
        <div className="text-center text-sm py-10" style={{ color: "var(--color-text-muted)" }}>
          Loading notes…
        </div>
      )}
      {!medicalHistoryLoading && medicalHistoryError && (
        <div className="text-center text-sm py-10" style={{ color: "var(--color-status-cancelled)" }}>
          Couldn't load notes. Please try again.
        </div>
      )}
      {!medicalHistoryLoading && !medicalHistoryError && notes.length === 0 && (
        <div style={{ padding: "48px 12px" }}>
          <EmptyState
            icon={FileText}
            dashed={false}
            title="No notes yet"
            description={`${doctor.name} hasn't recorded anything here yet. Notes from your visits will show up in this space.`}
          />
        </div>
      )}
      {!medicalHistoryLoading && !medicalHistoryError && notes.length > 0 && (
        <div className="flex flex-col gap-4">
          {notes.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col gap-2"
              style={{ background: "var(--color-surface-subtle)", borderRadius: 20, padding: 20 }}
            >
              <span className="text-[13px] font-semibold" style={{ color: "var(--color-text-muted)" }}>
                {formatNoteDate(new Date(entry.created_at))}
              </span>
              <p className="m-0 text-[15px] leading-6" style={{ color: "var(--color-text-primary)" }}>
                {entry.note}
              </p>
            </div>
          ))}
        </div>
      )}
    </Screen>
  );
}
