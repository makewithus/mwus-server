import { Timestamp } from "firebase/firestore";

export type Role = "super_admin" | "hr_admin" | "employee";

export type EmploymentType = "Full-time" | "Part-time" | "Contract" | "Intern" | "Freelance";
export type Gender = "Male" | "Female" | "Other" | "Prefer not to say";
export type AttendanceStatus = "Present" | "Absent" | "Late" | "Half Day" | "Holiday" | "Weekend";
export type LeaveStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";
export type LeaveType = "Casual" | "Medical" | "Emergency" | "Paid" | "Unpaid";
export type TaskStatus = "Pending" | "In Progress" | "Review" | "Completed";
export type TaskPriority = "Low" | "Medium" | "High" | "Critical";
export type NoticePriority = "Low" | "Normal" | "Urgent" | "Critical";
export type DocumentVisibility = "Public" | "Department" | "Private";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: Role;
  companyId: string;
  employeeId?: string;
  department?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  forcePasswordReset?: boolean;
}

export interface Company {
  id: string;
  name: string;
  logoURL?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  workingHours: { start: string; end: string };
  weekends: number[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Department {
  id: string;
  companyId: string;
  name: string;
  headId?: string;
  employeeCount?: number;
  createdAt: Timestamp;
}

export interface Employee {
  id: string;
  companyId: string;
  employeeId: string;
  uid?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  photoURL?: string;
  dob?: string;
  gender?: Gender;
  address?: string;
  emergencyContact?: { name: string; phone: string; relation: string };
  department: string;
  designation: string;
  managerId?: string;
  joiningDate: string;
  employmentType: EmploymentType;
  salary: number;
  status: "Active" | "Inactive" | "Archived";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AttendanceRecord {
  id: string;
  companyId: string;
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  status: AttendanceStatus;
  workHours?: number;
  overtime?: number;
  location?: { lat: number; lng: number };
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface LeaveBalance {
  id: string;
  companyId: string;
  employeeId: string;
  year: number;
  casual: number;
  medical: number;
  emergency: number;
  paid: number;
  unpaid: number;
  usedCasual: number;
  usedMedical: number;
  usedEmergency: number;
  usedPaid: number;
  usedUnpaid: number;
}

export interface LeaveRequest {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  attachmentURL?: string;
  status: LeaveStatus;
  reviewedBy?: string;
  reviewComment?: string;
  reviewedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PayrollRecord {
  id: string;
  companyId: string;
  employeeId: string;
  month: number;
  year: number;
  basic: number;
  allowances: number;
  bonus: number;
  overtime: number;
  grossSalary: number;
  pf: number;
  tax: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  status: "Draft" | "Generated" | "Paid";
  payslipURL?: string;
  generatedBy?: string;
  generatedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DocumentFolder {
  id: string;
  companyId: string;
  name: string;
  parentId?: string;
  createdBy: string;
  createdAt: Timestamp;
  icon?: string;
}

export interface DocumentFile {
  id: string;
  companyId: string;
  folderId?: string;
  name: string;
  originalName: string;
  url: string;
  storagePath: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploaderName: string;
  department?: string;
  tags: string[];
  version: number;
  visibility: DocumentVisibility;
  isPinned: boolean;
  isFavorite: boolean;
  employeeId?: string;
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Notice {
  id: string;
  companyId: string;
  title: string;
  description: string;
  department?: string;
  priority: NoticePriority;
  attachmentURL?: string;
  publishDate: string;
  expiryDate?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  readBy: string[];
}

export interface Task {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  deadline?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: string;
  assignedToName: string;
  assignedBy: string;
  attachments?: string[];
  proofURL?: string;
  progress: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Notification {
  id: string;
  companyId: string;
  userId: string;
  title: string;
  message: string;
  type: "leave" | "payslip" | "task" | "document" | "attendance" | "notice" | "general";
  isRead: boolean;
  link?: string;
  createdAt: Timestamp;
}

export interface ActivityLog {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  entityId?: string;
  details?: string;
  createdAt: Timestamp;
}
