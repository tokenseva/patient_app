import { useEffect, useState } from "react";

// Sized to match this app's own design max-width (430px — see DESIGN_SYSTEM.md's frame spec) at a tall,
// modern-flagship aspect ratio, so it reads as an "iPhone Pro"-class device without ever scaling or
// stretching the real mobile layout away from the size it was actually designed at.
const FRAME_WIDTH = 430;
const FRAME_HEIGHT = 932;
const FRAME_RATIO = FRAME_WIDTH / FRAME_HEIGHT;
const BEZEL = 12;
const OUTER_RADIUS = 58;
const INNER_RADIUS = OUTER_RADIUS - BEZEL;
const VIEWPORT_MARGIN = 48; // breathing room kept around the frame on every side

function useViewportSize() {
  const [size, setSize] = useState(() =>
    typeof window !== "undefined"
      ? { width: window.innerWidth, height: window.innerHeight }
      : { width: FRAME_WIDTH, height: FRAME_HEIGHT }
  );

  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return size;
}

// Fits the frame inside the viewport (minus margin) while keeping its native aspect ratio, shrinking it
// on smaller desktop/tablet windows instead of ever letting the page itself scroll.
function fitFrameSize(viewportWidth, viewportHeight) {
  const availableHeight = Math.max(viewportHeight - VIEWPORT_MARGIN * 2, 320);
  const availableWidth = Math.max(viewportWidth - VIEWPORT_MARGIN * 2, 320);

  let height = Math.min(FRAME_HEIGHT, availableHeight);
  let width = height * FRAME_RATIO;

  const maxWidth = Math.min(FRAME_WIDTH, availableWidth);
  if (width > maxWidth) {
    width = maxWidth;
    height = width / FRAME_RATIO;
  }

  return { width, height };
}

export default function PhonePreviewFrame() {
  const { width: vw, height: vh } = useViewportSize();
  // Read once: the framed app keeps the top-level URL in sync as it navigates (PreviewUrlSync in
  // App.jsx), so this is whatever page was open before a reload. Never updated afterward —
  // changing an iframe's src would reload the app inside it.
  const [initialSrc] = useState(() => window.location.pathname + window.location.search);
  const { width, height } = fitFrameSize(vw, vh);

  return (
    <div
      className="flex items-center justify-center"
      style={{ height: "100dvh", width: "100vw", background: "var(--color-bg)", overflow: "hidden" }}
    >
      <div
        style={{
          width,
          height,
          padding: BEZEL,
          borderRadius: OUTER_RADIUS,
          background: "#0b0b0d",
          boxShadow: "0 30px 70px rgba(15,15,17,0.35), 0 10px 24px rgba(15,15,17,0.22)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: INNER_RADIUS,
            overflow: "hidden",
            background: "var(--color-surface)",
          }}
        >
          {/* Same app, same bundle, loaded in its own browsing context — this gives it a real
              viewport to size 100dvh against, so every mobile screen behaves exactly as it does
              full-viewport, with no CSS changes needed anywhere else. */}
          <iframe
            title="TokenSeva mobile preview"
            src={initialSrc}
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          />
        </div>
      </div>
    </div>
  );
}
