/**
 * migrateService.js
 * One-time migration: create canonical class + student documents
 * from legacy records with random Firestore auto-generated IDs.
 *
 * SAFE: does NOT delete old records. Idempotent.
 */

import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

const buildClassId   = (grade, section) => `${String(grade).trim()}${section.trim().toUpperCase()}`;
const buildStudentId = (classId, roll)  => `${classId}${String(roll).padStart(2, "0")}`;

export const runMigration = async (onProgress) => {
  const report = {
    classes:  { found: 0, alreadyCanonical: 0, legacy: 0, migrated: 0, conflicts: 0, errors: [] },
    students: { found: 0, alreadyCanonical: 0, legacy: 0, migrated: 0, conflicts: 0, errors: [] },
    legacyRecords: [],
  };

  const log = (msg) => { console.log("[migrate]", msg); onProgress?.(msg); };

  // ─── Phase 1: Classes ───
  log("Reading classes…");
  const classesSnap = await getDocs(collection(db, "classes"));
  report.classes.found = classesSnap.size;
  log(`Found ${classesSnap.size} class document(s).`);

  const classIdMap = {};

  for (const d of classesSnap.docs) {
    const data    = d.data();
    const grade   = String(data.grade   || "").trim();
    const section = String(data.section || "").trim().toUpperCase();
    if (!grade || !section) { log(`  SKIP class ${d.id} — missing grade/section`); continue; }

    const canonicalId      = buildClassId(grade, section);
    classIdMap[d.id]       = canonicalId;
    classIdMap[canonicalId] = canonicalId;

    if (d.id === canonicalId) {
      report.classes.alreadyCanonical++;
      log(`  OK   classes/${d.id} — already canonical`);
      continue;
    }

    report.classes.legacy++;
    const entry = { collection: "classes", oldId: d.id, newId: canonicalId, status: "" };
    const canonRef = doc(db, "classes", canonicalId);
    const existing = await getDoc(canonRef);

    if (existing.exists()) {
      entry.status = "conflict";
      report.classes.conflicts++;
      log(`  SKIP classes/${d.id} → ${canonicalId} — target already exists`);
      report.legacyRecords.push(entry);
      continue;
    }

    try {
      await setDoc(canonRef, {
        classId:      canonicalId,
        name:         data.name || `${grade} ${section}`,
        grade, section,
        active:       data.active ?? true,
        createdAt:    data.createdAt || serverTimestamp(),
        migratedFrom: d.id,
        migratedAt:   serverTimestamp(),
      });
      entry.status = "migrated";
      report.classes.migrated++;
      log(`  DONE classes/${d.id} → classes/${canonicalId}`);
    } catch (e) {
      entry.status = `error: ${e.message}`;
      report.classes.errors.push(`${d.id}: ${e.message}`);
      log(`  ERR  classes/${d.id}: ${e.message}`);
    }
    report.legacyRecords.push(entry);
  }

  // ─── Phase 2: Students ───
  log("Reading students…");
  const studentsSnap = await getDocs(collection(db, "students"));
  report.students.found = studentsSnap.size;
  log(`Found ${studentsSnap.size} student document(s).`);

  const classDocsSnap = await getDocs(collection(db, "classes"));
  const classNameMap  = {};
  for (const d of classDocsSnap.docs) {
    classNameMap[d.id] = d.data().name || d.id;
  }

  for (const d of studentsSnap.docs) {
    const data            = d.data();
    const rawClassId      = String(data.classId || "").trim();
    const rollNumber      = data.rollNumber;
    if (!rawClassId || rollNumber == null) { log(`  SKIP student ${d.id} — missing classId/rollNumber`); continue; }

    const canonicalClassId   = classIdMap[rawClassId] || rawClassId;
    const canonicalStudentId = buildStudentId(canonicalClassId, rollNumber);

    if (d.id === canonicalStudentId) {
      report.students.alreadyCanonical++;
      if (data.classId !== canonicalClassId) {
        log(`  FIX  students/${d.id} — updating classId field → ${canonicalClassId}`);
        try {
          await updateDoc(doc(db, "students", d.id), {
            classId:   canonicalClassId,
            className: classNameMap[canonicalClassId] || canonicalClassId,
          });
        } catch (e) { log(`  ERR  classId update on ${d.id}: ${e.message}`); }
      } else {
        log(`  OK   students/${d.id} — already canonical`);
      }
      continue;
    }

    report.students.legacy++;
    const entry    = { collection: "students", oldId: d.id, newId: canonicalStudentId, status: "" };
    const canonRef = doc(db, "students", canonicalStudentId);
    const existing = await getDoc(canonRef);

    if (existing.exists()) {
      entry.status = "conflict";
      report.students.conflicts++;
      log(`  SKIP students/${d.id} → ${canonicalStudentId} — target already exists`);
      report.legacyRecords.push(entry);
      continue;
    }

    try {
      await setDoc(canonRef, {
        studentId:    canonicalStudentId,
        name:         data.name || "",
        classId:      canonicalClassId,
        className:    classNameMap[canonicalClassId] || canonicalClassId,
        rollNumber:   Number(rollNumber),
        active:       data.active ?? true,
        createdAt:    data.createdAt || serverTimestamp(),
        migratedFrom: d.id,
        migratedAt:   serverTimestamp(),
      });
      entry.status = "migrated";
      report.students.migrated++;
      log(`  DONE students/${d.id} → students/${canonicalStudentId}`);
    } catch (e) {
      entry.status = `error: ${e.message}`;
      report.students.errors.push(`${d.id}: ${e.message}`);
      log(`  ERR  students/${d.id}: ${e.message}`);
    }
    report.legacyRecords.push(entry);
  }

  log("Migration complete.");
  return report;
};
