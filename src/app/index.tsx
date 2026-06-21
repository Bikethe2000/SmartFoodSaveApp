/**
 * app/index.tsx
 *
 * Root index route - RouteGuard in _layout.tsx handles all redirects.
 * This component renders a placeholder while routing is determined.
 */
import { View, Text } from "react-native";

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F9FAFB" }}>
      <Text style={{ fontSize: 16, color: "#6B7280" }}>Loading...</Text>
    </View>
  );
}

