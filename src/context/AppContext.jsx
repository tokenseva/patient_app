import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { defaultProfile } from "../data/user";

const AppContext = createContext(null);

function digitsOf(value) {
  return (value || "").replace(/\D/g, "");
}

// Real accounts store phone numbers as "+91<10-digit number>" for the Supabase Auth call —
// the `patients` table itself stores the unprefixed local number (same convention as doctors.phone).
function toE164(phone) {
  return `+91${digitsOf(phone)}`;
}

async function fetchPatientProfile(userId) {
  const { data, error } = await supabase.from("patients").select("*").eq("id", userId).single();
  if (error) return null;
  return data;
}

function initialsOf(name) {
  return (name || "")
    .split(" ")
    .filter((w) => w && w.toLowerCase() !== "dr" && w.toLowerCase() !== "dr.")
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// Real doctors rows don't carry every field the mock-data screens still read (specialty, clinic,
// initials, timeSlots — see data/doctors.js's old shape). Booking/Confirmation/Appointments/
// Prescription/Cancel are later sections and haven't been rewired to the real column names yet,
// so this keeps them from crashing on the real row shape in the meantime — real columns
// (specialization, clinic_name, etc.) are also passed through untouched for screens already
// updated to use them directly.
function normalizeDoctor(row) {
  return {
    ...row,
    clinic: row.clinic_name ?? "",
    specialty: row.specialization ?? "",
    initials: initialsOf(row.name),
    timeSlots: [],
  };
}

export function AppProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState(defaultProfile);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState(null);
  const [lastConfirmed, setLastConfirmed] = useState(null);

  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState(null);

  const [workingHours, setWorkingHours] = useState([]);
  const [workingHoursLoading, setWorkingHoursLoading] = useState(true);
  const [workingHoursError, setWorkingHoursError] = useState(null);

  // Both tables are RLS-gated to authenticated users, so these only fetch once a real session
  // exists — not on every render, and not while still logged out.
  useEffect(() => {
    if (!isLoggedIn) {
      setDoctors([]);
      setDoctorsError(null);
      setDoctorsLoading(false);
      return;
    }

    let cancelled = false;
    setDoctorsLoading(true);
    setDoctorsError(null);

    supabase
      .from("doctors")
      .select("*")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setDoctors([]);
          setDoctorsError(error.message);
        } else {
          setDoctors(data.map(normalizeDoctor));
          setDoctorsError(null);
        }
        setDoctorsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      setWorkingHours([]);
      setWorkingHoursError(null);
      setWorkingHoursLoading(false);
      return;
    }

    let cancelled = false;
    setWorkingHoursLoading(true);
    setWorkingHoursError(null);

    supabase
      .from("working_hours")
      .select("*")
      .order("day_of_week", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setWorkingHours([]);
          setWorkingHoursError(error.message);
        } else {
          setWorkingHours(data);
          setWorkingHoursError(null);
        }
        setWorkingHoursLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  // Own appointments only (RLS: auth.uid() = patient_id), so this only fetches once a real
  // session exists — same gating as doctors/workingHours above.
  useEffect(() => {
    if (!isLoggedIn) {
      setAppointments([]);
      setAppointmentsError(null);
      setAppointmentsLoading(false);
      return;
    }

    let cancelled = false;
    setAppointmentsLoading(true);
    setAppointmentsError(null);

    supabase
      .from("appointments")
      .select("*")
      .eq("patient_id", profile.id)
      .order("slot_time", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setAppointments([]);
          setAppointmentsError(error.message);
        } else {
          setAppointments(data);
          setAppointmentsError(null);
        }
        setAppointmentsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Own medical history only (RLS: auth.uid() = patient_id) — read-only, patients never write
  // their own history, only doctors do.
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [medicalHistoryLoading, setMedicalHistoryLoading] = useState(true);
  const [medicalHistoryError, setMedicalHistoryError] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setMedicalHistory([]);
      setMedicalHistoryError(null);
      setMedicalHistoryLoading(false);
      return;
    }

    let cancelled = false;
    setMedicalHistoryLoading(true);
    setMedicalHistoryError(null);

    supabase
      .from("medical_history")
      .select("*")
      .eq("patient_id", profile.id)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setMedicalHistory([]);
          setMedicalHistoryError(error.message);
        } else {
          setMedicalHistory(data);
          setMedicalHistoryError(null);
        }
        setMedicalHistoryLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // medical_history has no doctor_id column of its own — appointment_id is the only real,
  // reliable link back to a specific doctor (most real rows have appointment_id: null, with the
  // doctor only ever mentioned inside the free-text note — there's no structured way to attribute
  // those to a doctor, so they correctly don't appear on any doctor's page here). A row's doctor
  // is resolved by matching its appointment_id against this patient's own appointments (already
  // fetched above), not by a separate join query.
  const getPrescriptions = (doctorId) => {
    const doctorAppointmentIds = new Set(
      appointments.filter((a) => a.doctor_id === doctorId).map((a) => a.id)
    );
    return medicalHistory
      .filter((row) => row.appointment_id && doctorAppointmentIds.has(row.appointment_id))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const getDoctorById = (id) => doctors.find((d) => d.id === id);

  // Restores a real session on load (e.g. a page refresh) instead of always starting logged
  // out — a deliberate behavior change from the old mock login, which reset on every reload.
  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data }) => {
      const user = data?.session?.user;
      if (user) {
        const patient = await fetchPatientProfile(user.id);
        if (!cancelled && patient) {
          setProfile(patient);
          setIsLoggedIn(true);
        }
      }
      if (!cancelled) setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsLoggedIn(false);
        setProfile(defaultProfile);
      }
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Read-only check used before showing the PIN step, so the login screen can decide whether
  // to ask for a PIN (account exists) or expand to signup (it doesn't) before any sign-in attempt.
  const checkPhoneExists = async (phone) => {
    const { data, error } = await supabase.rpc("patient_phone_exists", {
      check_phone: digitsOf(phone),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, exists: Boolean(data) };
  };

  // Returns { ok: true } on success, or { ok: false, reason: 'not_found' | 'wrong_pin' | 'error' }.
  // 'not_found' tells the caller to fall through to the signup flow; 'wrong_pin' covers any
  // sign-in failure once we know an account exists; 'error' is a lookup failure, kept distinct
  // from 'not_found' so a backend hiccup doesn't misroute an existing patient into signing up again.
  const login = async (phone, pin) => {
    const localPhone = digitsOf(phone);
    const formattedPhone = toE164(phone);

    const { data: exists, error: existsError } = await supabase.rpc("patient_phone_exists", {
      check_phone: localPhone,
    });
    if (existsError) return { ok: false, reason: "error", error: existsError.message };
    if (!exists) return { ok: false, reason: "not_found" };

    const { data, error } = await supabase.auth.signInWithPassword({
      phone: formattedPhone,
      password: pin,
    });
    if (error || !data?.session) return { ok: false, reason: "wrong_pin" };

    const patient = await fetchPatientProfile(data.user.id);
    setProfile(patient ?? defaultProfile);
    setIsLoggedIn(true);
    return { ok: true };
  };

  // Creates a real Supabase Auth account (phone + PIN-as-password), then a matching patients
  // row. The patients row stores the UNPREFIXED local phone number, matching patients.phone's
  // real convention — not the E.164 form used for the Auth call.
  const signup = async ({ name, phone, age, place, pin }) => {
    const localPhone = digitsOf(phone);
    const formattedPhone = toE164(phone);

    const { data, error } = await supabase.auth.signUp({
      phone: formattedPhone,
      password: pin,
    });
    if (error || !data?.session || !data?.user) {
      return { ok: false, error: error?.message || "Couldn't create account. Please try again." };
    }

    const patientRow = {
      id: data.user.id,
      name: name?.trim() || "",
      phone: localPhone,
      age: age ? Number(age) : null,
      place: place?.trim() || null,
    };

    // The auth.users row above already exists at this point no matter what happens next — this
    // frontend has no service-role access to delete it, and won't attempt any workaround for
    // that (re-inserting into auth tables, client-side admin calls, etc.). A dedicated
    // service-role Edge Function to clean up an orphaned auth user is out of scope here, so a
    // failed insert — whether it returns an error or throws one — surfaces as an honest, specific
    // message instead of silently leaving isLoggedIn/profile in an inconsistent state.
    const partialFailureMessage =
      "Your account was partially created but we couldn't save your details. Please contact support before trying this phone number again.";
    try {
      const { error: insertError } = await supabase.from("patients").insert(patientRow);
      if (insertError) {
        await supabase.auth.signOut();
        return { ok: false, error: partialFailureMessage };
      }
    } catch {
      await supabase.auth.signOut();
      return { ok: false, error: partialFailureMessage };
    }

    setProfile(patientRow);
    setIsLoggedIn(true);
    return { ok: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setProfile(defaultProfile);
  };

  // Real update. `phone` is never sent — the UI never offers to edit it, and patients.phone has
  // a real unique constraint, so an accidental edit could collide with another patient's row. No
  // trigger restricts which fields change here (unlike appointments' cancel-only trigger), but
  // age/place are NOT NULL in the real schema — the caller (ProfilePage) is expected to have
  // already enforced name/age/place are non-empty before calling this, the same way signup does.
  const updateProfile = async ({ name, age, place }) => {
    const { data, error } = await supabase
      .from("patients")
      .update({ name: name.trim(), age: Number(age), place: place.trim() })
      .eq("id", profile.id)
      .select()
      .single();
    if (error) {
      return { ok: false, error: error.message || "Couldn't save your changes. Please try again." };
    }
    setProfile(data);
    return { ok: true };
  };

  // Real insert. token_number is intentionally omitted — the set_token_number trigger assigns
  // it atomically on insert (and would overwrite anything sent here anyway), the same as the
  // doctor app's own appointment-creation flow. Returns { ok: true } on success, or
  // { ok: false, reason: 'slot_taken' | 'error', error } — 'slot_taken' is the real
  // no_double_booking_online unique-violation (Postgres code 23505): a real window exists
  // between loading the slot grid and hitting Confirm, so this is a genuine possible outcome,
  // not just theoretical.
  const confirmBooking = async (doctorId, slotTimeDate) => {
    const doctor = getDoctorById(doctorId);
    if (!doctor || !slotTimeDate) {
      return { ok: false, reason: "error", error: "Missing booking details. Please try again." };
    }

    const appointmentRow = {
      patient_id: profile.id,
      doctor_id: doctorId,
      slot_time: slotTimeDate.toISOString(),
      type: "online",
      status: "booked",
      token_type: "online",
    };

    let appointment;
    try {
      const { data, error } = await supabase.from("appointments").insert(appointmentRow).select().single();
      if (error) {
        if (error.code === "23505") {
          return { ok: false, reason: "slot_taken", error: "That slot was just taken. Please pick another." };
        }
        return { ok: false, reason: "error", error: error.message || "Couldn't book this appointment. Please try again." };
      }
      appointment = data;
    } catch {
      return { ok: false, reason: "error", error: "Couldn't book this appointment. Please try again." };
    }

    // The appointment above already succeeded for real — that's never rolled back. A failed
    // payment insert here is a partial-success case (same principle as the doctor app's own
    // booking flow): the caller still gets ok: true and lands on the confirmation screen, just
    // with a warning instead of a payment row to show.
    let payment = null;
    let paymentWarning = null;
    try {
      const { data, error } = await supabase
        .from("payments")
        .insert({ appointment_id: appointment.id, amount: doctor.consultation_fee, mode: null, status: "pending" })
        .select()
        .single();
      if (error) {
        paymentWarning = `Your appointment is booked, but we couldn't save the payment record: ${error.message}. Please contact the clinic if this isn't resolved before your visit.`;
      } else {
        payment = data;
      }
    } catch {
      paymentWarning =
        "Your appointment is booked, but we couldn't save the payment record. Please contact the clinic if this isn't resolved before your visit.";
    }

    setAppointments((prev) => [appointment, ...prev]);
    setLastConfirmed({ appointment, doctor, payment, paymentWarning });
    return { ok: true, appointment };
  };

  // Real update. Sends ONLY { status: 'cancelled' } — the enforce_patient_appointment_cancel_only
  // trigger rejects the whole update if any other field is touched (doctor_id, slot_time, type,
  // token_type, token_number), and the RLS policy's qual already requires the current row to be
  // 'booked'. Mirrors the doctor app's own updateAppointmentStatus + markPaymentCancelled: the
  // appointment cancellation is the real, final outcome regardless of whether the linked
  // payment's status update also succeeds — that's a non-fatal partial failure, never a reason
  // to revert the cancellation.
  const cancelAppointment = async (id) => {
    const { data, error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      return { ok: false, error: error.message || "Couldn't cancel this appointment. Please try again." };
    }
    setAppointments((prev) => prev.map((a) => (a.id === id ? data : a)));

    let paymentWarning = null;
    try {
      const { error: paymentError } = await supabase
        .from("payments")
        .update({ status: "cancelled" })
        .eq("appointment_id", id)
        .eq("status", "pending")
        .select()
        .single();
      // PGRST116 ("no rows") means there was nothing pending to cancel (e.g. already paid) —
      // a valid real state, not a failure.
      if (paymentError && paymentError.code !== "PGRST116") {
        paymentWarning = `Your appointment was cancelled, but the linked payment couldn't be updated: ${paymentError.message}. Please contact the clinic if this isn't resolved.`;
      }
    } catch {
      paymentWarning =
        "Your appointment was cancelled, but the linked payment couldn't be updated. Please contact the clinic if this isn't resolved.";
    }

    return { ok: true, appointment: data, paymentWarning };
  };

  const getAppointmentById = (id) => appointments.find((a) => a.id === id);

  const value = {
    isLoggedIn,
    authReady,
    checkPhoneExists,
    login,
    signup,
    logout,
    profile,
    updateProfile,
    doctors,
    doctorsLoading,
    doctorsError,
    getDoctorById,
    workingHours,
    workingHoursLoading,
    workingHoursError,
    appointments,
    appointmentsLoading,
    appointmentsError,
    confirmBooking,
    cancelAppointment,
    getAppointmentById,
    lastConfirmed,
    medicalHistoryLoading,
    medicalHistoryError,
    getPrescriptions,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
