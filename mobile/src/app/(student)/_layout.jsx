import { Tabs } from "expo-router";
import { colors } from "../../constants/theme";

const TabIcon = ({ name, focused }) => {
  const icons = {
    home:     focused ? "🏠" : "🏡",
    progress: focused ? "📈" : "📉",
  };
  return null; // Using emoji labels below
};

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle:     { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle:{ fontWeight: "600" },
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: colors.border,
          paddingBottom: 4,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: "My Exams", tabBarLabel: "Exams", tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: "My Progress", tabBarLabel: "Progress", tabBarIcon: () => null }}
      />
    </Tabs>
  );
}
