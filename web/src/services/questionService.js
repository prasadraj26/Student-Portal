import {
  collection, doc, getDocs, addDoc,
  updateDoc, deleteDoc, query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

/** Question sub-collection path */
const questionsCol = (examId) =>
  collection(db, "exams", examId, "questions");

/** Add a question to an exam */
export const addQuestion = async (examId, data) => {
  const ref = await addDoc(questionsCol(examId), {
    type: data.type,               // mcq | trueFalse | shortAnswer | numerical | formula
    text: data.text.trim(),
    options: data.options || null, // MCQ only: ["A","B","C","D"]
    correctAnswer: data.correctAnswer,
    marks: Number(data.marks) || 1,
    order: data.order || 0,
    // Reserved for future types (image, match, fill-in-the-blank):
    imageUrl: data.imageUrl || null,
    matchPairs: data.matchPairs || null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

/** Get all questions for an exam, ordered */
export const getQuestions = async (examId) => {
  const q = query(questionsCol(examId), orderBy("order"), orderBy("createdAt"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Update a question */
export const updateQuestion = async (examId, questionId, data) => {
  const ref = doc(db, "exams", examId, "questions", questionId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

/** Delete a question */
export const deleteQuestion = async (examId, questionId) => {
  const ref = doc(db, "exams", examId, "questions", questionId);
  await deleteDoc(ref);
};

/** Batch-update order for multiple questions */
export const reorderQuestions = async (examId, orderedIds) => {
  const updates = orderedIds.map((id, index) => {
    const ref = doc(db, "exams", examId, "questions", id);
    return updateDoc(ref, { order: index });
  });
  await Promise.all(updates);
};
