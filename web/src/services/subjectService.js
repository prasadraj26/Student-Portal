import {
  collection, doc, getDocs, addDoc,
  updateDoc, query, where, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

const COL = "subjects";
const subjectsCol = collection(db, COL);

/** Add a new subject */
export const addSubject = async ({ name }) => {
  const docRef = await addDoc(subjectsCol, {
    name: name.trim(),
    active: true,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

/** Get all subjects */
export const getSubjects = async () => {
  const q = query(subjectsCol, orderBy("name"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Get only active subjects */
export const getActiveSubjects = async () => {
  const q = query(subjectsCol, where("active", "==", true), orderBy("name"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Update subject */
export const updateSubject = async (subjectId, data) => {
  const ref = doc(db, COL, subjectId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

/** Soft-deactivate subject */
export const deactivateSubject = async (subjectId) => {
  const ref = doc(db, COL, subjectId);
  await updateDoc(ref, { active: false, deactivatedAt: serverTimestamp() });
};

/** Re-activate subject */
export const reactivateSubject = async (subjectId) => {
  const ref = doc(db, COL, subjectId);
  await updateDoc(ref, { active: true });
};
