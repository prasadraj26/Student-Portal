import { Platform } from "react-native";

/**
 * Clears active DOM focus on Web before screen unmounting, route navigation,
 * or modal display to ensure focus is not retained on descendants of views
 * that receive aria-hidden="true".
 */
export function clearActiveFocus() {
  if (
    Platform.OS === "web" &&
    typeof document !== "undefined" &&
    document.activeElement &&
    document.activeElement !== document.body
  ) {
    try {
      if (typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }
    } catch (e) {
      // Ignore blur errors if element is already detached
    }
  }
}
