import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import fs from 'fs';
import path from 'path';

// Parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  });
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  try {
    console.log("Signing in as Employee EMP1004...");
    const email = "emp1004@mwu-ems.app";
    const pass = "Ann@makewithusprojectMANAGEMENT1";
    
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const uid = cred.user.uid;
    console.log("Logged in. UID:", uid);
    
    // Attempt to query and update /employees doc
    console.log("Querying employee doc...");
    const empQ = query(collection(db, "employees"), where("employeeId", "==", "EMP1004"), where("uid", "==", uid));
    const empSnap = await getDocs(empQ);
    if (!empSnap.empty) {
      const docId = empSnap.docs[0].id;
      console.log("Found employee doc:", docId);
      console.log("Updating phone number...");
      await updateDoc(doc(db, "employees", docId), { phone: "+91 73061 793641", updatedAt: serverTimestamp() });
      console.log("Employee update successful!");
    } else {
      console.log("No employee doc found!");
    }

    // Attempt to update /users doc
    console.log("Updating users doc...");
    await updateDoc(doc(db, "users", uid), { phone: "+91 73061 793641", updatedAt: serverTimestamp() });
    console.log("User update successful!");
    
    process.exit(0);
  } catch (err) {
    console.error("Error during update:", err);
    process.exit(1);
  }
}

run();
