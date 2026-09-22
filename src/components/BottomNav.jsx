import { Home as HomeIcon, CalendarDays } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const TABS = [
  { key: "doctors", label: "Doctors", icon: HomeIcon, path: "/home" },
  { key: "appointments", label: "Appointments", icon: CalendarDays, path: "/appointments" },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="absolute left-0 right-0 bottom-0 px-5 pointer-events-none" style={{ paddingTop: 16 }}>
      <div className="w-full mx-auto pointer-events-auto" style={{ maxWidth: 430 }}>
        <div
          className="flex items-stretch gap-2 rounded-[24px] p-2"
          style={{ background: "var(--color-surface)", boxShadow: "0 4px 16px rgba(36, 37, 34, 0.16)" }}
        >
          {TABS.map((tab) => {
            const active = location.pathname.startsWith(tab.path);
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => navigate(tab.path)}
                className="flex-1 flex flex-col items-center justify-center gap-1 rounded-[24px] border-none cursor-pointer"
                style={{
                  minHeight: 56,
                  background: active ? "var(--color-ink)" : "transparent",
                }}
              >
                <Icon size={22} strokeWidth={1.75} color={active ? "#FFFFFF" : "#9A988F"} />
                <span
                  className="text-xs leading-4"
                  style={{ fontWeight: active ? 600 : 400, color: active ? "#FFFFFF" : "#9A988F" }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ height: 34 }} />
      </div>
    </div>
  );
}
