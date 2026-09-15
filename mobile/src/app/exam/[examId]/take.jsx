import { useEffect, useState, useRef, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal, Dimensions, ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getExamById, getQuestions } from "../../../services/examService";
import { createAttempt, submitAttempt, updateStudentProgress } from "../../../services/attemptService";
import { colors, radius, spacing } from "../../../constants/theme";

const STORAGE_KEY = "edu_portal_student_id";
const { width: SCREEN_W } = Dimensions.get("window");

/* ── Timer hook ── */
function useTimer(totalSeconds, onExpire) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const ref = useRef(null);

  useEffect(() => {
    ref.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(ref.current); onExpire(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, []);

  const pct = (remaining / totalSeconds) * 100;
  const color = pct > 50 ? colors.success : pct > 20 ? colors.warning : colors.danger;

  const fmt = () => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return { fmt: fmt(), color, pct, remaining };
}

/* ── Answer input per question type ── */
function AnswerInput({ question, value, onChange }) {
  switch (question.type) {
    case "mcq":
      return (
        <View style={styles.optionsGrid}>
          {["A","B","C","D"].map((letter, i) => (
            <TouchableOpacity
              key={letter}
              style={[styles.optionBtn, value === letter && styles.optionBtnSelected]}
              onPress={() => onChange(letter)}
              activeOpacity={0.8}
            >
              <View style={[styles.optionLetter, value === letter && styles.optionLetterSelected]}>
                <Text style={[styles.optionLetterText, value === letter && { color: "#fff" }]}>{letter}</Text>
              </View>
              <Text style={[styles.optionText, value === letter && styles.optionTextSelected]}>
                {question.options?.[i] || ""}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    case "trueFalse":
      return (
        <View style={styles.tfRow}>
          {["true", "false"].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.tfBtn, value === opt && (opt === "true" ? styles.tfBtnTrue : styles.tfBtnFalse)]}
              onPress={() => onChange(opt)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tfText, value === opt && { color: "#fff" }]}>
                {opt === "true" ? "✓ True" : "✗ False"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    case "numerical":
      return (
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholder="Enter number…"
          placeholderTextColor={colors.textMuted}
          returnKeyType="done"
        />
      );
    case "formula":
      return (
        <>
          <TextInput
            style={[styles.textInput, { fontSize: 16, letterSpacing: 1 }]}
            value={value}
            onChangeText={onChange}
            placeholder="e.g. x = 5"
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="done"
          />
          <Text style={styles.formulaHint}>Type your answer exactly (e.g. x = 5)</Text>
        </>
      );
    default: // shortAnswer
      return (
        <TextInput
          style={[styles.textInput, { height: 80 }]}
          value={value}
          onChangeText={onChange}
          placeholder="Type your answer…"
          placeholderTextColor={colors.textMuted}
          multiline
          textAlignVertical="top"
          returnKeyType="done"
        />
      );
  }
}

export default function TakeExamScreen() {
  const router   = useRouter();
  const { examId } = useLocalSearchParams();

  const [exam,       setExam]       = useState(null);
  const [questions,  setQuestions]  = useState([]);
  const [answers,    setAnswers]    = useState({});  // { questionId: value }
  const [attemptId,  setAttemptId]  = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal,  setShowModal]  = useState(false);

  const totalSeconds = useRef(0);

  useEffect(() => {
    const init = async () => {
      try {
        const studentId = await AsyncStorage.getItem(STORAGE_KEY);
        const [e, q] = await Promise.all([getExamById(examId), getQuestions(examId)]);
        setExam(e); setQuestions(q);
        totalSeconds.current = (e.durationMinutes || 60) * 60;
        const attempt = await createAttempt({ studentId, examId, totalMarks: e.totalMarks });
        setAttemptId(attempt.id);
        // Restore partial answers
        if (attempt.answers?.length) {
          const map = {};
          attempt.answers.forEach((a) => { map[a.questionId] = a.value; });
          setAnswers(map);
        }
      } catch (err) {
        Alert.alert("Error", err.message);
        router.back();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [examId]);

  const handleAutoSubmit = useCallback(() => {
    Alert.alert("Time's Up!", "Your exam will be submitted now.", [
      { text: "OK", onPress: () => doSubmit(true) },
    ]);
  }, [answers, questions]);

  const { fmt: timerDisplay, color: timerColor, pct: timerPct } = useTimer(
    totalSeconds.current || 3600,
    handleAutoSubmit
  );

  const setAnswer = (questionId, value) =>
    setAnswers((prev) => ({ ...prev, [questionId]: value }));

  const answeredCount = Object.values(answers).filter((v) => v !== "" && v !== null && v !== undefined).length;
  const unanswered    = questions.length - answeredCount;

  const doSubmit = async (auto = false) => {
    setSubmitting(true);
    try {
      const studentId = await AsyncStorage.getItem(STORAGE_KEY);
      const ansArray  = questions.map((q) => ({ questionId: q.id, value: answers[q.id] ?? "" }));
      const result    = await submitAttempt(attemptId, ansArray, questions, exam.totalMarks);
      await updateStudentProgress(studentId, exam.subjectId, { ...result, totalMarks: exam.totalMarks });
      router.replace(`/result/${attemptId}`);
    } catch (err) {
      Alert.alert("Submission Failed", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPress = () => {
    if (unanswered > 0) { setShowModal(true); return; }
    doSubmit();
  };

  if (loading || !exam) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bgSecondary }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textMuted }}>Loading exam…</Text>
      </View>
    );
  }

  const q = questions[currentIdx];
  const isFirst = currentIdx === 0;
  const isLast  = currentIdx === questions.length - 1;

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.questionCounter}>
          Q{currentIdx + 1} / {questions.length}
        </Text>
        {/* Timer */}
        <View style={[styles.timerPill, { backgroundColor: timerColor + "22", borderColor: timerColor }]}>
          <Text style={[styles.timerText, { color: timerColor }]}>⏱ {timerDisplay}</Text>
        </View>
        <TouchableOpacity
          style={styles.submitBtnSmall}
          onPress={handleSubmitPress}
          disabled={submitting}
        >
          <Text style={styles.submitBtnSmallText}>{submitting ? "…" : "Submit"}</Text>
        </TouchableOpacity>
      </View>

      {/* Question */}
      <ScrollView style={styles.questionArea} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140 }}>
        {/* Type badge */}
        <View style={[styles.typeBadge, {
          backgroundColor: colors.primary + "14", borderColor: colors.primary + "33",
        }]}>
          <Text style={[styles.typeBadgeText, { color: colors.primary }]}>
            {({ mcq: "MCQ", trueFalse: "True/False", shortAnswer: "Short Answer",
               numerical: "Numerical", formula: "Formula" })[q.type] || q.type}
            {" · "}{q.marks} mark{q.marks !== 1 ? "s" : ""}
          </Text>
        </View>

        <Text style={styles.questionText}>{q.text}</Text>

        <AnswerInput
          question={q}
          value={answers[q.id] ?? ""}
          onChange={(v) => setAnswer(q.id, v)}
        />
      </ScrollView>

      {/* Navigator */}
      <View style={styles.navigator}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
          {questions.map((_, i) => {
            const ans = answers[questions[i].id];
            const isAnswered = ans !== "" && ans !== null && ans !== undefined;
            const isCurrent  = i === currentIdx;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.navDot,
                  isCurrent  && styles.navDotCurrent,
                  isAnswered && !isCurrent && styles.navDotAnswered,
                ]}
                onPress={() => setCurrentIdx(i)}
              >
                <Text style={[styles.navDotText,
                  isCurrent  && { color: colors.primary, fontWeight: "700" },
                  isAnswered && !isCurrent && { color: "#fff" },
                ]}>{i + 1}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={styles.navBtns}>
          <TouchableOpacity
            style={[styles.navBtn, isFirst && styles.navBtnDisabled]}
            onPress={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={isFirst}
          >
            <Text style={[styles.navBtnText, isFirst && { color: colors.textMuted }]}>‹ Prev</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, isLast && styles.navBtnPrimary]}
            onPress={() => {
              if (isLast) handleSubmitPress();
              else setCurrentIdx((i) => Math.min(questions.length - 1, i + 1));
            }}
          >
            <Text style={[styles.navBtnText, isLast && { color: "#fff" }]}>
              {isLast ? "Finish" : "Next ›"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Unanswered warning modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>⚠ Unanswered Questions</Text>
            <Text style={styles.modalBody}>
              You have <Text style={{ fontWeight: "700", color: colors.dangerText }}>{unanswered}</Text>{" "}
              unanswered question{unanswered !== 1 ? "s" : ""}. Are you sure you want to submit?
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setShowModal(false)}>
                <Text style={styles.modalBtnSecText}>Review</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={() => { setShowModal(false); doSubmit(); }} disabled={submitting}>
                <Text style={styles.modalBtnPriText}>{submitting ? "Submitting…" : "Submit Anyway"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bgSecondary },

  topBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", padding: 10, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: 8,
  },
  questionCounter: { fontSize: 13, fontWeight: "700", color: colors.textPrimary, flex: 1 },
  timerPill: {
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1,
  },
  timerText:       { fontSize: 14, fontWeight: "700", fontVariant: ["tabular-nums"] },
  submitBtnSmall:  { backgroundColor: colors.primary, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  submitBtnSmallText:{ fontSize: 13, fontWeight: "600", color: "#fff" },

  questionArea: { flex: 1 },
  typeBadge: {
    alignSelf: "flex-start", borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 3, marginBottom: 12,
  },
  typeBadgeText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3, textTransform: "uppercase" },
  questionText:  { fontSize: 17, fontWeight: "600", color: colors.textPrimary, lineHeight: 26, marginBottom: 20 },

  /* MCQ */
  optionsGrid: { gap: 10 },
  optionBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 2, borderColor: colors.border,
    borderRadius: radius.md, padding: 12,
    backgroundColor: "#fff",
  },
  optionBtnSelected: { borderColor: colors.primary, backgroundColor: colors.primary + "08" },
  optionLetter: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.bgSecondary,
    alignItems: "center", justifyContent: "center",
  },
  optionLetterSelected: { backgroundColor: colors.primary },
  optionLetterText: { fontSize: 12, fontWeight: "700", color: colors.textPrimary },
  optionText:     { flex: 1, fontSize: 14, color: colors.textPrimary },
  optionTextSelected: { fontWeight: "600", color: colors.primary },

  /* True/False */
  tfRow: { flexDirection: "row", gap: 12 },
  tfBtn: {
    flex: 1, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border,
    padding: 16, alignItems: "center", backgroundColor: "#fff",
  },
  tfBtnTrue:  { borderColor: colors.success, backgroundColor: colors.successBg },
  tfBtnFalse: { borderColor: colors.danger,  backgroundColor: colors.dangerBg },
  tfText:     { fontSize: 16, fontWeight: "700", color: colors.textPrimary },

  /* Text inputs */
  textInput: {
    borderWidth: 1.5, borderColor: colors.borderStrong,
    borderRadius: radius.md, padding: 12, fontSize: 15,
    color: colors.textPrimary, backgroundColor: "#fff",
  },
  formulaHint: { fontSize: 12, color: colors.textMuted, marginTop: 6 },

  /* Navigator */
  navigator: {
    backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: colors.border,
    padding: 10, gap: 8,
    position: "absolute", bottom: 0, left: 0, right: 0,
  },
  navDot: {
    width: 32, height: 32, borderRadius: 6,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  navDotCurrent:  { borderColor: colors.primary, backgroundColor: colors.primary + "12" },
  navDotAnswered: { backgroundColor: colors.success, borderColor: colors.success },
  navDotText:     { fontSize: 11, fontWeight: "600", color: colors.textMuted },
  navBtns:        { flexDirection: "row", gap: 8 },
  navBtn: {
    flex: 1, borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.borderStrong, padding: 10, alignItems: "center",
    backgroundColor: "#fff",
  },
  navBtnDisabled: { borderColor: colors.border, opacity: 0.5 },
  navBtnPrimary:  { backgroundColor: colors.primary, borderColor: colors.primary },
  navBtnText:     { fontSize: 14, fontWeight: "600", color: colors.textPrimary },

  /* Modal */
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center", alignItems: "center", padding: 24,
  },
  modalBox: {
    backgroundColor: "#fff", borderRadius: radius.xl, padding: 24,
    width: "100%", maxWidth: 360,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginBottom: 10 },
  modalBody:  { fontSize: 14, color: colors.textSecondary, lineHeight: 21, marginBottom: 20 },
  modalBtns:  { flexDirection: "row", gap: 10 },
  modalBtnSecondary: {
    flex: 1, borderWidth: 1.5, borderColor: colors.borderStrong,
    borderRadius: radius.md, padding: 12, alignItems: "center",
  },
  modalBtnSecText: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  modalBtnPrimary: {
    flex: 1, backgroundColor: colors.danger,
    borderRadius: radius.md, padding: 12, alignItems: "center",
  },
  modalBtnPriText: { fontSize: 14, fontWeight: "600", color: "#fff" },
});
