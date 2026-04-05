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
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

function App() {
  return (
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
  );
}

export default App;
