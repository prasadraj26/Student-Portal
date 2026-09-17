import {
  collection, doc, getDocs, getDoc, setDoc,
  updateDoc, query, where, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

const COL = "classes";
const classesCol = collection(db, COL);

/**
 * Derive the deterministic application classId from grade + section.
 * e.g. grade="10", section="A" → classId="10A"
 */
export const buildClassId = (grade, section) =>
  `${String(grade).trim()}${section.trim().toUpperCase()}`;

/**
 * Derive the human-readable class name from grade + section.
 * e.g. grade="10", section="A" → "10 A"
 */
export const buildClassName = (grade, section) =>
  `${String(grade).trim()} ${section.trim().toUpperCase()}`;

/** Add a new class — uses deterministic classId as Firestore document ID */
export const addClass = async ({ grade, section }) => {
  const classId   = buildClassId(grade, section);
  const className = buildClassName(grade, section);
  const ref = doc(db, COL, classId);

  // Prevent duplicates: if doc already exists, throw a clear error
  const existing = await getDoc(ref);
  if (existing.exists()) {
    throw new Error(`Class ${className} (${classId}) already exists.`);
  }

  await setDoc(ref, {
    classId,
    name: className,
    grade: String(grade).trim(),
    section: section.trim().toUpperCase(),
    active: true,
    createdAt: serverTimestamp(),
  });
  return classId;
};

/**
 * Normalise a raw Firestore doc so classId is always available.
 * The Firestore document ID equals classId for new records.
 * For legacy records (created with addDoc), fall back to the stored
 * classId field or reconstruct it from grade+section.
 */
const normalise = (d) => {
  const data = d.data();
  const classId =
    data.classId ||
    (data.grade && data.section ? buildClassId(data.grade, data.section) : d.id);
  const name =
    data.name ||
    (data.grade && data.section ? buildClassName(data.grade, data.section) : classId);
  return { id: d.id, ...data, classId, name };
};

/** Get all classes */
export const getClasses = async () => {
  const q = query(classesCol, orderBy("grade"), orderBy("section"));
  const snap = await getDocs(q);
  return snap.docs.map(normalise);
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
  return snap.docs.map(normalise);
};

/** Update class fields — classId is the Firestore document ID */
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
