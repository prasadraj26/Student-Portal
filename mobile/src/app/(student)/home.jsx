import { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStudentById } from "../../services/studentService";
import { getPublishedExamsForClass } from "../../services/examService";
import { hasSubmitted } from "../../services/attemptService";
import { clearActiveFocus } from "../../utils/focusManagement";
import { colors, radius, spacing } from "../../constants/theme";

const STORAGE_KEY = "edu_portal_student_id";

export default function HomeScreen() {
  const router = useRouter();
  const [student,    setStudent]    = useState(null);
  const [exams,      setExams]      = useState([]);
  const [submitted,  setSubmitted]  = useState({});
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const id = await AsyncStorage.getItem(STORAGE_KEY);
      if (!id) { router.replace("/"); return; }
      const s = await getStudentById(id);
      if (!s) { router.replace("/"); return; }
      setStudent(s);
      const e = await getPublishedExamsForClass(s.classId);
      setExams(e);
      // Check which have been submitted
      const map = {};
      await Promise.all(
        e.map(async (exam) => {
          const attempt = await hasSubmitted(id, exam.id);
          map[exam.id] = attempt;
        })
      );
      setSubmitted(map);
    } catch (err) { Alert.alert("Error", err.message); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => {
        clearActiveFocus();
        await AsyncStorage.removeItem(STORAGE_KEY);
        router.replace("/");
      }},
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const available = exams.filter((e) => !submitted[e.id]);
  const completed = exams.filter((e) =>  submitted[e.id]);

  const renderExam = (exam, done) => {
    const attempt = submitted[exam.id];
    return (
      <TouchableOpacity
        key={exam.id}
        style={[styles.examCard, done && styles.examCardDone]}
        onPress={() => {
          clearActiveFocus();
          if (done && attempt) {
            router.push(`/result/${attempt.id}`);
          } else {
            router.push(`/exam/${exam.id}`);
          }
        }}
        activeOpacity={0.85}
      >
        <View style={styles.examCardLeft}>
          <View style={[styles.dot, { backgroundColor: done ? colors.success : colors.warning }]} />
        </View>
        <View style={styles.examCardBody}>
          <Text style={styles.examTitle}>{exam.title}</Text>
          <View style={styles.examMeta}>
            {Boolean(exam.subjectName) ? <Text style={styles.metaChip}>📚 {exam.subjectName}</Text> : null}
            <Text style={styles.metaChip}>⏱ {exam.durationMinutes} min</Text>
            <Text style={styles.metaChip}>📊 {exam.totalMarks} marks</Text>
          </View>
          {Boolean(done && attempt) ? (
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreText, { color: (attempt.percentage >= 40) ? colors.successText : colors.dangerText }]}>
                Score: {attempt.score}/{attempt.totalMarks} ({attempt.percentage}%)
              </Text>
              <Text style={[styles.resultPill, {
                backgroundColor: (attempt.percentage >= 40) ? colors.successBg : colors.dangerBg,
                color:           (attempt.percentage >= 40) ? colors.successText : colors.dangerText,
              }]}>
                {(attempt.percentage >= 40) ? "PASS" : "FAIL"}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.chevron, done && { color: colors.textMuted }]}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Student header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {student?.name?.split(" ")[0]} 👋</Text>
          <Text style={styles.studentId}>ID: {student?.studentId} &middot; Class {student?.className || student?.classId}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={() => (
          <>
            {/* Available */}
            <Text style={styles.sectionTitle}>
              Available Exams ({available.length})
            </Text>
            {available.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>No exams available right now.</Text>
                <Text style={styles.emptyHint}>Pull down to refresh.</Text>
              </View>
            ) : (
              available.map((e) => renderExam(e, false))
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                  Completed ({completed.length})
                </Text>
                {completed.map((e) => renderExam(e, true))}
              </>
            )}
          </>
        )}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}
            colors={[colors.primary]} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgSecondary },

  header: {
    backgroundColor: colors.primary,
    padding: 20, paddingTop: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  greeting:    { fontSize: 18, fontWeight: "700", color: "#fff" },
  studentId:   { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  logoutBtn:   { padding: 6 },
  logoutText:  { fontSize: 13, color: "rgba(255,255,255,0.7)" },

  sectionTitle: {
    fontSize: 13, fontWeight: "700", color: colors.textMuted,
    textTransform: "uppercase", letterSpacing: 0.5,
    marginBottom: 10,
  },

  examCard: {
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1, borderColor: colors.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  examCardDone: { opacity: 0.85 },
  examCardLeft: { marginRight: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  examCardBody: { flex: 1 },
  examTitle:  { fontSize: 15, fontWeight: "600", color: colors.textPrimary, marginBottom: 5 },
  examMeta:   { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  metaChip:   { fontSize: 11, color: colors.textMuted, backgroundColor: colors.bgSecondary,
                paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  scoreRow:   { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 8 },
  scoreText:  { fontSize: 13, fontWeight: "600" },
  resultPill: { fontSize: 10, fontWeight: "700", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  chevron:    { fontSize: 22, color: colors.primary, marginLeft: 8 },

  emptyBox:   { alignItems: "center", padding: 40 },
  emptyIcon:  { fontSize: 40, marginBottom: 10 },
  emptyText:  { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  emptyHint:  { fontSize: 13, color: colors.textMuted, marginTop: 4 },
});
