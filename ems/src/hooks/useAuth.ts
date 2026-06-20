"use client";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/store/auth.store";

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Race fetchProfile against 3s timeout — Firestore must not block forever
        try {
          await Promise.race([
            store.fetchProfile(user.uid),
            new Promise<void>((resolve) => setTimeout(resolve, 3000)),
          ]);
        } catch {
          // fetchProfile errored — defaults already set inside fetchProfile
        }
        store.setUser(user);
        document.cookie = `ems-session=1; path=/; max-age=${60 * 60 * 24 * 7}`;
        store.setLoading(false);
        store.setInitialized(true);
      } else {
        document.cookie = "ems-session=; path=/; max-age=0";
        store.setUser(null);
        store.setLoading(false);
        store.setInitialized(true);
      }
    });
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return store;
}
