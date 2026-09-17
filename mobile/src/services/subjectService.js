import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db, ensureAuth } from "../../firebase/config";

const COL = "subjects";

/** Get a map of subjectId -> subject name */
export const getSubjectMap = async () => {
  await ensureAuth();
  const snap = await getDocs(collection(db, COL));
  const map = {};
  snap.docs.forEach((d) => {
    const data = d.data();
    map[d.id] = data.name || data.subjectName || data.title || d.id;
  });
  return map;
};

/** Get a single subject by ID */
export const getSubjectById = async (subjectId) => {
  await ensureAuth();
  if (!subjectId) return null;
  const snap = await getDoc(doc(db, COL, subjectId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { id: snap.id, name: data.name || data.subjectName || data.title || snap.id, ...data };
};
