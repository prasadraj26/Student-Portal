import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  query, where, orderBy, serverTimestamp, setDoc,
} from "firebase/firestore";
import { db, ensureAuth } from "../../firebase/config";

const ATTEMPTS = "attempts";
const PROGRESS = "studentProgress";

/** Client-side score calculation */
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
        if (given === correct) score += q.marks; break;
      case "numerical":
        if (parseFloat(given) === parseFloat(correct)) score += q.marks; break;
      case "shortAnswer":
      case "formula":
        if (given === correct) score += q.marks; break;
      default: break;
    }
  }
  return score;
};

/** Create or resume an attempt */
export const createAttempt = async ({ studentId, examId, totalMarks }) => {
  await ensureAuth();
  const existing = await getDocs(
    query(
      collection(db, ATTEMPTS),
      where("studentId", "==", studentId),
      where("examId",    "==", examId),
      where("status",    "==", "in_progress")
    )
  );
  if (!existing.empty) {
    const d = existing.docs[0];
    return { id: d.id, ...d.data() };
  }
  const ref = await addDoc(collection(db, ATTEMPTS), {
    studentId, examId, startedAt: serverTimestamp(),
    submittedAt: null, score: null, totalMarks,
    percentage: null, status: "in_progress", answers: [],
  });
  return { id: ref.id, studentId, examId, status: "in_progress", answers: [] };
};

/** Submit attempt with client-side scoring */
export const submitAttempt = async (attemptId, answers, questions, totalMarks) => {
  await ensureAuth();
  const score = calculateScore(answers, questions);
  const percentage = Math.round((score / totalMarks) * 100);
  await updateDoc(doc(db, ATTEMPTS, attemptId), {
    answers, score, totalMarks, percentage,
    status: "submitted", submittedAt: serverTimestamp(),
  });
  return { score, percentage };
};

/** Get a student's submitted attempts */
export const getStudentAttempts = async (studentId) => {
  await ensureAuth();
  const q = query(
    collection(db, ATTEMPTS),
    where("studentId", "==", studentId),
    where("status",    "==", "submitted")
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
};

/** Get a single attempt */
export const getAttemptById = async (attemptId) => {
  await ensureAuth();
  const snap = await getDoc(doc(db, ATTEMPTS, attemptId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/** Check if student already submitted an exam */
export const hasSubmitted = async (studentId, examId) => {
  await ensureAuth();
  const q = await getDocs(
    query(
      collection(db, ATTEMPTS),
      where("studentId", "==", studentId),
      where("examId",    "==", examId),
      where("status",    "==", "submitted")
    )
  );
  return !q.empty ? q.docs[0] : null;
};

/** Update student progress after submission */
export const updateStudentProgress = async (studentId, subjectId, result) => {
  await ensureAuth();
  const ref  = doc(db, PROGRESS, studentId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const prev = snap.data();
    const completedExams     = (prev.completedExams     || 0) + 1;
    const totalMarksObtained = (prev.totalMarksObtained || 0) + result.score;
    const totalMarksPossible = (prev.totalMarksPossible || 0) + result.totalMarks;
    const averagePercentage  = Math.round((totalMarksObtained / totalMarksPossible) * 100);
    const bySubject          = { ...(prev.bySubject || {}) };
    if (subjectId) {
      const s = bySubject[subjectId] || { obtained: 0, possible: 0, exams: 0 };
      bySubject[subjectId] = {
        obtained:   s.obtained + result.score,
        possible:   s.possible + result.totalMarks,
        exams:      s.exams + 1,
        percentage: Math.round(((s.obtained + result.score) / (s.possible + result.totalMarks)) * 100),
      };
    }
    await updateDoc(ref, { completedExams, totalMarksObtained, totalMarksPossible, averagePercentage, bySubject, lastUpdated: serverTimestamp() });
  } else {
    const bySubject = {};
    if (subjectId) bySubject[subjectId] = { obtained: result.score, possible: result.totalMarks, exams: 1, percentage: result.percentage };
    await setDoc(ref, { studentId, completedExams: 1, totalMarksObtained: result.score, totalMarksPossible: result.totalMarks, averagePercentage: result.percentage, bySubject, lastUpdated: serverTimestamp() });
  }
};

/** Get student progress */
export const getStudentProgress = async (studentId) => {
  await ensureAuth();
  const snap = await getDoc(doc(db, PROGRESS, studentId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
