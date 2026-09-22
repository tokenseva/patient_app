import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar as CalendarIcon, CalendarX } from "lucide-react";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabaseClient";
import Screen from "../components/Screen";
import ScreenHeader from "../components/ScreenHeader";
import CtaFooter from "../components/CtaFooter";
import PrimaryButton from "../components/PrimaryButton";
import SelectableTile from "../components/SelectableTile";
import DoctorRow from "../components/DoctorRow";
import InfoGrid from "../components/InfoGrid";
import TicketDivider from "../components/TicketDivider";
import CalendarSheet from "../components/CalendarSheet";
import EmptyState from "../components/EmptyState";
import { nextDays } from "../lib/date";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Mirrors the doctor app's own generateSlotGrid (queue.js): the full grid of possible slot start
// times for a day, from working_hours (start_time/end_time, "HH:MM:SS") and
// slot_duration_minutes — independent of what's actually booked. Parameterized by dateIso (a
// "YYYY-MM-DD" local-calendar-date string, see lib/date.js's toIso) rather than always "today",
// since patients pick a future date here.
function generateSlotGrid(dateIso, workingHoursDay, slotDurationMinutes) {
  if (!workingHoursDay || !workingHoursDay.start_time || !workingHoursDay.end_time) return [];
  const [year, month, day] = dateIso.split("-").map(Number);
  const [sh, sm] = workingHoursDay.start_time.split(":").map(Number);
  const [eh, em] = workingHoursDay.end_time.split(":").map(Number);
  const start = new Date(year, month - 1, day, sh, sm, 0, 0);
  const end = new Date(year, month - 1, day, eh, em, 0, 0);
  const slots = [];
  let cursor = new Date(start);
  const stepMs = slotDurationMinutes * 60000;
  while (cursor.getTime() + stepMs <= end.getTime()) {
    slots.push(new Date(cursor));
    cursor = new Date(cursor.getTime() + stepMs);
  }
  return slots;
}

