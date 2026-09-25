import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Lock, CalendarDays, FileText } from "lucide-react";
import { useApp } from "../context/AppContext";
import Screen from "../components/Screen";
import ScreenHeader from "../components/ScreenHeader";

const inputStyle = {
  height: 52,
  color: "var(--color-text-primary)",
  background: "var(--color-surface-subtle)",
  border: "none",
  borderRadius: 16,
};

function NavRow({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 border-none cursor-pointer text-left"
      style={{ minHeight: 52, padding: "0 16px", background: "var(--color-surface-subtle)", borderRadius: 16 }}
    >
      <Icon size={18} strokeWidth={1.75} color="var(--color-text-secondary)" />
      <span className="flex-1 text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
        {label}
      </span>
      <ChevronRight size={18} strokeWidth={1.75} color="var(--color-text-muted)" />
    </button>
  );
}

// The form below seeds its inputs from `profile` once, on mount — so it only mounts once the real
// patients row has loaded (keyed by id, so a different account remounts it). A failed load keeps
// the user logged in and offers a retry instead of showing placeholder or stale details.
export default function ProfilePage() {
  const { profile, profileStatus, reloadProfile, logout } = useApp();
  const navigate = useNavigate();

  if (profileStatus === "ready") return <ProfileForm key={profile.id} />;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Screen
      bg="var(--color-surface)"
      header={<ScreenHeader onBack={() => navigate("/home")} title="Account" showAccount={false} />}
      bodyPadding="20px 20px 20px"
    >
      <div className="flex flex-col items-center text-center" style={{ gap: 12, paddingTop: 40 }}>
        {profileStatus === "error" ? (
          <>
            <span className="text-sm leading-5" style={{ color: "var(--color-text-secondary)" }}>
              Couldn't load your profile. You're still logged in.
            </span>
            <button
              type="button"
              onClick={reloadProfile}
              className="flex items-center justify-center border-none cursor-pointer"
              style={{ minHeight: 44, padding: "0 20px", borderRadius: 14, background: "var(--color-ink)", color: "#FFFFFF", fontSize: 14, fontWeight: 600 }}
            >
              Try again
            </button>
          </>
        ) : (
          <span className="text-sm leading-5" style={{ color: "var(--color-text-secondary)" }}>
            Loading your profile…
          </span>
        )}
      </div>

      <div className="flex-none" style={{ paddingTop: 20 }}>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center cursor-pointer"
          style={{
            minHeight: 48,
            borderRadius: 16,
            background: "var(--color-surface-subtle)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-primary)",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Log out
        </button>
      </div>
    </Screen>
  );
}

function ProfileForm() {
  const { profile, updateProfile, logout } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [place, setPlace] = useState(profile.place);
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const initials = profile.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const nameValid = String(name).trim().length > 0;
  const ageValid = String(age).trim().length > 0;
  const placeValid = String(place).trim().length > 0;
  const canSave = nameValid && ageValid && placeValid;

  const markTouched = (field) => setTouched((t) => ({ ...t, [field]: true }));

  const handleSave = async () => {
    setTouched({ name: true, age: true, place: true });
    setSaved(false);
    if (!canSave || saving) return;

    setSaving(true);
    setSaveError("");
    const result = await updateProfile({ name, age, place });
    setSaving(false);

    if (!result.ok) {
      setSaveError(result.error);
      return;
    }
    setSaved(true);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Screen
      bg="var(--color-surface)"
      header={<ScreenHeader onBack={() => navigate("/home")} title="Account" showAccount={false} />}
      bodyPadding="20px 20px 20px"
    >
      <div className="flex flex-col" style={{ gap: 28 }}>
        <div className="flex flex-col items-center" style={{ gap: 12 }}>
          <div
            className="flex items-center justify-center rounded-full font-semibold"
            style={{ width: 72, height: 72, fontSize: 22, letterSpacing: "-0.01em", background: "var(--color-surface-subtle)", color: "var(--color-text-primary)" }}
          >
            {initials}
          </div>
          <span className="text-[22px] leading-7 font-semibold" style={{ letterSpacing: "-0.02em", color: "var(--color-text-primary)" }}>
            {profile.name}
          </span>
        </div>

        <div className="flex flex-col" style={{ gap: 14 }}>
          <div className="flex flex-col gap-2">
            <label className="text-[13px] leading-[18px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
              Full name
            </label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
              onBlur={() => markTouched("name")}
              className="w-full box-border px-4 text-base outline-none"
              style={inputStyle}
            />
            {touched.name && !nameValid && (
              <span className="text-xs leading-4" style={{ color: "var(--color-status-cancelled)" }}>
                Full name is required.
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[13px] leading-[18px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
                Age
              </label>
              <input
                value={age}
                onChange={(e) => {
                  setAge(e.target.value);
                  setSaved(false);
                }}
                onBlur={() => markTouched("age")}
                className="w-full box-border px-4 text-base outline-none"
                style={inputStyle}
              />
              {touched.age && !ageValid && (
                <span className="text-xs leading-4" style={{ color: "var(--color-status-cancelled)" }}>
                  Age is required.
                </span>
              )}
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[13px] leading-[18px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
                Place
              </label>
              <input
                value={place}
                onChange={(e) => {
                  setPlace(e.target.value);
                  setSaved(false);
                }}
                onBlur={() => markTouched("place")}
                className="w-full box-border px-4 text-base outline-none"
                style={inputStyle}
              />
              {touched.place && !placeValid && (
                <span className="text-xs leading-4" style={{ color: "var(--color-status-cancelled)" }}>
                  Place is required.
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] leading-[18px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
              Phone number
            </label>
            <div
              className="flex items-center justify-between px-4"
              style={{ height: 52, borderRadius: 16, background: "var(--color-surface-subtle)", cursor: "not-allowed" }}
            >
              <span className="text-base" style={{ color: "var(--color-text-muted)" }}>
                +91 {profile.phone}
              </span>
              <Lock size={16} strokeWidth={1.75} color="var(--color-text-muted)" />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center border-none cursor-pointer"
          style={{
            minHeight: 52,
            borderRadius: 16,
            background: "var(--color-ink)",
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: 600,
            opacity: saving ? 0.6 : 1,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>

        {saveError && (
          <span className="text-sm leading-5 text-center" style={{ color: "var(--color-status-cancelled)" }}>
            {saveError}
          </span>
        )}
        {saved && !saveError && (
          <span className="text-sm leading-5 text-center" style={{ color: "var(--color-text-secondary)" }}>
            Saved.
          </span>
        )}

        <div className="flex flex-col" style={{ gap: 10 }}>
          <NavRow icon={CalendarDays} label="My appointments" onClick={() => navigate("/appointments")} />
          <NavRow icon={FileText} label="Prescriptions" onClick={() => navigate("/prescriptions/anitha-raghavan")} />
        </div>
      </div>

      <div className="flex-none" style={{ paddingTop: 20 }}>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center cursor-pointer"
          style={{
            minHeight: 48,
            borderRadius: 16,
            background: "var(--color-surface-subtle)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-primary)",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Log out
        </button>
      </div>
    </Screen>
  );
}
