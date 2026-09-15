import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/config";

const studentsCollection = collection(db, "students");

// Generate Student ID
export const generateStudentId = (classId, rollNumber) => {
  return `${classId}${String(rollNumber).padStart(2, "0")}`;
};

// Add student
export const addStudent = async ({
  name,
  classId,
  rollNumber,
}) => {
  const studentId = generateStudentId(classId, rollNumber);

  const studentRef = doc(db, "students", studentId);

  await setDoc(studentRef, {
    studentId,
    name: name.trim(),
    classId,
    rollNumber: Number(rollNumber),
    active: true,
    createdAt: serverTimestamp(),
  });

  return studentId;
};

// Get all students
export const getStudents = async () => {
  const snapshot = await getDocs(studentsCollection);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Deactivate student
export const deactivateStudent = async (studentDocId) => {
  const studentRef = doc(db, "students", studentDocId);

  await updateDoc(studentRef, {
    active: false,
  });
};