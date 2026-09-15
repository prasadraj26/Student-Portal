import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { getStudentById } from "../services/studentService";
import { colors, radius, spacing } from "../constants/theme";

export default function WelcomeScreen() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [loading,   setLoading]   = useState(false);

  const handleContinue = async () => {
    const id = studentId.trim().toUpperCase();
    if (!id) { Alert.alert("Enter your Student ID", "Please type your Student ID to continue."); return; }
    setLoading(true);
    try {
      const student = await getStudentById(id);
      if (!student) {
        Alert.alert("Student Not Found", `No student found with ID "${id}". Please check and try again.`);
        return;
      }
      if (!student.active) {
        Alert.alert("Account Inactive", "Your account has been deactivated. Please contact your teacher.");
        return;
      }
      router.push({ pathname: "/confirm", params: { studentId: id } });
    } catch (e) {
      Alert.alert("Error", "Could not connect. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Hero section */}
      <View style={styles.hero}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>EP</Text>
        </View>
        <Text style={styles.appName}>EduPortal</Text>
        <Text style={styles.tagline}>Student Exam Platform</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Welcome! 👋</Text>
        <Text style={styles.cardSubtitle}>Enter your Student ID to access your exams and results.</Text>

        <Text style={styles.label}>Student ID</Text>
        <TextInput
          style={styles.input}
          value={studentId}
          onChangeText={setStudentId}
          placeholder="e.g. 10A01"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={10}
          returnKeyType="done"
          onSubmitEditing={handleContinue}
        />
        <Text style={styles.hint}>Format: Grade + Section + Roll (e.g. 10A01 = Grade 10, Section A, Roll 1)</Text>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.btnText}>Continue →</Text>
          }
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>EduPortal &middot; Teacher Administration Portal</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  hero: { alignItems: "center", marginBottom: 32 },
  logoBox: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 12,
  },
  logoText:    { fontSize: 22, fontWeight: "800", color: "#fff", letterSpacing: 1 },
  appName:     { fontSize: 24, fontWeight: "700", color: "#fff", letterSpacing: -0.3 },
  tagline:     { fontSize: 14, color: "rgba(255,255,255,0.55)", marginTop: 4 },

  card: {
    width: "100%", maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    shadowColor: "#000", shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25, shadowRadius: 24, elevation: 12,
  },
  cardTitle:    { fontSize: 22, fontWeight: "700", color: colors.textPrimary, marginBottom: 6, letterSpacing: -0.3 },
  cardSubtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 24, lineHeight: 20 },

  label: { fontSize: 13, fontWeight: "600", color: colors.textPrimary, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: colors.borderStrong,
    borderRadius: radius.md,
    padding: 12, fontSize: 18, fontWeight: "700",
    color: colors.textPrimary, backgroundColor: colors.bg,
    letterSpacing: 2, textAlign: "center",
    marginBottom: 6,
  },
  hint: { fontSize: 11, color: colors.textMuted, textAlign: "center", marginBottom: 20, lineHeight: 16 },

  btn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: 14, alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: "#fff", fontSize: 16, fontWeight: "600" },

  footer: { marginTop: 28, fontSize: 12, color: "rgba(255,255,255,0.35)" },
});
