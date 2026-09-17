import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStudentAttempts, getStudentProgress } from "../../services/attemptService";
import { getStudentById } from "../../services/studentService";
import { getExamById } from "../../services/examService";
import { getSubjectMap } from "../../services/subjectService";
import * as theme from "../../constants/theme";

const colors  = theme.colors  || {};
const radius  = theme.radius  || {};
const spacing = theme.spacing || {};

const STORAGE_KEY = "edu_portal_student_id";

export default function ProgressScreen() {
  const [student,    setStudent]    = useState(null);
  const [progress,   setProgress]   = useState(null);
  const [history,    setHistory]    = useState([]);
  const [subjectMap, setSubjectMap] = useState({});
  const [loading,    setLoading]    = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const id = await AsyncStorage.getItem(STORAGE_KEY);
      const [s, p, a, sMap] = await Promise.all([
        getStudentById(id),
        getStudentProgress(id),
        getStudentAttempts(id),
        getSubjectMap().catch(() => ({})),
      ]);
      setStudent(s);
      setProgress(p);
      setSubjectMap(sMap || {});

      const rich = await Promise.all(
        a.map(async (at) => {
          const exam = await getExamById(at.examId).catch(() => null);
          const resolvedSubject =
            exam?.subjectName ||
            (exam?.subjectId ? (sMap && sMap[exam.subjectId]) : null) ||
            null;
          return {
            ...at,
            examTitle: exam?.title,
            subjectName: resolvedSubject,
            subjectId: exam?.subjectId || at.subjectId,
          };
        })
      );
      setHistory(rich);
    } catch (err) {
      console.error("[Progress Load Error]", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const avg = progress?.averagePercentage ?? 0;
  const avgColor = avg >= 50 ? colors.successText : colors.dangerText;

  // Build subjectData with human-readable subject names
  const subjectData = progress?.bySubject
    ? Object.entries(progress.bySubject).map(([subjectId, d]) => {
        const matchedHistory = history.find((h) => h.subjectId === subjectId);
        const name =
          subjectMap[subjectId] ||
          matchedHistory?.subjectName ||
          subjectId;
        return { id: subjectId, name, ...d };
      })
    : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}>
      {/* Overview card */}
      <View style={styles.overviewCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{student?.name?.[0]?.toUpperCase() || ""}</Text>
          </View>
          <View>
            <Text style={styles.studentName}>{student?.name || ""}</Text>
            <Text style={styles.studentMeta}>
              {`${student?.studentId || ""} · Class ${student?.className || student?.classId || ""}`}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: "Exams Done",   value: `${progress?.completedExams ?? 0}` },
            { label: "Avg. Score",   value: `${avg}%`, color: avgColor },
            { label: "Marks",        value: `${progress?.totalMarksObtained ?? 0}/${progress?.totalMarksPossible ?? 0}` },
          ].map(({ label, value, color }) => (
            <View key={label} style={styles.statBox}>
              <Text style={[styles.statVal, { color: color || colors.textPrimary }]}>{value}</Text>
              <Text style={styles.statLbl}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Subject breakdown */}
      {subjectData.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Subject Performance</Text>
          {subjectData.map((s) => (
            <View key={s.id} style={styles.subjectCard}>
              <View style={styles.subjectHeader}>
                <Text style={styles.subjectName}>{s.name}</Text>
                <Text style={[styles.subjectPct, { color: (s.percentage ?? 0) >= 50 ? colors.successText : colors.dangerText }]}>
                  {`${s.percentage ?? 0}%`}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, {
                  width: `${Math.min(100, Math.max(0, s.percentage ?? 0))}%`,
                  backgroundColor: (s.percentage ?? 0) >= 50 ? colors.success : colors.danger,
                }]} />
              </View>
              <Text style={styles.subjectMeta}>
                {`${s.exams} exam${s.exams !== 1 ? "s" : ""} completed`}
              </Text>
              {(typeof s.percentage === "number" && s.percentage < 50) ? (
                <View style={styles.weakBadge}>
                  <Text style={styles.weakBadgeText}>⚠ Needs Improvement</Text>
                </View>
              ) : null}
            </View>
          ))}
        </>
      ) : null}

      {/* Exam history */}
      {history.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Exam History</Text>
          {history.map((at, i) => {
            const pass = (at.percentage || 0) >= 40;
            return (
              <View key={at.id} style={styles.historyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.histTitle}>{at.examTitle || `Exam ${i + 1}`}</Text>
                  {Boolean(at.subjectName) ? (
                    <Text style={styles.histSub}>{at.subjectName}</Text>
                  ) : null}
                </View>
                <View style={styles.histRight}>
                  <Text style={[styles.histScore, { color: pass ? colors.successText : colors.dangerText }]}>
                    {`${at.percentage ?? 0}%`}
                  </Text>
                  <Text style={[styles.histResult, {
                    backgroundColor: pass ? colors.successBg : colors.dangerBg,
                    color: pass ? colors.successText : colors.dangerText,
                  }]}>
                    {pass ? "PASS" : "FAIL"}
                  </Text>
                </View>
              </View>
            );
          })}
        </>
      ) : null}

      {(history.length === 0 && !loading) ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📈</Text>
          <Text style={styles.emptyText}>No results yet</Text>
          <Text style={styles.emptyHint}>Complete some exams to see your progress here.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgSecondary },

  overviewCard: {
    backgroundColor: colors.primary, borderRadius: radius.xl,
    padding: 20, marginBottom: 20,
  },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  avatarText:   { fontSize: 18, fontWeight: "700", color: "#fff" },
  studentName:  { fontSize: 16, fontWeight: "700", color: "#fff" },
  studentMeta:  { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 },

  statsRow: { flexDirection: "row", gap: 10 },
  statBox: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: radius.md, padding: 10, alignItems: "center",
  },
  statVal: { fontSize: 18, fontWeight: "700", color: "#fff" },
  statLbl: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 },

  sectionTitle: {
    fontSize: 13, fontWeight: "700", color: colors.textMuted,
    textTransform: "uppercase", letterSpacing: 0.5,
    marginBottom: 10,
  },

  subjectCard: {
    backgroundColor: "#fff", borderRadius: radius.lg,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  subjectHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  subjectName:   { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  subjectPct:    { fontSize: 14, fontWeight: "700" },
  progressTrack: { height: 6, backgroundColor: colors.bgSecondary, borderRadius: 3, marginBottom: 5, overflow: "hidden" },
  progressFill:  { height: "100%", borderRadius: 3 },
  subjectMeta:   { fontSize: 11, color: colors.textMuted },
  weakBadge: {
    marginTop: 6, backgroundColor: colors.dangerBg, borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start",
    borderWidth: 1, borderColor: colors.dangerBorder,
  },
  weakBadgeText: { fontSize: 11, fontWeight: "600", color: colors.dangerText },

  historyRow: {
    backgroundColor: "#fff", borderRadius: radius.md,
    padding: 12, marginBottom: 8, flexDirection: "row",
    alignItems: "center", borderWidth: 1, borderColor: colors.border,
  },
  histTitle: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  histSub:   { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  histRight: { alignItems: "flex-end", gap: 4 },
  histScore: { fontSize: 16, fontWeight: "700" },
  histResult:{ fontSize: 10, fontWeight: "700", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

  emptyBox: { alignItems: "center", padding: 40 },
  emptyIcon:{ fontSize: 40, marginBottom: 10 },
  emptyText:{ fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  emptyHint:{ fontSize: 13, color: colors.textMuted, marginTop: 4, textAlign: "center" },
});
