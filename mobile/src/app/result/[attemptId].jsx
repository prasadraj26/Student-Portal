import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getAttemptById } from "../../services/attemptService";
import { getExamById, getQuestions } from "../../services/examService";
import { clearActiveFocus } from "../../utils/focusManagement";
import * as theme from "../../constants/theme";

const colors  = theme.colors  || {};
const radius  = theme.radius  || {};
const spacing = theme.spacing || {};

export default function ResultScreen() {
  const router = useRouter();
  const { attemptId } = useLocalSearchParams();
  const [attempt,   setAttempt]   = useState(null);
  const [exam,      setExam]      = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showReview,setShowReview]= useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const a = await getAttemptById(attemptId);
        setAttempt(a);
        if (a?.examId) {
          const [e, q] = await Promise.all([getExamById(a.examId), getQuestions(a.examId)]);
          setExam(e); setQuestions(q);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
    return () => {
      clearActiveFocus();
    };
  }, [attemptId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bgSecondary }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!attempt) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><Text>Result not found.</Text></View>;

  const pass    = (attempt.percentage || 0) >= 40;
  const pct     = attempt.percentage || 0;

  const circleColor   = pass ? colors.success : colors.danger;
  const circleText    = pass ? "PASS" : "FAIL";
  const resultMessage = pass
    ? "Great job! You passed this exam."
    : "Keep practising! You can do better.";

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}>
      {/* Score hero */}
      <View style={[styles.hero, { borderColor: circleColor, borderWidth: 3 }]}>
        <View style={[styles.scoreCircle, { borderColor: circleColor }]}>
          <Text style={[styles.scoreNumber, { color: circleColor }]}>{pct}%</Text>
          <Text style={[styles.scoreLabel, { color: circleColor }]}>{circleText}</Text>
        </View>
        <Text style={styles.examTitle}>{exam?.title || "Exam"}</Text>
        <Text style={styles.resultMsg}>{resultMessage}</Text>
        <View style={styles.scoreDetail}>
          <Text style={styles.scoreDetailText}>
            {attempt.score} / {attempt.totalMarks} marks
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: "Correct",   value: questions.filter((q) => {
            const a = (attempt.answers || []).find((a) => a.questionId === q.id);
            if (!a) return false;
            const g = String(a.value).trim().toLowerCase();
            const c = String(q.correctAnswer).trim().toLowerCase();
            return q.type === "numerical" ? parseFloat(g) === parseFloat(c) : g === c;
          }).length, color: colors.successText },
          { label: "Incorrect", value: questions.filter((q) => {
            const a = (attempt.answers || []).find((a) => a.questionId === q.id);
            if (!a || !a.value) return true;
            const g = String(a.value).trim().toLowerCase();
            const c = String(q.correctAnswer).trim().toLowerCase();
            return q.type === "numerical" ? parseFloat(g) !== parseFloat(c) : g !== c;
          }).length, color: colors.dangerText },
          { label: "Total Qs",  value: questions.length, color: colors.primary },
        ].map(({ label, value, color }) => (
          <View key={label} style={styles.statBox}>
            <Text style={[styles.statVal, { color }]}>{value}</Text>
            <Text style={styles.statLbl}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Answer review */}
      <TouchableOpacity
        style={styles.reviewToggle}
        onPress={() => setShowReview((r) => !r)}
        activeOpacity={0.85}
      >
        <Text style={styles.reviewToggleText}>
          {showReview ? "Hide Answer Review ▲" : "View Answer Review ▼"}
        </Text>
      </TouchableOpacity>

      {showReview ? questions.map((q, i) => {
        const ans = (attempt.answers || []).find((a) => a.questionId === q.id);
        const givenVal = ans?.value ?? "";
        const given    = String(givenVal).trim().toLowerCase();
        const correct  = String(q.correctAnswer).trim().toLowerCase();
        const isCorrect = q.type === "numerical"
          ? parseFloat(given) === parseFloat(correct)
          : given === correct;
        return (
          <View key={q.id} style={[styles.reviewCard, {
            borderColor: isCorrect ? colors.successBorder : colors.dangerBorder,
            backgroundColor: isCorrect ? colors.successBg : colors.dangerBg,
          }]}>
            <Text style={[styles.reviewStatus, { color: isCorrect ? colors.successText : colors.dangerText }]}>
              {`${isCorrect ? "✓ Correct" : "✗ Incorrect"} — Q${i + 1} (${q.marks} mark${q.marks !== 1 ? "s" : ""})`}
            </Text>
            <Text style={styles.reviewQuestion}>{q.text}</Text>
            <Text style={styles.reviewAnswer}>
              {"Your answer: "}
              <Text style={{ fontWeight: "700" }}>{String(givenVal) || "No answer"}</Text>
            </Text>
            {!isCorrect ? (
              <Text style={[styles.reviewCorrect, { color: colors.successText }]}>
                {"Correct: "}
                <Text style={{ fontWeight: "700" }}>{q.correctAnswer}</Text>
              </Text>
            ) : null}
          </View>
        );
      }) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => {
            clearActiveFocus();
            router.replace("/(student)/home");
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.homeBtnText}>← Back to My Exams</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.bgSecondary },

  hero: {
    backgroundColor: "#fff", borderRadius: radius.xl,
    padding: 24, alignItems: "center",
    marginBottom: 16,
  },
  scoreCircle: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 4, alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  scoreNumber:  { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  scoreLabel:   { fontSize: 13, fontWeight: "700", letterSpacing: 1 },
  examTitle:    { fontSize: 18, fontWeight: "700", color: colors.textPrimary, textAlign: "center", marginBottom: 6 },
  resultMsg:    { fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 20 },
  scoreDetail:  { marginTop: 10, backgroundColor: colors.bgSecondary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 5 },
  scoreDetailText:{ fontSize: 14, fontWeight: "600", color: colors.textPrimary },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statBox: {
    flex: 1, backgroundColor: "#fff", borderRadius: radius.lg,
    padding: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border,
  },
  statVal: { fontSize: 24, fontWeight: "700" },
  statLbl: { fontSize: 12, color: colors.textMuted, marginTop: 3 },

  reviewToggle: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: 12, alignItems: "center", marginBottom: 12,
  },
  reviewToggleText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  reviewCard: {
    borderRadius: radius.md, borderWidth: 1,
    padding: 12, marginBottom: 8,
  },
  reviewStatus:   { fontSize: 12, fontWeight: "700", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.3 },
  reviewQuestion: { fontSize: 14, fontWeight: "600", color: colors.textPrimary, marginBottom: 4, lineHeight: 20 },
  reviewAnswer:   { fontSize: 13, color: colors.textSecondary },
  reviewCorrect:  { fontSize: 13, marginTop: 3 },

  actions: { marginTop: 16 },
  homeBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: 14, alignItems: "center",
  },
  homeBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
