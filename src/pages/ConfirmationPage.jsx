import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, MapPin } from "lucide-react";
import { useApp } from "../context/AppContext";
import CtaFooter from "../components/CtaFooter";
import PrimaryButton from "../components/PrimaryButton";
import DoctorRow from "../components/DoctorRow";
import InfoGrid from "../components/InfoGrid";
import TicketDivider from "../components/TicketDivider";
import TokenBlock from "../components/TokenBlock";
import { describeDate } from "../lib/date";

// Same convention as the doctor app's own tokenLabel (queue.js): first letter of token_type,
// uppercased, plus the real DB-assigned token_number — "O" for this app's online bookings.
function tokenLabel(appointment) {
  if (!appointment) return "";
  return `${appointment.token_type[0].toUpperCase()}${appointment.token_number}`;
}

function formatTime12h(date) {
  let hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, "0");
  const period = hour >= 12 ? "pm" : "am";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${period}`;
}

export default function ConfirmationPage() {
  const { lastConfirmed } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!lastConfirmed) navigate("/home", { replace: true });
  }, [lastConfirmed, navigate]);

  if (!lastConfirmed) return null;
  const { appointment, doctor, paymentWarning } = lastConfirmed;
  const slotDate = new Date(appointment.slot_time);

  return (
    <div className="relative flex flex-col" style={{ height: "100dvh", background: "var(--color-surface)" }}>
      <div className="flex-1 min-h-0 overflow-y-auto box-border" style={{ padding: "40px 20px 132px" }}>
        <div className="w-full mx-auto flex flex-col items-center" style={{ maxWidth: 430, gap: 24 }}>
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 56, height: 56, background: "var(--color-surface-subtle)" }}
          >
            <Check size={28} strokeWidth={2} color="#242522" />
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-xl leading-7 font-semibold" style={{ letterSpacing: "-0.015em", color: "var(--color-text-primary)" }}>
              Appointment confirmed
            </span>
            <span className="text-sm leading-5" style={{ color: "var(--color-text-secondary)" }}>
              Keep this handy for your visit.
            </span>
          </div>

          <div
            className="w-full rounded-[24px] overflow-hidden"
            style={{ background: "var(--color-surface)", boxShadow: "0 16px 40px rgba(36,37,34,.16), 0 4px 10px rgba(36,37,34,.08)" }}
          >
            <div style={{ padding: 20 }}>
              <DoctorRow doctor={doctor} />
            </div>

            <TicketDivider />

            <div style={{ padding: 20 }} className="flex flex-col gap-4">
              <InfoGrid
                items={[
                  { label: "Clinic", value: doctor.clinic },
                  { label: "Date", value: describeDate(slotDate).label },
                  { label: "Location", value: doctor.location },
                  { label: "Time", value: formatTime12h(slotDate) },
                ]}
              />
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 border-none cursor-pointer"
                style={{ minHeight: 44, borderRadius: 14, background: "var(--color-ink)", color: "#FFFFFF" }}
              >
                <MapPin size={18} strokeWidth={1.75} />
                <span className="text-sm font-semibold">Get directions</span>
              </button>
            </div>

            <TicketDivider />

            <div style={{ padding: "22px 20px 24px" }}>
              <TokenBlock label="Your token number" value={tokenLabel(appointment)} />
            </div>
          </div>

          {paymentWarning && (
            <div
              className="w-full text-sm text-center"
              style={{ color: "var(--color-status-cancelled)", textWrap: "pretty" }}
            >
              {paymentWarning}
            </div>
          )}
        </div>
      </div>

      <CtaFooter>
        <PrimaryButton onClick={() => navigate("/home")}>Go back to home</PrimaryButton>
      </CtaFooter>
    </div>
  );
}
