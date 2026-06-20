import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, fmt = "MMM d, yyyy") {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt);
}

export function formatDateTime(date: Date | string) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy h:mm a");
}

export function timeAgo(date: Date | string) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat("en-IN").format(num);
}

export function generateEmployeeId(count: number) {
  return `EMP${String(count + 1).padStart(4, "0")}`;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, len: number) {
  return str.length > len ? str.slice(0, len) + "…" : str;
}

export function capitalizeFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
}

export function fileSizeLabel(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

export function getFileIcon(ext: string) {
  const map: Record<string, string> = {
    pdf: "📄",
    doc: "📝",
    docx: "📝",
    xls: "📊",
    xlsx: "📊",
    jpg: "🖼️",
    jpeg: "🖼️",
    png: "🖼️",
    zip: "🗜️",
    default: "📁",
  };
  return map[ext.toLowerCase()] ?? map.default;
}

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  HR_ADMIN: "hr_admin",
  EMPLOYEE: "employee",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const DEPARTMENTS = [
  "Engineering",
  "Human Resources",
  "Finance",
  "Marketing",
  "Operations",
  "Sales",
  "Design",
  "Legal",
  "Customer Support",
  "Management",
] as const;

export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Intern",
  "Freelance",
] as const;

export const LEAVE_TYPES = [
  "Casual",
  "Medical",
  "Emergency",
  "Paid",
  "Unpaid",
] as const;

export const LEAVE_STATUS = ["Pending", "Approved", "Rejected", "Cancelled"] as const;

export const TASK_STATUS = [
  "Pending",
  "In Progress",
  "Review",
  "Completed",
] as const;

export const NOTICE_PRIORITY = ["Low", "Normal", "Urgent", "Critical"] as const;

export const ATTENDANCE_STATUS = [
  "Present",
  "Absent",
  "Late",
  "Half Day",
  "Holiday",
  "Weekend",
] as const;
