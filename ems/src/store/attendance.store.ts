"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

function todayStr() {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

interface AttendanceState {
  clockInTime: string | null;
  clockOutTime: string | null;
  clockInDate: string | null; // tracks which calendar day the clock-in belongs to
  clockIn: () => void;
  clockOut: () => void;
  continueWork: () => void;
  resetIfNewDay: () => void;
}

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
      clockInTime: null,
      clockOutTime: null,
      clockInDate: null,
      clockIn: () => {
        const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
        set({ clockInTime: now, clockOutTime: null, clockInDate: todayStr() });
      },
      clockOut: () => {
        const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
        set({ clockOutTime: now });
      },
      continueWork: () => set({ clockOutTime: null }),
      resetIfNewDay: () => {
        const { clockInDate } = get();
        if (clockInDate && clockInDate !== todayStr()) {
          // A new calendar day has started — reset the clock state
          set({ clockInTime: null, clockOutTime: null, clockInDate: null });
        }
      },
    }),
    {
      name: "ems-attendance",
    }
  )
);
