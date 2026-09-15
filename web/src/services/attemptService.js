import {
  collection, doc, getDocs, addDoc, getDoc,
  updateDoc, query, where, orderBy, serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";

const ATTEMPTS = "attempts";
const PROGRESS = "studentProgress";
const attemptsCol = collection(db, ATTEMPTS);

/* ─────────────────────────────────────────────
   CLIENT-SIDE SCORING
   ───────────────────────────────────────────── */
/**
 * Calculate score given student answers and exam questions.
 * answers: [{ questionId, value }]
 * questions: [{ id, type, correctAnswer, marks }]
 */
export const calculateScore = (answers, questions) => {
  let score = 0;
  for (const q of questions) {
    const ans = answers.find((a) => a.questionId === q.id);
    if (!ans || ans.value === "" || ans.value === null || ans.value === undefined) continue;
    const correct = String(q.correctAnswer).trim().toLowerCase();
    const given   = String(ans.value).trim().toLowerCase();
    switch (q.type) {
      case "mcq":
      case "trueFalse":
        if (given === correct) score += q.marks;
        break;
      case "numerical":
        if (parseFloat(given) === parseFloat(correct)) score += q.marks;
        break;
      case "shortAnswer":
      case "formula":
        if (given === correct) score += q.marks;
        break;
      default:
        break;
    }
  }
  return score;
};

/* ─────────────────────────────────────────────
   ATTEMPT CRUD
   ───────────────────────────────────────────── */

/** Create an attempt when student starts an exam */
export const createAttempt = async ({ studentId, examId, totalMarks }) => {
  // Prevent duplicate in-progress attempts
  const existing = await getDocs(
    query(attemptsCol,
      where("studentId", "==", studentId),
      where("examId", "==", examId),
      where("status", "==", "in_progress")
    )
  );
  if (!existing.empty) {
    const d = existing.docs[0];
    return { id: d.id, ...d.data() };
  }
  const ref = await addDoc(attemptsCol, {
    studentId,
    examId,
    startedAt: serverTimestamp(),
    submittedAt: null,
    score: null,
    totalMarks,
    percentage: null,
    status: "in_progress",
    answers: [],
  });
  return { id: ref.id };
};

/** Submit an attempt with client-side scoring */
export const submitAttempt = async (attemptId, answers, questions, totalMarks) => {
  const score = calculateScore(answers, questions);
  const percentage = Math.round((score / totalMarks) * 100);
  const ref = doc(db, ATTEMPTS, attemptId);
  await updateDoc(ref, {
    answers,
    score,
    totalMarks,
    percentage,
    status: "submitted",
    submittedAt: serverTimestamp(),
  });
  return { score, percentage };
};

/** Get all attempts for a given exam (teacher results view) */
export const getAttemptsByExam = async (examId) => {
  const q = query(attemptsCol, where("examId", "==", examId), orderBy("submittedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Get all attempts for a given student (progress view) */
export const getAttemptsByStudent = async (studentId) => {
  const q = query(attemptsCol, where("studentId", "==", studentId), orderBy("submittedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Get a single attempt */
export const getAttemptById = async (attemptId) => {
  const snap = await getDoc(doc(db, ATTEMPTS, attemptId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/* ─────────────────────────────────────────────
   STUDENT PROGRESS
   ───────────────────────────────────────────── */

/** Upsert studentProgress after an attempt is submitted */
export const updateStudentProgress = async (studentId, examId, subjectId, result) => {
  const ref = doc(db, PROGRESS, studentId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const prev = snap.data();
    const completedExams = (prev.completedExams || 0) + 1;
    const totalObtained  = (prev.totalMarksObtained || 0) + result.score;
    const totalPossible  = (prev.totalMarksPossible || 0) + result.totalMarks;
    const averagePercentage = Math.round((totalObtained / totalPossible) * 100);

    // Per-subject tracking
    const bySubject = { ...(prev.bySubject || {}) };
    if (subjectId) {
      const s = bySubject[subjectId] || { obtained: 0, possible: 0, exams: 0 };
      bySubject[subjectId] = {
        obtained: s.obtained + result.score,
        possible: s.possible + result.totalMarks,
        exams: s.exams + 1,
        percentage: Math.round(((s.obtained + result.score) / (s.possible + result.totalMarks)) * 100),
      };
    }

    await updateDoc(ref, {
      completedExams, totalMarksObtained: totalObtained,
      totalMarksPossible: totalPossible, averagePercentage,
      bySubject, lastUpdated: serverTimestamp(),
    });
  } else {
    const bySubject = {};
    if (subjectId) {
      bySubject[subjectId] = {
        obtained: result.score, possible: result.totalMarks,
        exams: 1, percentage: result.percentage,
      };
    }
    await setDoc(ref, {
      studentId,
      completedExams: 1,
      totalMarksObtained: result.score,
      totalMarksPossible: result.totalMarks,
      averagePercentage: result.percentage,
      bySubject,
      lastUpdated: serverTimestamp(),
    });
  }
};

/** Get student progress doc */
export const getStudentProgress = async (studentId) => {
  const snap = await getDoc(doc(db, PROGRESS, studentId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
