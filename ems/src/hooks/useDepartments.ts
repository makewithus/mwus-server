"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

const SEED_DEPARTMENTS = [
  "Developer",
  "Designer",
  "Project Manager",
  "Super Admin",
  "AI",
  "Marketing",
];


export function useDepartments() {
  const [departments, setDepartments] = useState<string[]>(SEED_DEPARTMENTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "categories"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.departments) && data.departments.length > 0) {
            setDepartments(data.departments);
          } else {
            setDepartments(SEED_DEPARTMENTS);
          }
        } else {
          // Seed the document on first use
          setDoc(doc(db, "settings", "categories"), { departments: SEED_DEPARTMENTS })
            .catch(() => {});
          setDepartments(SEED_DEPARTMENTS);
        }
        setLoading(false);
      },
      () => {
        setDepartments(SEED_DEPARTMENTS);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const addDepartment = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || departments.includes(trimmed)) return false;
    const next = [...departments, trimmed];
    await setDoc(doc(db, "settings", "categories"), { departments: next });
    return true;
  };

  const removeDepartment = async (name: string) => {
    const next = departments.filter((d) => d !== name);
    await setDoc(doc(db, "settings", "categories"), { departments: next });
  };

  return { departments, loading, addDepartment, removeDepartment };
}

// One-shot getter for use in non-reactive contexts
export { SEED_DEPARTMENTS };
