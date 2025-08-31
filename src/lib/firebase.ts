import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore, connectFirestoreEmulator,
  collection, onSnapshot, orderBy, query, addDoc, Firestore
} from "firebase/firestore";
import {
  getAuth, signInAnonymously, connectAuthEmulator, Auth
} from "firebase/auth";

export function initFirebase() {
  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      });

  const db = getFirestore(app);
  const auth = getAuth(app);

  // Optional: if you want to run with emulators locally, set NEXT_PUBLIC_USE_EMULATORS=true
  if (process.env.NEXT_PUBLIC_USE_EMULATORS === "true") {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  }

  return { db, auth };
}

export async function ensureAnonAuth(auth: Auth) {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
}

export const resourcesCol = (db: Firestore) => collection(db, "ehrResources");
export const resourcesQuery = (db: Firestore) =>
  query(resourcesCol(db), orderBy("resource.metadata.fetchTime", "desc"));

export async function seedDemoDocs(db: Firestore, n = 15) {
  const resourceTypes = ["Observation", "MedicationRequest", "AllergyIntolerance", "Condition"];
  const states = [
    "PROCESSING_STATE_NOT_STARTED",
    "PROCESSING_STATE_PROCESSING",
    "PROCESSING_STATE_COMPLETED",
    "PROCESSING_STATE_FAILED",
  ] as const;

  const versions = ["FHIR_VERSION_R4", "FHIR_VERSION_R4B"] as const;

  const now = Date.now();
  for (let i = 0; i < n; i++) {
    const created = new Date(now - Math.floor(Math.random() * 1000 * 60 * 60 * 24));
    const fetched = new Date(created.getTime() + Math.floor(Math.random() * 1000 * 60 * 60));
    const processed = Math.random() > 0.5 ? new Date(fetched.getTime() + 1000 * 60 * 5) : undefined;

    const wrapper = {
      resource: {
        metadata: {
          state: states[Math.floor(Math.random() * states.length)],
          createdTime: created.toISOString(),
          fetchTime: fetched.toISOString(),
          processedTime: processed?.toISOString(),
          identifier: {
            key: `res_${Math.random().toString(36).slice(2, 8)}`,
            uid: `u_${Math.random().toString(36).slice(2, 8)}`,
            patientId: `p_${Math.floor(Math.random() * 900000 + 100000)}`,
          },
          resourceType: resourceTypes[Math.floor(Math.random() * resourceTypes.length)],
          version: versions[Math.floor(Math.random() * versions.length)],
        },
        humanReadableStr:
          "Patient presented with mild symptoms; clinician advised monitoring and routine labs.",
        aiSummary:
          Math.random() > 0.3
            ? "AI: Summary indicates low risk; recommend follow-up in 2 weeks."
            : undefined,
      },
    };

    await addDoc(resourcesCol(db), wrapper as any);
  }
}
