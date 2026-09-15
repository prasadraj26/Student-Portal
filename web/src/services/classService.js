import {
  collection, doc, getDocs, addDoc,
  updateDoc, query, where, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

const COL = "classes";
const classesCol = collection(db, COL);

/** Add a new class */
export const addClass = async ({ name, grade, section }) => {
  const docRef = await addDoc(classesCol, {
    name: name.trim(),
    grade: String(grade),
    section: section.trim().toUpperCase(),
    active: true,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

/** Get all classes */
export const getClasses = async () => {
  const q = query(classesCol, orderBy("grade"), orderBy("section"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Get only active classes */
export const getActiveClasses = async () => {
  const q = query(
    classesCol,
    where("active", "==", true),
    orderBy("grade"),
    orderBy("section")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Update class */
export const updateClass = async (classId, data) => {
  const ref = doc(db, COL, classId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

/** Soft-deactivate class */
export const deactivateClass = async (classId) => {
  const ref = doc(db, COL, classId);
  await updateDoc(ref, { active: false, deactivatedAt: serverTimestamp() });
};

/** Re-activate class */
export const reactivateClass = async (classId) => {
  const ref = doc(db, COL, classId);
  await updateDoc(ref, { active: true });
};
