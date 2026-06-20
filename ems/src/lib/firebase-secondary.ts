import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateEmail, updatePassword } from "firebase/auth";

const SECONDARY_APP_NAME = "ems-secondary";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Creates a Firebase Auth account for an employee using a synthetic email,
 * without disturbing the currently signed-in admin session.
 *
 * Synthetic email format: {employeeId.toLowerCase()}@mwu-ems.app
 * e.g. EMP0009 → emp0009@mwu-ems.app
 */
export async function createEmployeeAuth(
  employeeId: string,
  password: string
): Promise<{ uid: string; email: string }> {
  const email = `${employeeId.toLowerCase()}@mwu-ems.app`;

  // Reuse existing secondary app or create a new one
  const secondaryApp =
    getApps().find((a) => a.name === SECONDARY_APP_NAME) ||
    initializeApp(firebaseConfig, SECONDARY_APP_NAME);

  const secondaryAuth = getAuth(secondaryApp);

  let uid = "";
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    uid = cred.user.uid;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "auth/email-already-in-use") {
      try {
        // If the account exists, try to sign in to recover the UID
        // This handles cases where auth succeeded but Firestore write failed previously.
        const cred = await signInWithEmailAndPassword(secondaryAuth, email, password);
        uid = cred.user.uid;
      } catch {
        throw new Error("This Employee ID is already in use by another account.");
      }
    } else {
      throw error;
    }
  } finally {
    // Always sign out from secondary instance — primary admin session is unaffected
    await signOut(secondaryAuth);
  }

  return { uid, email };
}

export async function updateEmployeeAuth(
  oldEmployeeId: string,
  oldPassword: string,
  newEmployeeId: string,
  newPassword?: string
): Promise<{ email: string }> {
  const email = `${oldEmployeeId.toLowerCase()}@mwu-ems.app`;
  const newEmail = `${newEmployeeId.toLowerCase()}@mwu-ems.app`;

  const secondaryApp =
    getApps().find((a) => a.name === SECONDARY_APP_NAME) ||
    initializeApp(firebaseConfig, SECONDARY_APP_NAME);

  const secondaryAuth = getAuth(secondaryApp);

  try {
    const cred = await signInWithEmailAndPassword(secondaryAuth, email, oldPassword);
    
    if (email !== newEmail) {
      await updateEmail(cred.user, newEmail);
    }
    if (newPassword && newPassword.trim()) {
      await updatePassword(cred.user, newPassword);
    }
  } catch (error: unknown) {
    const err = error as Error;
    throw new Error(err.message || "Failed to update employee credentials.");
  } finally {
    await signOut(secondaryAuth);
  }

  return { email: newEmail };
}
