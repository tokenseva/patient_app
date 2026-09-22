import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X } from "lucide-react";
import { useApp } from "../context/AppContext";
import Screen from "../components/Screen";
import ScreenHeader from "../components/ScreenHeader";
import CtaFooter from "../components/CtaFooter";
import DoctorRow from "../components/DoctorRow";
import InfoGrid from "../components/InfoGrid";
import TicketDivider from "../components/TicketDivider";
import TokenBlock from "../components/TokenBlock";
import { describeDate } from "../lib/date";

function formatTime12h(date) {
  let hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, "0");
  const period = hour >= 12 ? "pm" : "am";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${period}`;
}

function tokenLabel(appointment) {
  if (!appointment) return "";
  return `${appointment.token_type[0].toUpperCase()}${appointment.token_number}`;
}

export default function CancelAppointmentPage() {
  const { appointmentId } = useParams();
  const { getAppointmentById, getDoctorById, cancelAppointment } = useApp();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const appointment = getAppointmentById(appointmentId);
  const doctor = appointment ? getDoctorById(appointment.doctor_id) : null;

  if (!appointment || !doctor) {
    return (
      <Screen header={<ScreenHeader onBack={() => navigate(-1)} title="Cancel appointment" />}>
        <div className="text-center text-sm py-10" style={{ color: "var(--color-text-muted)" }}>
          Appointment not found.
        </div>
      </Screen>
    );
  }

  const slotDate = new Date(appointment.slot_time);

  const handleCancel = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    const result = await cancelAppointment(appointment.id);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate("/appointments", { state: { cancelWarning: result.paymentWarning || null } });
  };

  return (
    <Screen
      bg="var(--color-surface)"
      header={<ScreenHeader onBack={() => navigate(-1)} title="Cancel appointment" onAccount={() => navigate("/profile")} />}
      footer={
        <CtaFooter>
          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting}
            className="w-full flex items-center justify-center border-none cursor-pointer"
            style={{
              minHeight: 52,
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 16,
              background: "var(--color-status-cancelled-bg)",
              color: "var(--color-status-cancelled)",
              boxShadow: "0 4px 16px rgba(178,74,74,.22)",
              opacity: submitting ? 0.6 : 1,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Cancelling…" : "Cancel appointment"}
          </button>
        </CtaFooter>
      }
      bodyPadding="40px 20px 132px"
    >
      <div className="flex flex-col items-center" style={{ gap: 24 }}>
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 56, height: 56, background: "var(--color-status-cancelled-bg)" }}
        >
          <X size={26} strokeWidth={2} color="var(--color-status-cancelled)" />
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-xl leading-7 font-semibold" style={{ letterSpacing: "-0.015em", color: "var(--color-text-primary)" }}>
            Cancel this appointment?
          </span>
          <span className="text-sm leading-5" style={{ color: "var(--color-text-secondary)" }}>
            Please review the details below before cancelling.
          </span>
          {error && (
            <span className="text-sm leading-5" style={{ color: "var(--color-status-cancelled)" }}>
              {error}
            </span>
          )}
        </div>

        <div
          className="w-full rounded-[24px] overflow-hidden"
          style={{ background: "var(--color-surface)", boxShadow: "0 16px 40px rgba(36,37,34,.16), 0 4px 10px rgba(36,37,34,.08)" }}
        >
          <div style={{ padding: 20 }}>
            <DoctorRow doctor={doctor} />
          </div>
          <TicketDivider />
          <div style={{ padding: 20 }}>
            <InfoGrid
              items={[
                { label: "Clinic", value: doctor.clinic },
                { label: "Location", value: doctor.location },
                { label: "Date", value: describeDate(slotDate).label },
                { label: "Time", value: formatTime12h(slotDate) },
              ]}
            />
          </div>
          <TicketDivider />
          <div style={{ padding: "22px 20px 24px" }}>
            <TokenBlock label="Token number" value={tokenLabel(appointment)} />
          </div>
        </div>
      </div>
    </Screen>
  );
}
