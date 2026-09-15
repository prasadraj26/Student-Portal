import {
  collection, doc, getDocs, getDoc,
  setDoc, updateDoc, query, where,
  orderBy, serverTimestamp, getCountFromServer,
} from "firebase/firestore";
import { db } from "../firebase/config";

const COL = "students";
const studentsCol = collection(db, COL);

/** Auto-generate student ID: grade+section+roll (e.g. 10A01) */
export const generateStudentId = (classId, rollNumber) =>
  `${classId}${String(rollNumber).padStart(2, "0")}`;

/** Add a new student */
export const addStudent = async ({ name, classId, rollNumber }) => {
  const studentId = generateStudentId(classId, rollNumber);
  const ref = doc(db, COL, studentId);
  const snap = await getDoc(ref);
  if (snap.exists()) throw new Error(`Student ID ${studentId} already exists.`);
  await setDoc(ref, {
    studentId,
    name: name.trim(),
    classId,
    rollNumber: Number(rollNumber),
    active: true,
    createdAt: serverTimestamp(),
  });
  return studentId;
};

/** Get all students (optionally filtered) */
export const getStudents = async ({ classId, status } = {}) => {
  let q = studentsCol;
  const filters = [];
  if (classId) filters.push(where("classId", "==", classId));
  if (status === "active")   filters.push(where("active", "==", true));
  if (status === "inactive") filters.push(where("active", "==", false));
  if (filters.length) q = query(studentsCol, ...filters, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Get a single student by doc ID */
export const getStudentById = async (studentId) => {
  const snap = await getDoc(doc(db, COL, studentId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/** Get total student count */
export const getStudentCount = async (activeOnly = false) => {
  const q = activeOnly
    ? query(studentsCol, where("active", "==", true))
    : studentsCol;
  const snap = await getCountFromServer(q);
  return snap.data().count;
};

/** Update student fields */
export const updateStudent = async (studentId, data) => {
  const ref = doc(db, COL, studentId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

/** Soft-deactivate student (never hard-delete) */
export const deactivateStudent = async (studentId) => {
  const ref = doc(db, COL, studentId);
  await updateDoc(ref, { active: false, deactivatedAt: serverTimestamp() });
};

/** Re-activate student */
export const reactivateStudent = async (studentId) => {
  const ref = doc(db, COL, studentId);
  await updateDoc(ref, { active: true, reactivatedAt: serverTimestamp() });
};