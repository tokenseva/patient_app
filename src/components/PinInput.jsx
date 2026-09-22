import { useEffect, useRef } from "react";

export default function PinInput({ value, onChange, length = 6, autoFocus = false }) {
  const inputRefs = useRef([]);

  // autoFocus is a mount-only HTML attribute, but this component stays mounted while its
  // parent just toggles visibility (the Collapse grid-rows trick) — so react to autoFocus
  // changing instead of relying on the initial-mount attribute.
  useEffect(() => {
    if (autoFocus) inputRefs.current[0]?.focus();
  }, [autoFocus]);

  const setDigitAt = (index, digit) => {
    const chars = value.padEnd(length, " ").split("");
    chars[index] = digit;
    onChange(chars.join("").trimEnd());
  };

  const handleChange = (index, e) => {
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    setDigitAt(index, digit);
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!digits) return;
    e.preventDefault();
    onChange(digits);
    inputRefs.current[Math.min(digits.length, length - 1)]?.focus();
  };

  return (
    <div className="flex items-center gap-2.5">
      {Array.from({ length }).map((_, i) => {
        const digit = value[i] || "";
        return (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className="flex-1 min-w-0 text-center outline-none"
            style={{
              height: 56,
              fontSize: 20,
              fontWeight: 600,
              color: "var(--color-text-primary)",
              background: "var(--color-surface-subtle)",
              border: digit ? "1.5px solid var(--color-ink)" : "1.5px solid transparent",
              borderRadius: 14,
              transition: "border-color 150ms ease-out",
            }}
          />
        );
      })}
    </div>
  );
}
