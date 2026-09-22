import { ChevronLeft, User } from "lucide-react";
import IconButton from "./IconButton";

export default function ScreenHeader({
  onBack,
  title,
  subtitle,
  avatarInitials,
  showAccount = true,
  onAccount,
}) {
  return (
    <div className="flex-none px-5 pt-2 box-border">
      <div className="w-full mx-auto flex items-center gap-3" style={{ maxWidth: 430, minHeight: 44 }}>
        {onBack && (
          <IconButton icon={ChevronLeft} onClick={onBack} label="Back" strokeColor="#242522" />
        )}
        {avatarInitials ? (
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="flex-none flex items-center justify-center rounded-full font-semibold"
              style={{ width: 36, height: 36, background: "var(--color-surface-subtle)", fontSize: 13, color: "var(--color-text-primary)" }}
            >
              {avatarInitials}
            </div>
            <div className="min-w-0 flex flex-col">
              <span
                className="text-base leading-[22px] font-semibold tracking-[-0.01em] truncate"
                style={{ color: "var(--color-text-primary)" }}
              >
                {title}
              </span>
              {subtitle && (
                <span className="text-xs leading-4" style={{ color: "var(--color-text-muted)" }}>
                  {subtitle}
                </span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-base leading-[22px] font-semibold tracking-[-0.01em]" style={{ color: "var(--color-text-primary)" }}>
            {title}
          </span>
        )}
        <div className="flex-1" />
        {showAccount && (
          <IconButton icon={User} onClick={onAccount} label="Account" />
        )}
      </div>
    </div>
  );
}
