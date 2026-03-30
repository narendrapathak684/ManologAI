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
import GlobalSaveAlert from "./components/GlobalSaveAlert";


function App() {
  return (
    <AuthProvider>
      <SaveAlertProvider>
        <BrowserRouter>
          <GlobalSaveAlert />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<WelcomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
            <Route path="/track" element={<ProtectedRoute><TrackPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/organise" element={<ProtectedRoute><OrganisePage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </SaveAlertProvider>
    </AuthProvider>
  );
}

export default App;
