"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile, Role } from "@/types";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  role: Role | null;
  companyId: string | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ role: Role }>;
  signOut: () => Promise<void>;
  sendReset: (email: string) => Promise<void>;
  fetchProfile: (uid: string) => Promise<{ role: Role }>;
  setUser: (user: User | null) => void;
  setLoading: (v: boolean) => void;
  setInitialized: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      role: null,
      companyId: null,
      loading: true,
      initialized: false,

      signIn: async (email, password) => {
        set({ loading: true });
        const cred = await signInWithEmailAndPassword(auth, email, password);
        
        // Fetch profile to get the actual role
        let resolvedRole: Role = "employee";
        try {
          const result = await get().fetchProfile(cred.user.uid);
          resolvedRole = result.role;
        } catch {
          // If Firestore unavailable, default to employee (safe)
          set({ role: "employee" as Role, companyId: null });
          resolvedRole = "employee";
        }
        
        // Set cookie immediately — middleware allows /dashboard
        document.cookie = `ems-session=1; path=/; max-age=${60 * 60 * 24 * 7}`;
        document.cookie = `ems-role=${resolvedRole}; path=/; max-age=${60 * 60 * 24 * 7}`;
        
        set({ user: cred.user, loading: false, initialized: true });
        return { role: resolvedRole };
      },

      signOut: async () => {
        // Synchronously reset state and session cookie to navigate instantly
        set({ user: null, profile: null, role: null, companyId: null });
        document.cookie = "ems-session=; path=/; max-age=0";
        document.cookie = "ems-role=; path=/; max-age=0";
        // Trigger Firebase signout asynchronously in the background
        firebaseSignOut(auth).catch((err) => console.error("Firebase signout error:", err));
      },

      sendReset: async (email) => {
        await sendPasswordResetEmail(auth, email);
      },

      fetchProfile: async (uid) => {
        try {
          const snap = await getDoc(doc(db, "users", uid));
          if (snap.exists()) {
            const profile = snap.data() as UserProfile;
            set({ profile, role: profile.role, companyId: profile.companyId });
            return { role: profile.role };
          } else {
            // No Firestore profile — this is likely the very first admin setup
            // Only create a super_admin profile if the email matches the Firebase Auth admin account
            const currentUser = auth.currentUser;
            const defaultProfile = {
              uid,
              email: currentUser?.email ?? "",
              displayName: currentUser?.displayName ?? currentUser?.email?.split("@")[0] ?? "Admin",
              role: "super_admin" as Role,
              companyId: "default",
              employeeId: "",
              isActive: true,
            };
            try {
              await setDoc(doc(db, "users", uid), {
                ...defaultProfile,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
              set({ profile: defaultProfile as UserProfile, role: "super_admin" as Role, companyId: "default" });
              return { role: "super_admin" as Role };
            } catch {
              // If profile creation fails, default to employee (safe fallback)
              set({ profile: null, role: "employee" as Role, companyId: null });
              return { role: "employee" as Role };
            }
          }
        } catch {
          // Firestore unavailable — default to employee (safe, not super_admin)
          set({ profile: null, role: "employee" as Role, companyId: null });
          return { role: "employee" as Role };
        }
      },

      setUser: (user) => set({ user }),
      setLoading: (v) => set({ loading: v }),
      setInitialized: (v) => set({ initialized: v }),
    }),
    {
      name: "ems-auth",
      partialize: (s) => ({ role: s.role, companyId: s.companyId }),
    }
  )
);
