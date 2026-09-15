import {
  collection, doc, getDoc, getDocs, query, where, orderBy,
} from "firebase/firestore";
import { db } from "../../firebase/config";

const EXAMS = "exams";

/** Get published exams assigned to a student's class */
export const getPublishedExamsForClass = async (classId) => {
  const q = query(
    collection(db, EXAMS),
    where("classId", "==", classId),
    where("status", "==", "published"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Get all exams (any status) for a class */
export const getAllExamsForClass = async (classId) => {
  const q = query(
    collection(db, EXAMS),
    where("classId", "==", classId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Get a single exam by ID */
export const getExamById = async (examId) => {
  const snap = await getDoc(doc(db, EXAMS, examId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/** Get questions for an exam */
export const getQuestions = async (examId) => {
  const q = query(
    collection(db, EXAMS, examId, "questions"),
    orderBy("order"),
    orderBy("createdAt")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
