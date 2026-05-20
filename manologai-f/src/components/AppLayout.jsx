import { Outlet, useLocation } from "react-router-dom";
import AppNavbar from "./AppNavbar";
import MobileTabBar from "./MobileTabBar";
import {
  BookOpenText,
  ChartColumnBig,
  CheckCircle2,
  FolderKanban,
  LayoutDashboard,
  User } from
"lucide-react";

const navItems = [
{ label: "Today", icon: LayoutDashboard, to: "/dashboard" },
{ label: "Journal", icon: BookOpenText, to: "/journal" },
{ label: "Track", icon: CheckCircle2, to: "/track" },
{ label: "Analytics", icon: ChartColumnBig, to: "/analytics" },
{ label: "Organise", icon: FolderKanban, to: "/organise" },
{ label: "Profile", icon: User, to: "/profile" }];


export default function AppLayout() {
  return (
    <div className="min-h-screen bg-black text-slate-100">
      <AppNavbar />
      <main className="relative">
        <Outlet />
      </main>
      <MobileTabBar items={navItems} />
    </div>);

}