function formatTime12h(date) {
  let hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, "0");
  const period = hour >= 12 ? "pm" : "am";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${period}`;
}

export default function BookingPage() {
  const { doctorId } = useParams();
  // Remount on doctorId change so selection state never leaks between doctors.
  return <BookingScreen key={doctorId} doctorId={doctorId} />;
}

function BookingScreen({ doctorId }) {
  const { getDoctorById, profile, confirmBooking, workingHours } = useApp();
  const navigate = useNavigate();

  const doctor = getDoctorById(doctorId);
  const [booking, setBookingState] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  // The real Date behind selectedTime's display label — what actually gets sent as slot_time.
  const [selectedSlotDate, setSelectedSlotDate] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  // Real, non-cancelled appointments already sitting in the selected doctor+date's slots —
  // includes walk-in/phone bookings too, not just online ones, so every returned slot_time is
  // treated as occupied, full stop (never filtered down to "online only").
  const [bookedSlots, setBookedSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const fetchBookedSlots = async (dateIso) => {
    if (!doctor || !dateIso) {
      setBookedSlots([]);
      return;
    }
    setSlotsLoading(true);
    const { data, error } = await supabase.rpc("doctor_booked_slots", {
      check_doctor_id: doctor.id,
      check_date: dateIso,
    });
    setBookedSlots(error ? [] : data ?? []);
    setSlotsLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    if (!doctor || !selectedDate) {
      setBookedSlots([]);
    } else {
      setSlotsLoading(true);
      supabase
        .rpc("doctor_booked_slots", { check_doctor_id: doctor.id, check_date: selectedDate.iso })
        .then(({ data, error }) => {
          if (cancelled) return;
          setBookedSlots(error ? [] : data ?? []);
          setSlotsLoading(false);
        });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctor?.id, selectedDate?.iso]);

  if (!doctor) {
    return (
      <Screen header={<ScreenHeader onBack={() => navigate(-1)} title="Book appointment" />}>
        <div className="text-center text-sm py-10" style={{ color: "var(--color-text-muted)" }}>
          Doctor not found.
        </div>
      </Screen>
    );
  }

  const dateStrip = nextDays(7);

  const selectedDow = selectedDate ? new Date(selectedDate.iso + "T00:00:00").getDay() : null;
  const hoursForSelectedDay = selectedDate
    ? workingHours.find((w) => w.doctor_id === doctor.id && w.day_of_week === selectedDow)
    : null;
  const occupied = new Set(bookedSlots.map((row) => new Date(row.slot_time).getTime()));
  const daySlots = hoursForSelectedDay
    ? generateSlotGrid(selectedDate.iso, hoursForSelectedDay, doctor.slot_duration_minutes).map((slotDate) => ({
        key: slotDate.getTime(),
        time: formatTime12h(slotDate),
        available: !occupied.has(slotDate.getTime()),
      }))
    : [];

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setSelectedSlotDate(null);
    setCalendarOpen(false);
  };

  const handleContinue = () => {
    if (!selectedDate || !selectedTime) return;
    setConfirmError("");
    setBookingState(true);
  };

  const handleConfirm = async () => {
    if (!selectedSlotDate || confirming) return;
    setConfirming(true);
    const result = await confirmBooking(doctor.id, selectedSlotDate);
    setConfirming(false);

    if (result.ok) {
      navigate("/confirmation");
      return;
    }

    // Neither failure leaves the ticket-review state stuck: back to date/time selection so the
    // user can retry (reselect the same slot) or go back (header) instead of a dead end.
    setBookingState(false);
    setConfirmError(result.error);

    if (result.reason === "slot_taken") {
      setSelectedTime(null);
      setSelectedSlotDate(null);
      if (selectedDate) await fetchBookedSlots(selectedDate.iso);
    }
  };

  return (
    <Screen
      header={<ScreenHeader onBack={() => navigate(-1)} title="Book appointment" onAccount={() => navigate("/profile")} />}
      footer={
        <CtaFooter>
          {booking ? (
            <PrimaryButton onClick={handleConfirm} disabled={confirming}>
              {confirming ? "Confirming…" : "Confirm"}
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={handleContinue} disabled={!selectedDate || !selectedTime}>
              Continue
            </PrimaryButton>
          )}
        </CtaFooter>
      }
      overlay={
        calendarOpen && (
          <CalendarSheet
            month={new Date()}
            selectedIso={selectedDate?.iso}
            onSelect={handleSelectDate}
            onClose={() => setCalendarOpen(false)}
          />
        )
      }
    >
      <div className="flex flex-col" style={{ gap: 28, justifyContent: booking ? "center" : "flex-start" }}>
        <div
          className="rounded-[24px] overflow-hidden"
          style={{ background: "var(--color-surface)", boxShadow: "0 16px 40px rgba(36,37,34,.16), 0 4px 10px rgba(36,37,34,.08)" }}
        >
          <div style={{ padding: "20px 20px 0" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase" style={{ letterSpacing: "0.04em", color: "var(--color-text-muted)" }}>
                  Booking for
                </div>
                <div className="mt-0.5 text-base font-semibold" style={{ letterSpacing: "-0.01em", color: "var(--color-text-primary)" }}>
                  {profile.name}
                </div>
              </div>
              <span
                className="flex-none inline-flex items-center text-xs font-semibold"
                style={{ height: 26, padding: "0 10px", borderRadius: 10, background: "var(--color-surface-subtle)", color: "var(--color-text-secondary)" }}
              >
                Self
              </span>
            </div>

            <div className="my-4">
              <div style={{ borderTop: "1px solid #EFEFEF" }} />
            </div>

            <DoctorRow doctor={doctor} />

            <div className="my-4">
              <div style={{ borderTop: "1px solid #EFEFEF" }} />
            </div>

            <InfoGrid
              items={[
                { label: "Clinic", value: doctor.clinic },
                { label: "Location", value: doctor.location },
                { label: "Date", value: selectedDate ? selectedDate.label : "—" },
                { label: "Time", value: selectedTime || "—" },
              ]}
            />

            <div style={{ marginTop: 16 }}>
              <TicketDivider />
            </div>
          </div>
          <div style={{ height: 12 }} />
        </div>

        {!booking && confirmError && (
          <div className="text-sm" style={{ color: "var(--color-status-cancelled)" }}>
            {confirmError}
          </div>
        )}

        {!booking && (
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold" style={{ letterSpacing: "-0.015em", color: "var(--color-text-primary)" }}>
                  Choose a date
                </span>
                <button
                  type="button"
                  onClick={() => setCalendarOpen(true)}
                  className="inline-flex items-center gap-1.5 border-none cursor-pointer"
                  style={{ minHeight: 40, padding: "0 14px", borderRadius: 14, background: "var(--color-ink)", color: "#FFFFFF" }}
                >
                  <CalendarIcon size={16} strokeWidth={1.75} />
                  <span className="text-[13px] font-semibold">Full calendar</span>
                </button>
              </div>
              <div className="mt-3 flex gap-2.5 overflow-x-auto" data-hscroll>
                {dateStrip.map((date) => {
                  const isSelected = selectedDate?.iso === date.iso;
                  return (
                    <SelectableTile
                      key={date.iso}
                      selected={isSelected}
                      onClick={() => handleSelectDate(date)}
                      className="flex-none"
                    >
                      <div style={{ width: 64, padding: "12px 0" }} className="flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold" style={{ color: isSelected ? "#FFFFFF" : "var(--color-text-muted)" }}>
                          {date.dayAbbr}
                        </span>
                        <span className="text-lg font-semibold" style={{ letterSpacing: "-0.01em" }}>
                          {date.dayNum}
                        </span>
                      </div>
                    </SelectableTile>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-semibold" style={{ letterSpacing: "-0.015em", color: "var(--color-text-primary)" }}>
                  Choose a time
                </span>
                {selectedDate && hoursForSelectedDay && (
                  <span className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
                    {doctor.slot_duration_minutes} min each
                  </span>
                )}
              </div>

              {!selectedDate && (
                <div className="mt-3 text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Pick a date to see available times.
                </div>
              )}

              {selectedDate && !hoursForSelectedDay && (
                <div style={{ marginTop: 12 }}>
                  <EmptyState
                    icon={CalendarX}
                    title="Not available this day"
                    description={`${doctor.name} doesn't see patients on ${DAY_NAMES[selectedDow]}s. Pick a different date.`}
                  />
                </div>
              )}

              {selectedDate && hoursForSelectedDay && slotsLoading && (
                <div className="mt-3 text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Loading available times…
                </div>
              )}

              {selectedDate && hoursForSelectedDay && !slotsLoading && (
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {daySlots.map((slot) => {
                    const isSelected = selectedTime === slot.time;
                    return (
                      <SelectableTile
                        key={slot.key}
                        selected={isSelected}
                        disabled={!slot.available}
                        onClick={() => {
                          setSelectedTime(slot.time);
                          setSelectedSlotDate(new Date(slot.key));
                          setConfirmError("");
                        }}
                      >
                        <span className="text-sm font-semibold" style={{ minHeight: 44, padding: "0 18px", display: "flex", alignItems: "center" }}>
                          {slot.time}
                        </span>
                      </SelectableTile>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Screen>
  );
}
