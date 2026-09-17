import {
  collection, doc, getDoc, getDocs, query, where, orderBy,
} from "firebase/firestore";
import { db, ensureAuth } from "../../firebase/config";

const EXAMS = "exams";

/** Get published exams assigned to a student's class */
export const getPublishedExamsForClass = async (classId) => {
  await ensureAuth();
  const q = query(
    collection(db, EXAMS),
    where("classId", "==", classId),
    where("status", "==", "published")
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

/** Get all exams (any status) for a class */
export const getAllExamsForClass = async (classId) => {
  await ensureAuth();
  const q = query(
    collection(db, EXAMS),
    where("classId", "==", classId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

/** Get a single exam by ID */
export const getExamById = async (examId) => {
  await ensureAuth();
  const snap = await getDoc(doc(db, EXAMS, examId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/** Get questions for an exam */
export const getQuestions = async (examId) => {
  await ensureAuth();
  const q = query(
    collection(db, EXAMS, examId, "questions"),
    orderBy("order"),
    orderBy("createdAt")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
