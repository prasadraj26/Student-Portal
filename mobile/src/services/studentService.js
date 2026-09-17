import {
  collection, doc, getDoc, getDocs, query, where,
} from "firebase/firestore";
import { db, ensureAuth } from "../../firebase/config";

/** Look up a student by their ID (e.g. "10A01") */
export const getStudentById = async (studentId) => {
  if (!studentId) return null;
  await ensureAuth();
  const normalizedId = String(studentId).trim().toUpperCase();

  // 1. Direct document lookup by doc ID (canonical format: students/{studentId})
  const ref  = doc(db, "students", normalizedId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }

  // 2. Fallback query by studentId field (for legacy documents)
  const q = query(collection(db, "students"), where("studentId", "==", normalizedId));
  const querySnap = await getDocs(q);
  if (!querySnap.empty) {
    const d = querySnap.docs[0];
    return { id: d.id, ...d.data() };
  }

  return null;
};

