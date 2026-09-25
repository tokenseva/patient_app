import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import useIsMobileViewport from "./hooks/useIsMobileViewport";
import PhonePreviewFrame from "./components/PhonePreviewFrame";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import DoctorDetailPage from "./pages/DoctorDetailPage";
import BookingPage from "./pages/BookingPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import CancelAppointmentPage from "./pages/CancelAppointmentPage";
import PrescriptionPage from "./pages/PrescriptionPage";
import ProfilePage from "./pages/ProfilePage";

function RequireAuth({ children }) {
  const { isLoggedIn } = useApp();
  if (!isLoggedIn) return <Navigate to="/" replace />;
  return children;
}

// Mirrors the doctor app's LoginRoute: a restored session skips the login screen. AuthGate below
// has already waited for authReady, so isLoggedIn is settled by the time this renders.
function LoginRoute() {
  const { isLoggedIn } = useApp();
  if (isLoggedIn) return <Navigate to="/home" replace />;
  return <LoginPage />;
}

// Only does anything inside PhonePreviewFrame's iframe: mirrors the iframe's current path onto
// the top-level URL, so a desktop reload reopens the same page instead of always "/". A no-op
// on a real phone (not framed), and harmless if the parent is ever cross-origin.
function PreviewUrlSync() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    if (window.parent === window) return;
    try {
      window.parent.history.replaceState(null, "", pathname + search);
    } catch {
      // cross-origin parent — nothing to sync
    }
  }, [pathname, search]);
  return null;
}

// Waits for the one-time session-restoration check (see AppContext) before rendering any
// route, so a page refresh doesn't briefly bounce a real, still-logged-in user to /.
function AuthGate() {
  const { authReady } = useApp();
  if (!authReady) return <div className="w-full" style={{ background: "var(--color-bg)", height: "100dvh" }} />;
  return <AppRoutes />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginRoute />} />
      <Route
        path="/home"
        element={
          <RequireAuth>
            <HomePage />
          </RequireAuth>
        }
      />
      <Route
        path="/doctor/:doctorId"
        element={
          <RequireAuth>
            <DoctorDetailPage />
          </RequireAuth>
        }
      />
      <Route
        path="/book/:doctorId"
        element={
          <RequireAuth>
            <BookingPage />
          </RequireAuth>
        }
      />
      <Route
        path="/confirmation"
        element={
          <RequireAuth>
            <ConfirmationPage />
          </RequireAuth>
        }
      />
      <Route
        path="/appointments"
        element={
          <RequireAuth>
            <AppointmentsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/appointments/:appointmentId/cancel"
        element={
          <RequireAuth>
            <CancelAppointmentPage />
          </RequireAuth>
        }
      />
      <Route
        path="/prescriptions/:doctorId"
        element={
          <RequireAuth>
            <PrescriptionPage />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const isMobile = useIsMobileViewport();

  if (!isMobile) return <PhonePreviewFrame />;

  return (
    <AppProvider>
      <BrowserRouter>
        <PreviewUrlSync />
        <div className="w-full mx-auto" style={{ maxWidth: 430 }}>
          <AuthGate />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
