import { Outlet } from "react-router-dom";
import AppNavbar from "./AppNavbar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AppNavbar />
      <main className="relative">
        <Outlet />
      </main>
    </div>
  );
}
