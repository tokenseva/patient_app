import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, MapPin, User } from "lucide-react";
import { useApp } from "../context/AppContext";
import IconButton from "../components/IconButton";
import DoctorCard from "../components/DoctorCard";
import BottomNav from "../components/BottomNav";

export default function HomePage() {
  const { doctors, doctorsLoading, doctorsError } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.specialization ?? "").toLowerCase().includes(q) ||
        (d.clinic_name ?? "").toLowerCase().includes(q)
    );
  }, [doctors, query]);

  return (
    <div className="relative flex flex-col" style={{ height: "100dvh", background: "var(--color-bg)" }}>
      <div className="flex-none px-5 pt-2 box-border">
        <div className="w-full mx-auto flex flex-col" style={{ maxWidth: 430 }}>
          <div className="flex items-center justify-between gap-4" style={{ minHeight: 44 }}>
            <h2 className="m-0 text-2xl leading-[30px] font-semibold" style={{ letterSpacing: "-0.02em", color: "var(--color-text-primary)" }}>
              Find a doctor
            </h2>
            <div className="flex items-center gap-2.5">
              <IconButton icon={MapPin} label="Location" />
              <IconButton icon={User} label="Account" onClick={() => navigate("/profile")} />
            </div>
          </div>

          <div className="mt-[18px] flex items-center gap-3">
            <div
              className="flex-1 min-w-0 flex items-center gap-2.5 box-border"
              style={{ height: 52, padding: "0 16px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16 }}
            >
              <Search size={20} strokeWidth={1.75} color="#858680" className="flex-none" />
              <input
                type="text"
                placeholder="Cardiologist, skin, fever…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 min-w-0 h-full border-none outline-none bg-transparent text-base"
                style={{ color: "var(--color-text-primary)" }}
              />
            </div>
            <button
              type="button"
              aria-label="Filters"
              className="flex-none flex items-center justify-center cursor-pointer"
              style={{ width: 52, height: 52, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16 }}
            >
              <SlidersHorizontal size={20} strokeWidth={1.75} color="#242522" />
            </button>
          </div>

          <div className="mt-3.5 text-[13px] leading-[18px]" style={{ color: "var(--color-text-muted)" }}>
            {doctorsLoading ? "Loading doctors…" : `${filtered.length} doctors available this week`}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 box-border" style={{ paddingTop: 16, paddingBottom: 132 }}>
        <div className="w-full mx-auto flex flex-col" style={{ maxWidth: 430 }}>
          {doctorsLoading && (
            <div className="text-center text-sm py-10" style={{ color: "var(--color-text-muted)" }}>
              Loading doctors…
            </div>
          )}
          {!doctorsLoading && doctorsError && (
            <div className="text-center text-sm py-10" style={{ color: "var(--color-status-cancelled)" }}>
              Couldn't load doctors. Please try again.
            </div>
          )}
          {!doctorsLoading &&
            !doctorsError &&
            filtered.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} onBook={(id) => navigate(`/doctor/${id}`)} />
            ))}
          {!doctorsLoading && !doctorsError && filtered.length === 0 && (
            <div className="text-center text-sm py-10" style={{ color: "var(--color-text-muted)" }}>
              No doctors match your search.
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
