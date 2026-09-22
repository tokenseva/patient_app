import { useEffect, useState } from "react";

// Below this width there isn't comfortable room for a centered iPhone-preview frame (bezel + margins),
// so the real mobile UI renders directly full-viewport instead. Intentionally smaller than a typical
// tablet breakpoint — this only needs to fit the phone preview, not a second "desktop layout".
const BREAKPOINT = 560;

export default function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < BREAKPOINT : true
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isMobile;
}
