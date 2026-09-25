import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeartPulse } from "lucide-react";
import { useApp } from "../context/AppContext";
import PrimaryButton from "../components/PrimaryButton";
import Collapse from "../components/Collapse";
import PinInput from "../components/PinInput";

const PIN_LENGTH = 6;

export default function LoginPage() {
  const { login, signup, checkPhoneExists, notPatientNotice } = useApp();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [place, setPlace] = useState("");
  const [pinStep, setPinStep] = useState(false);
  const [pin, setPin] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ageTouched, setAgeTouched] = useState(false);
  const [placeTouched, setPlaceTouched] = useState(false);

  const awaitingPin = !expanded && pinStep;

  const greetTitle = expanded ? "Let's get you set up" : awaitingPin ? "Enter your PIN" : "Welcome back";
  const greetSub = expanded
    ? "Four quick details and you're in."
    : awaitingPin
      ? `Enter the 6-digit PIN for +91 ${phone.trim()}.`
      : "Log in with your phone number to continue.";

  const canSubmit = awaitingPin
    ? pin.length === PIN_LENGTH
    : expanded
      ? phone.trim().length > 0 && pin.length === PIN_LENGTH && age.trim().length > 0 && place.trim().length > 0
      : phone.trim().length > 0;
  const primaryLabel = expanded ? "Create account" : awaitingPin ? "Log in" : "Continue";

  const handleToggleMode = () => {
    setExpanded((v) => !v);
    setPinStep(false);
    setPin("");
    setFormError("");
    setAgeTouched(false);
    setPlaceTouched(false);
  };

  const handlePrimaryAction = async () => {
    if (!canSubmit || submitting) return;
    setFormError("");

    // Plain login (not signup) is a two-step flow: phone number first, then a 6-digit PIN.
    // The phone step decides which screen comes next by checking whether an account exists,
    // before ever attempting a sign-in.
    if (!expanded && !pinStep) {
      setSubmitting(true);
      const result = await checkPhoneExists(phone);
      setSubmitting(false);

      if (!result.ok) {
        setFormError(result.error || "Something went wrong. Please try again.");
        return;
      }
      if (result.exists) {
        setPinStep(true);
      } else {
        setExpanded(true);
      }
      return;
    }

    setSubmitting(true);
    const result = expanded
      ? await signup({ name, phone, age, place, pin })
      : await login(phone, pin);
    setSubmitting(false);

    if (result.ok) {
      navigate("/home");
      return;
    }

    if (!expanded && result.reason === "not_found") {
      // Rare race: the account existed at the phone step but not anymore. Fall through to signup.
      setExpanded(true);
      setPinStep(false);
      setPin("");
      return;
    }

    setFormError(
      result.reason === "wrong_pin" ? "Incorrect PIN." : result.error || "Something went wrong. Please try again."
    );
  };

  return (
    <div className="flex flex-col" style={{ height: "100dvh", background: "var(--color-surface)" }}>
      <div className="flex-1 min-h-0 flex flex-col px-5 box-border">
        <div className="w-full mx-auto flex-1 min-h-0 flex flex-col" style={{ maxWidth: 430 }}>
          <div className="mt-5 flex-none flex items-center justify-center" style={{ minHeight: 44 }}>
            <span className="text-lg leading-[22px] font-semibold tracking-[-0.015em]" style={{ color: "var(--color-text-primary)" }}>
              TokenSeva
            </span>
          </div>

          <Collapse open={!expanded}>
            <div style={{ paddingTop: 20 }}>
              <div
                className="w-full flex items-center justify-center rounded-[20px]"
                style={{ height: 220, background: "linear-gradient(160deg, #F1F6E8 0%, #EAF2F9 100%)" }}
              >
                <HeartPulse size={56} strokeWidth={1.5} color="#5F605B" />
              </div>
            </div>
          </Collapse>

          <div
            className="flex-1 min-h-0 flex flex-col justify-center"
            style={{
              alignItems: expanded ? "flex-start" : "center",
              textAlign: expanded ? "left" : "center",
              padding: `${expanded ? 16 : 32}px 0`,
              transition: "padding 250ms ease-out",
            }}
          >
            <h1 className="m-0 text-[28px] leading-[34px] font-semibold" style={{ letterSpacing: "-0.025em", color: "var(--color-text-primary)" }}>
              {greetTitle}
            </h1>
            <p className="mt-2 mb-0 text-sm leading-5 font-medium" style={{ color: "var(--color-text-secondary)" }}>
              {greetSub}
            </p>
          </div>
        </div>
      </div>

      <div
        className="flex-none px-5 pt-6 box-border"
        style={{
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          borderRadius: "40px 40px 0 0",
          boxShadow: "0 -8px 24px rgba(36, 37, 34, 0.08)",
        }}
      >
        <div className="w-full mx-auto flex flex-col" style={{ maxWidth: 430 }}>
          <Collapse open={expanded}>
            <div className="flex flex-col gap-1 pb-5">
              <span className="text-base leading-[22px] font-semibold tracking-[-0.01em]" style={{ color: "var(--color-text-primary)" }}>
                Create your account
              </span>
              <span className="text-[13px] leading-[18px]" style={{ color: "var(--color-text-muted)" }}>
                Four details, once.
              </span>
            </div>
          </Collapse>

          <Collapse open={expanded}>
            <div className="flex flex-col gap-2 pb-3.5">
              <label htmlFor="lg-name" className="text-[13px] leading-[18px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
                Full name
              </label>
              <input
                id="lg-name"
                type="text"
                placeholder="Anjali Menon"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full box-border px-4 text-base outline-none"
                style={{ height: 52, color: "var(--color-text-primary)", background: "var(--color-surface-subtle)", border: "none", borderRadius: 16 }}
              />
            </div>
          </Collapse>

          <div className="flex flex-col gap-2">
            <label htmlFor="lg-phone" className="text-[13px] leading-[18px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
              Phone number
            </label>
            <div
              className="flex items-center overflow-hidden"
              style={{ height: 52, background: "var(--color-surface-subtle)", borderRadius: 24 }}
            >
              <span
                className="flex-none self-stretch flex items-center text-base font-medium"
                style={{ padding: "0 14px 0 16px", color: "var(--color-text-secondary)", borderRight: "1px solid var(--color-border)" }}
              >
                +91
              </span>
              <input
                id="lg-phone"
                type="tel"
                placeholder="98470 00000"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setFormError("");
                }}
                className="flex-1 min-w-0 self-stretch px-4 border-none outline-none bg-transparent text-base"
                style={{ letterSpacing: "0.01em", color: "var(--color-text-primary)" }}
              />
            </div>
          </div>

          <Collapse open={awaitingPin || expanded}>
            <div className="flex flex-col gap-2 pt-3.5">
              <label className="text-[13px] leading-[18px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
                {expanded ? "Set a 6-digit PIN" : "6-digit PIN"}
              </label>
              <PinInput
                value={pin}
                onChange={(v) => {
                  setPin(v);
                  setFormError("");
                }}
                length={PIN_LENGTH}
                autoFocus={awaitingPin}
              />
              {expanded && (
                <span className="text-xs leading-4" style={{ color: "var(--color-text-muted)" }}>
                  You'll use this PIN to log in next time.
                </span>
              )}
            </div>
          </Collapse>

          {notPatientNotice && !formError && (
            <span className="text-xs leading-4 pt-2" style={{ color: "var(--color-status-cancelled)" }}>
              This account isn't a patient account. Log in with a patient phone number to continue.
            </span>
          )}

          {formError && (
            <span className="text-xs leading-4 pt-2" style={{ color: "var(--color-status-cancelled)" }}>
              {formError}
            </span>
          )}

          <Collapse open={expanded}>
            <div className="flex flex-col gap-3.5 pt-3.5">
              <div className="flex flex-col gap-2">
                <label htmlFor="lg-age" className="text-[13px] leading-[18px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
                  Age
                </label>
                <input
                  id="lg-age"
                  type="text"
                  placeholder="34"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  onBlur={() => setAgeTouched(true)}
                  className="w-full box-border px-4 text-base outline-none"
                  style={{ height: 52, color: "var(--color-text-primary)", background: "var(--color-surface-subtle)", border: "none", borderRadius: 16 }}
                />
                {ageTouched && !age.trim() && (
                  <span className="text-xs leading-4" style={{ color: "var(--color-status-cancelled)" }}>
                    Age is required.
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="lg-place" className="text-[13px] leading-[18px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
                  Place
                </label>
                <input
                  id="lg-place"
                  type="text"
                  placeholder="Thalassery"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  onBlur={() => setPlaceTouched(true)}
                  className="w-full box-border px-4 text-base outline-none"
                  style={{ height: 52, color: "var(--color-text-primary)", background: "var(--color-surface-subtle)", border: "none", borderRadius: 16 }}
                />
                {placeTouched && !place.trim() && (
                  <span className="text-xs leading-4" style={{ color: "var(--color-status-cancelled)" }}>
                    Place is required.
                  </span>
                )}
              </div>
            </div>
          </Collapse>

          <PrimaryButton onClick={handlePrimaryAction} disabled={!canSubmit || submitting} className="mt-5">
            {submitting ? "Please wait…" : primaryLabel}
          </PrimaryButton>

          <button
            type="button"
            onClick={handleToggleMode}
            disabled={submitting}
            className="mt-1 flex items-center justify-center gap-1.5 w-full bg-transparent border-none cursor-pointer rounded-2xl"
            style={{ minHeight: 48 }}
          >
            <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {expanded ? "Already have an account?" : "New here?"}
            </span>
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              {expanded ? "Log in." : "Sign up."}
            </span>
          </button>

          <div style={{ height: 34 }} />
        </div>
      </div>
    </div>
  );
}
