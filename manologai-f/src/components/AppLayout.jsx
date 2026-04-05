import { Outlet } from "react-router-dom";
import AppNavbar from "./AppNavbar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-black text-slate-100">
      <AppNavbar />
      <main className="relative">
        <Outlet />
      </main>
    </div>
  );
}
