import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { useApp } from "../context/AppContext";
import IconButton from "../components/IconButton";
import BottomNav from "../components/BottomNav";
import PillTabs from "../components/PillTabs";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import { CalendarX } from "lucide-react";
import { describeDate } from "../lib/date";

// Real appointments.status is only ever booked/consulting/completed/cancelled — there's no
// 'upcoming' or 'pending' appointment status (that's a payments status, not an appointments one).
// booked/consulting haven't happened yet (Upcoming); completed/cancelled are done (Past).
const STATUS_LABEL = {
  booked: "Upcoming",
  consulting: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

// StatusBadge's TONES only has upcoming/completed/cancelled/pending keys (no 'booked'/
// 'consulting') — mapped here so a real status still gets the right badge color instead of
// silently falling back to the pending tone.
const STATUS_TONE = {
  booked: "upcoming",
  consulting: "upcoming",
  completed: "completed",
  cancelled: "cancelled",
};

function isUpcomingStatus(status) {
  return status === "booked" || status === "consulting";
}

function formatTime12h(date) {
  let hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, "0");
  const period = hour >= 12 ? "pm" : "am";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${period}`;
}

function groupByDoctor(list) {
  const order = [];
  const groups = {};
  list.forEach((apt) => {
    if (!groups[apt.doctor_id]) {
      groups[apt.doctor_id] = [];
      order.push(apt.doctor_id);
    }
    groups[apt.doctor_id].push(apt);
  });
  return order.map((doctorId) => ({ doctorId, appointments: groups[doctorId] }));
}

export default function AppointmentsPage() {
  const { appointments, appointmentsLoading, appointmentsError, getDoctorById } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState("upcoming");
  const [cancelWarning] = useState(location.state?.cancelWarning || null);

  const filtered = useMemo(() => {
    return appointments.filter((a) => (tab === "upcoming" ? isUpcomingStatus(a.status) : !isUpcomingStatus(a.status)));
  }, [appointments, tab]);

  const groups = useMemo(() => groupByDoctor(filtered), [filtered]);

  return (
    <div className="relative flex flex-col" style={{ height: "100dvh", background: "var(--color-surface)" }}>
      <div className="flex-none px-5 pt-2 box-border">
        <div className="w-full mx-auto flex flex-col" style={{ maxWidth: 430 }}>
          <div className="flex items-center justify-between gap-4" style={{ minHeight: 44 }}>
            <h2 className="m-0 text-2xl leading-[30px] font-semibold" style={{ letterSpacing: "-0.02em", color: "var(--color-text-primary)" }}>
              Appointments
            </h2>
            <IconButton icon={User} label="Account" onClick={() => navigate("/profile")} />
          </div>
          <div className="mt-3.5">
            <PillTabs
              tabs={[
                { value: "upcoming", label: "Upcoming" },
                { value: "past", label: "Past" },
              ]}
              active={tab}
              onChange={setTab}
            />
          </div>
          {cancelWarning && (
            <div className="mt-3 text-[13px]" style={{ color: "var(--color-status-cancelled)" }}>
              {cancelWarning}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 box-border" style={{ paddingTop: 16, paddingBottom: 132 }}>
        <div className="w-full mx-auto flex flex-col gap-6" style={{ maxWidth: 430 }}>
          {appointmentsLoading && (
            <div className="text-center text-sm py-10" style={{ color: "var(--color-text-muted)" }}>
              Loading appointments…
            </div>
          )}
          {!appointmentsLoading && appointmentsError && (
            <div className="text-center text-sm py-10" style={{ color: "var(--color-status-cancelled)" }}>
              Couldn't load appointments. Please try again.
            </div>
          )}
          {!appointmentsLoading && !appointmentsError && groups.length === 0 && (
            <EmptyState
              icon={CalendarX}
              title={tab === "upcoming" ? "No upcoming appointments" : "No past appointments"}
              description={
                tab === "upcoming"
                  ? "Book a doctor from Home and it will show up here."
                  : "Appointments you've completed or cancelled will show up here."
              }
            />
          )}
          {!appointmentsLoading && !appointmentsError && groups.map(({ doctorId, appointments: apts }) => {
            const doctor = getDoctorById(doctorId);
            if (!doctor) return null;
            return (
              <div key={doctorId} className="flex flex-col gap-3.5">
                <div className="flex items-center gap-3">
                  <div
                    className="flex-none flex items-center justify-center rounded-full font-semibold"
                    style={{ width: 32, height: 32, background: "var(--color-surface-subtle)", fontSize: 12, color: "var(--color-text-secondary)" }}
                  >
                    {doctor.initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      {doctor.name}
                    </span>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {doctor.specialty}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3.5">
                  {apts.map((apt) => {
                    const slotDate = new Date(apt.slot_time);
                    return (
                    <div
                      key={apt.id}
                      className="flex flex-col gap-4"
                      style={{ background: "var(--color-surface-subtle)", borderRadius: 16, padding: 18 }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                            {describeDate(slotDate).label}
                          </span>
                          <span className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
                            {formatTime12h(slotDate)}
                          </span>
                        </div>
                        <StatusBadge status={STATUS_TONE[apt.status]} label={STATUS_LABEL[apt.status] ?? apt.status} />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/prescriptions/${doctor.id}`)}
                          className="flex-1 border-none cursor-pointer text-[13px] font-semibold"
                          style={{ minHeight: 36, borderRadius: 12, background: "var(--color-surface)", color: "var(--color-text-secondary)" }}
                        >
                          Prescription
                        </button>
                        <button
                          type="button"
                          className="flex-1 border-none cursor-pointer text-[13px] font-semibold"
                          style={{ minHeight: 36, borderRadius: 12, background: "var(--color-surface)", color: "var(--color-text-secondary)" }}
                        >
                          Invoice
                        </button>
                        {apt.status === "booked" && (
                          <button
                            type="button"
                            onClick={() => navigate(`/appointments/${apt.id}/cancel`)}
                            className="flex-none border-none cursor-pointer text-[13px] font-semibold"
                            style={{ minHeight: 36, padding: "0 12px", borderRadius: 12, background: "transparent", color: "var(--color-status-cancelled)" }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
