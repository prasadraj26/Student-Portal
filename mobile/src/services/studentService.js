import {
  collection, doc, getDoc, getDocs, query, where, orderBy,
} from "firebase/firestore";
import { db } from "../../firebase/config";

/** Look up a student by their ID (e.g. "10A01") */
export const getStudentById = async (studentId) => {
  const ref  = doc(db, "students", studentId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
