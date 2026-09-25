import { createContext, useContext, useEffect, useRef, useState } from "react";
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

// Returns { patient } on success, { notPatient: true } when the query worked but this user has
// no patients row (e.g. a doctor account's session), or { error } for a real failure (network
// etc.) — the last is transient and never treated as "not a patient".
async function fetchPatientProfile(userId) {
  const { data, error } = await supabase.from("patients").select("*").eq("id", userId).maybeSingle();
  if (error) return { error };
  if (!data) return { notPatient: true };
  return { patient: data };
}

// Same id-keyed merge as the doctor app's ClinicDataContext, used by both local writes and
// Realtime events so a row arriving from both (this tab's own insert, then its Realtime echo)
// is applied once. New rows go first, matching confirmBooking's existing newest-first behavior.
function upsertById(rows, row) {
  return rows.some((r) => r.id === row.id) ? rows.map((r) => (r.id === row.id ? row : r)) : [row, ...rows];
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
  // The session's user id is the single source of truth for being logged in (mirrors the doctor
  // app's loggedInDoctorId) — a patients-row fetch failing never logs a valid session out.
  const [sessionUserId, setSessionUserId] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  // signUp() fires SIGNED_IN before the matching patients row exists — while a signup is in
  // flight, auth-change events are ignored (same as the doctor app's AuthContext).
  const signupInProgressRef = useRef(false);

  // profileStatus: 'idle' (logged out) | 'loading' | 'ready' | 'error'. Pages that need real
  // profile fields check this instead of trusting `profile` blindly.
  const [profile, setProfile] = useState(defaultProfile);
  const [profileStatus, setProfileStatus] = useState("idle");
  const [profileReloadKey, setProfileReloadKey] = useState(0);
  // Set when a session turned out to belong to a non-patient account; shown on the login screen.
  const [notPatientNotice, setNotPatientNotice] = useState(false);

  // A session only counts as logged in to this app if it isn't a known non-patient account.
  // patientId gates every patient-data fetch and the Realtime channel below.
  const isLoggedIn = sessionUserId != null && profileStatus !== "not_patient";
  const patientId = isLoggedIn ? sessionUserId : null;
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
    if (!patientId) {
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
      .eq("patient_id", patientId)
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
  }, [patientId]);

  // Live updates: this patient's appointments changed from anywhere else (the doctor app, an
  // admin, another tab) merge into local state without a full refetch — mirrors the doctor app's
  // ClinicDataContext subscription. RLS (auth.uid() = patient_id) applies to Realtime too.
  useEffect(() => {
    if (!patientId) return;

    const mergeIn = (row) => setAppointments((prev) => upsertById(prev, row));

    // Unique topic per subscription: supabase.channel() hands back an existing channel with the
    // same topic, which could be one still being torn down (StrictMode's double effect run, or a
    // quick logout/login) — so this never reuses a stale channel.
    const channel = supabase
      .channel(`patient-appointments:${patientId}:${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "appointments", filter: `patient_id=eq.${patientId}` },
        ({ new: appointment }) => mergeIn(appointment),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "appointments", filter: `patient_id=eq.${patientId}` },
        ({ new: appointment }) => mergeIn(appointment),
      )
      // DELETE events can't be filtered (Supabase limitation) and carry only the primary key —
      // removing an id we never loaded is a no-op.
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "appointments" }, ({ old }) =>
        setAppointments((prev) => prev.filter((a) => a.id !== old.id)),
      )
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(`[AppContext] Realtime subscription ${status}`, err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId]);

  // Own medical history only (RLS: auth.uid() = patient_id) — read-only, patients never write
  // their own history, only doctors do.
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [medicalHistoryLoading, setMedicalHistoryLoading] = useState(true);
  const [medicalHistoryError, setMedicalHistoryError] = useState(null);

  useEffect(() => {
    if (!patientId) {
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
      .eq("patient_id", patientId)
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
  }, [patientId]);

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
  // out. Mirrors the doctor app's AuthContext: login state comes from the session alone, and
  // onAuthStateChange keeps it in sync afterward (sign-in/out in another tab, token refresh —
  // same user id, so a no-op — or expiry). Only sets state inside the listener: Supabase warns
  // against awaiting other supabase calls there, since it runs while the auth client holds its
  // internal lock. The patients row is fetched by the effect below instead.
  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const userId = data.session?.user.id ?? null;
      setSessionUserId(userId);
      // With a session, authReady waits for the patients-row check below instead, so a
      // non-patient session never briefly renders a logged-in screen on reload.
      if (!userId) setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active || signupInProgressRef.current) return;
      setSessionUserId(session?.user.id ?? null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // (Re-)fetches the real patients row whenever a session appears or changes user. A failure
  // leaves the user logged in with profileStatus 'error' — pages that need profile fields show
  // a retry instead of stale or placeholder data. A session with no patients row at all (e.g. a
  // doctor account left in this browser) is not a patient session: it's signed out locally only
  // (scope 'local' — never ending that account's sessions elsewhere) and the login screen says why.
  useEffect(() => {
    if (!sessionUserId) {
      setProfile(defaultProfile);
      setProfileStatus("idle");
      return;
    }

    let cancelled = false;
    setProfileStatus("loading");

    fetchPatientProfile(sessionUserId).then(({ patient, notPatient }) => {
      if (cancelled) return;
      if (patient) {
        setProfile(patient);
        setProfileStatus("ready");
        setNotPatientNotice(false);
      } else if (notPatient) {
        setProfileStatus("not_patient");
        setNotPatientNotice(true);
        supabase.auth.signOut({ scope: "local" });
      } else {
        setProfileStatus("error");
      }
      setAuthReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [sessionUserId, profileReloadKey]);

  const reloadProfile = () => setProfileReloadKey((k) => k + 1);

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

    setNotPatientNotice(false);
    // onAuthStateChange has already set this during signInWithPassword; setting the same id again
    // is a no-op, and guarantees state is set before the caller navigates. The profile effect
    // above fetches the patients row.
    setSessionUserId(data.user.id);
    return { ok: true };
  };

  // Creates a real Supabase Auth account (phone + PIN-as-password), then a matching patients
  // row. The patients row stores the UNPREFIXED local phone number, matching patients.phone's
  // real convention — not the E.164 form used for the Auth call.
  const signup = async ({ name, phone, age, place, pin }) => {
    const localPhone = digitsOf(phone);
    const formattedPhone = toE164(phone);

    signupInProgressRef.current = true;
    try {
      return await completeSignup({ name, localPhone, formattedPhone, age, place, pin });
    } finally {
      signupInProgressRef.current = false;
    }
  };

  const completeSignup = async ({ name, localPhone, formattedPhone, age, place, pin }) => {
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

    setSessionUserId(data.user.id);
    return { ok: true };
  };

  // Clears local state immediately (callers navigate to / right after — the "/" guard must
  // already see isLoggedIn false, or it would bounce straight back to /home), rather than
  // waiting for signOut's SIGNED_OUT event, which then sets the same null again (a no-op).
  const logout = () => {
    supabase.auth.signOut();
    setSessionUserId(null);
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
      .eq("id", patientId)
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
      patient_id: patientId,
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

    // upsertById, not a plain prepend: this tab's own Realtime INSERT event for the same row can
    // arrive before this insert's response does, and must not leave a duplicate behind.
    setAppointments((prev) => upsertById(prev, appointment));
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
    setAppointments((prev) => upsertById(prev, data));

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
    notPatientNotice,
    checkPhoneExists,
    login,
    signup,
    logout,
    profile,
    profileStatus,
    reloadProfile,
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
