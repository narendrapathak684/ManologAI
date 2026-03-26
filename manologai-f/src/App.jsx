import { BrowserRouter, Routes, Route } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage";
import SignupPage from "./pages/SignupPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        {/* Placeholder routes for the future */}
        <Route path="/login" element={<div className="text-white p-8">Login Page (Coming Soon)</div>} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<div className="text-white p-8">Dashboard (Coming Soon)</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
