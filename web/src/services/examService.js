import {
  collection, doc, getDocs, getDoc, addDoc,
  updateDoc, deleteDoc, query, where, orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { auth } from "../firebase/config";

const COL = "exams";
const examsCol = collection(db, COL);

/** Create a new exam (status = draft) */
export const createExam = async (data) => {
  const ref = await addDoc(examsCol, {
    title: data.title.trim(),
    subjectId: data.subjectId,
    subjectName: data.subjectName || "",
    classId: data.classId,
    className: data.className || "",
    durationMinutes: Number(data.durationMinutes),
    totalMarks: Number(data.totalMarks),
    status: "draft",
    startTime: data.startTime || null,
    endTime: data.endTime || null,
    instructions: data.instructions || "",
    createdBy: auth.currentUser?.uid || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

/** Get all exams */
export const getExams = async () => {
  const q = query(examsCol, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Get exams by class */
export const getExamsByClass = async (classId) => {
  const q = query(
    examsCol,
    where("classId", "==", classId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Get published exams for a class (student-facing) */
export const getPublishedExamsByClass = async (classId) => {
  const q = query(
    examsCol,
    where("classId", "==", classId),
    where("status", "==", "published"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Get a single exam */
export const getExamById = async (examId) => {
  const snap = await getDoc(doc(db, COL, examId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/** Update exam fields */
export const updateExam = async (examId, data) => {
  const ref = doc(db, COL, examId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

/** Publish exam (draft → published) */
export const publishExam = async (examId) => {
  const ref = doc(db, COL, examId);
  await updateDoc(ref, { status: "published", publishedAt: serverTimestamp(), updatedAt: serverTimestamp() });
};

/** Close exam (published → closed) */
export const closeExam = async (examId) => {
  const ref = doc(db, COL, examId);
  await updateDoc(ref, { status: "closed", closedAt: serverTimestamp(), updatedAt: serverTimestamp() });
};

/** Archive exam */
export const archiveExam = async (examId) => {
  const ref = doc(db, COL, examId);
  await updateDoc(ref, { status: "archived", updatedAt: serverTimestamp() });
};

/** Delete exam (hard delete — only allowed for drafts) */
export const deleteExam = async (examId) => {
  await deleteDoc(doc(db, COL, examId));
};
