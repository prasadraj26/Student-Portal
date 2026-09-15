import { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStudentById } from "../services/studentService";
import { colors, radius, spacing } from "../constants/theme";

const STORAGE_KEY = "edu_portal_student_id";

export default function ConfirmScreen() {
  const router = useRouter();
  const { studentId } = useLocalSearchParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await getStudentById(studentId);
        setStudent(s);
      } catch (e) {
        Alert.alert("Error", "Failed to load student data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  const handleConfirm = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, studentId);
      router.replace("/(student)/home");
    } catch (e) {
      Alert.alert("Error", "Failed to save session.");
    }
  };

  const handleBack = () => router.back();

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.container}>
        <Text style={{ color: colors.danger, fontSize: 16 }}>Student not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{student.name?.[0]?.toUpperCase()}</Text>
      </View>

      <Text style={styles.title}>Is this you?</Text>
      <Text style={styles.subtitle}>Please confirm your identity before continuing.</Text>

      <View style={styles.card}>
        {[
          ["Student ID",  student.studentId],
          ["Full Name",   student.name],
          ["Class",       student.classId],
          ["Roll Number", String(student.rollNumber).padStart(2, "0")],
        ].map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
        <Text style={styles.confirmText}>Yes, that's me →</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
        <Text style={styles.backText}>Not me — go back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: colors.bgSecondary,
    padding: spacing.xl, alignItems: "center",
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
    marginTop: 24, marginBottom: 16,
  },
  avatarText:  { fontSize: 28, fontWeight: "700", color: "#fff" },
  title:       { fontSize: 22, fontWeight: "700", color: colors.textPrimary, letterSpacing: -0.3 },
  subtitle:    { fontSize: 14, color: colors.textMuted, marginTop: 6, marginBottom: 24, textAlign: "center" },

  card: {
    width: "100%", maxWidth: 400,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1, borderColor: colors.border,
    marginBottom: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  row: {
    flexDirection: "row", justifyContent: "space-between",
    padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowLabel: { fontSize: 13, color: colors.textMuted, fontWeight: "500" },
  rowValue: { fontSize: 14, color: colors.textPrimary, fontWeight: "600" },

  confirmBtn: {
    width: "100%", maxWidth: 400,
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: 15, alignItems: "center", marginBottom: 10,
  },
  confirmText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  backBtn:     { padding: 10, alignItems: "center" },
  backText:    { color: colors.textMuted, fontSize: 14 },
});
