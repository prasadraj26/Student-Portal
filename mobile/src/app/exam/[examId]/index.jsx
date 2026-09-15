import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getExamById, getQuestions } from "../../services/examService";
import { hasSubmitted } from "../../services/attemptService";
import { colors, radius, spacing } from "../../constants/theme";

const STORAGE_KEY = "edu_portal_student_id";

export default function ExamInstructions() {
  const router    = useRouter();
  const { examId } = useLocalSearchParams();
  const [exam,      setExam]      = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [already,   setAlready]   = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const studentId = await AsyncStorage.getItem(STORAGE_KEY);
        const [e, q, a] = await Promise.all([
          getExamById(examId),
          getQuestions(examId),
          hasSubmitted(studentId, examId),
        ]);
        setExam(e); setQuestions(q); setAlready(a);
      } catch (err) { Alert.alert("Error", err.message); }
      finally { setLoading(false); }
    };
    load();
  }, [examId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bgSecondary }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!exam) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><Text>Exam not found.</Text></View>;

  const qTypeCounts = questions.reduce((acc, q) => {
    acc[q.type] = (acc[q.type] || 0) + 1; return acc;
  }, {});

  const rules = [
    "Read each question carefully before answering.",
    "You cannot go back after submitting.",
    "The exam will auto-submit when the timer reaches zero.",
    "Ensure you have a stable internet connection.",
    already ? "⚠ You have already submitted this exam." : null,
  ].filter(Boolean);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}>
      {/* Exam header */}
      <View style={styles.examHeader}>
        <Text style={styles.examTitle}>{exam.title}</Text>
        <View style={styles.examMeta}>
          {exam.subjectName && <Text style={styles.metaItem}>📚 {exam.subjectName}</Text>}
          <Text style={styles.metaItem}>🏫 {exam.className}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { icon: "📝", label: "Questions", value: questions.length },
          { icon: "⏱",  label: "Duration",  value: `${exam.durationMinutes} min` },
          { icon: "📊", label: "Total Marks",value: exam.totalMarks },
        ].map(({ icon, label, value }) => (
          <View key={label} style={styles.statBox}>
            <Text style={styles.statIcon}>{icon}</Text>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Question types */}
      {Object.keys(qTypeCounts).length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Question Types</Text>
          {Object.entries(qTypeCounts).map(([type, count]) => {
            const labels = { mcq: "Multiple Choice", trueFalse: "True / False",
              shortAnswer: "Short Answer", numerical: "Numerical", formula: "Formula" };
            return (
              <View key={type} style={styles.typeRow}>
                <Text style={styles.typeLabel}>{labels[type] || type}</Text>
                <Text style={styles.typeCount}>{count}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Instructions */}
      {exam.instructions && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Instructions from Teacher</Text>
          <Text style={styles.instructionText}>{exam.instructions}</Text>
        </View>
      )}

      {/* Rules */}
      <View style={[styles.card, { borderColor: colors.warningBorder, backgroundColor: colors.warningBg }]}>
        <Text style={[styles.cardTitle, { color: colors.warningText }]}>⚠ Before You Start</Text>
        {rules.map((r, i) => (
          <Text key={i} style={[styles.rule, already && r.startsWith("⚠") && { color: colors.dangerText, fontWeight: "600" }]}>
            {i + 1}. {r}
          </Text>
        ))}
      </View>

      {/* Start button */}
      {already ? (
        <View style={styles.alreadyBox}>
          <Text style={styles.alreadyText}>You have already submitted this exam.</Text>
          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.success }]}
            onPress={() => router.push(`/result/${already.id}`)}>
            <Text style={styles.btnText}>View My Result →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push(`/exam/${examId}/take`)}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Start Exam →</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgSecondary },
  examHeader: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: 20, marginBottom: 16 },
  examTitle:  { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 6, lineHeight: 26 },
  examMeta:   { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaItem:   { fontSize: 13, color: "rgba(255,255,255,0.7)" },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statBox:  {
    flex: 1, backgroundColor: "#fff", borderRadius: radius.lg,
    padding: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border,
  },
  statIcon:  { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  card: {
    backgroundColor: "#fff", borderRadius: radius.lg,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginBottom: 10 },

  typeRow:   { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: colors.border },
  typeLabel: { fontSize: 13, color: colors.textSecondary },
  typeCount: { fontSize: 13, fontWeight: "700", color: colors.primary },

  instructionText: { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },

  rule: { fontSize: 13, color: colors.warningText, marginBottom: 5, lineHeight: 19 },

  alreadyBox: { alignItems: "center", gap: 12 },
  alreadyText:{ fontSize: 14, color: colors.dangerText, fontWeight: "500", textAlign: "center" },

  btn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: 15, alignItems: "center", marginTop: 4,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
