import { BrowserRouter, Routes, Route } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import JournalPage from "./pages/JournalPage";
import TrackPage from "./pages/TrackPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import OrganisePage from "./pages/OrganisePage";
import ProfilePage from "./pages/ProfilePage";
import { AuthProvider } from "./context/AuthContext";
import { SaveAlertProvider } from "./context/SaveAlertContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import { useEffect } from "react";
import { checkAndTriggerReminders } from "./lib/NotificationService";

function App() {
  useEffect(() => {
    // Initial check on load
    checkAndTriggerReminders();

    // Check for due reminders every 60 seconds
    const interval = setInterval(() => {
      checkAndTriggerReminders();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <SaveAlertProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<WelcomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Protected Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/journal" element={<JournalPage />} />
                <Route path="/track" element={<TrackPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/organise" element={<OrganisePage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </SaveAlertProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
