"use client";
import { useAuthStore } from "@/store/auth.store";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import EmployeeDashboard from "@/components/dashboard/EmployeeDashboard";

export default function DashboardPage() {
  const { role } = useAuthStore();
  const isAdmin = role === "super_admin" || role === "hr_admin";
  return isAdmin ? <AdminDashboard /> : <EmployeeDashboard />;
}
