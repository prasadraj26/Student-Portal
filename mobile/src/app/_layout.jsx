import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as theme from "../constants/theme";
const colors = theme.colors || {};

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle:     { backgroundColor: colors.primary },
          headerTintColor: "#fff",
          headerTitleStyle:{ fontWeight: "600", fontSize: 16 },
          contentStyle:    { backgroundColor: colors.bgSecondary },
          animation:       "slide_from_right",
        }}
      >
        <Stack.Screen name="index"   options={{ headerShown: false }} />
        <Stack.Screen name="confirm" options={{ title: "Confirm Identity", headerBackTitle: "Back" }} />
        <Stack.Screen name="(student)" options={{ headerShown: false }} />
        <Stack.Screen
          name="exam/[examId]/index"
          options={{ title: "Exam Instructions" }}
        />
        <Stack.Screen
          name="exam/[examId]/take"
          options={{ title: "Take Exam", headerBackVisible: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="result/[attemptId]"
          options={{ title: "Your Result", headerBackVisible: false }}
        />
      </Stack>
    </>
  );
}
