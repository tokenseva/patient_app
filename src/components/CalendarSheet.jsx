import { X } from "lucide-react";
import IconButton from "./IconButton";
import { describeDate, monthGrid, monthLabel, toIso } from "../lib/date";

const WEEKDAY_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];

export default function CalendarSheet({ month, selectedIso, onSelect, onClose }) {
  const cells = monthGrid(month);
  const todayIso = toIso(new Date());

  return (
    <div
      className="absolute inset-0 flex items-end"
      style={{ background: "rgba(36, 37, 34, 0.36)", zIndex: 20 }}
      onClick={onClose}
    >
      <div
        className="w-full box-border"
        style={{
          background: "var(--color-surface)",
          borderRadius: "28px 28px 0 0",
          padding: "20px 20px 0",
          boxShadow: "0 -8px 30px rgba(36,37,34,0.12)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full mx-auto" style={{ maxWidth: 430 }}>
          <div className="flex items-center justify-between">
            <span className="text-lg leading-[22px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
              {monthLabel(month)}
            </span>
            <IconButton icon={X} onClick={onClose} label="Close calendar" size={36} strokeColor="#242522" />
          </div>

          <div className="mt-4 grid grid-cols-7" style={{ gap: "6px 4px" }}>
            {WEEKDAY_HEADERS.map((h, i) => (
              <div key={`${h}-${i}`} className="text-xs font-semibold text-center" style={{ color: "var(--color-text-muted)" }}>
                {h}
              </div>
            ))}
            {cells.map((date, i) => {
              if (!date) return <div key={`blank-${i}`} />;
              const iso = toIso(date);
              const isSelected = iso === selectedIso;
              const isPast = iso < todayIso;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={isPast}
                  onClick={() => onSelect(describeDate(date))}
                  className="flex items-center justify-center rounded-xl text-sm border-none cursor-pointer"
                  style={{
                    aspectRatio: "1",
                    background: isSelected ? "var(--color-ink)" : "transparent",
                    color: isPast ? "var(--color-text-faint)" : isSelected ? "#FFFFFF" : "var(--color-text-primary)",
                    fontWeight: isSelected ? 600 : 400,
                    opacity: isPast ? 0.4 : 1,
                    cursor: isPast ? "not-allowed" : "pointer",
                  }}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div style={{ height: 24 }} />
        </div>
      </div>
    </div>
  );
}
