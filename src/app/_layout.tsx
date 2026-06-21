/**
 * app/_layout.tsx
 *
 * Expo Router root layout.
 * - Wraps the whole app in AuthProvider
 * - Reads auth state and redirects to the right stack
 */
import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";

function RouteGuard() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router   = useRouter();

  useEffect(() => {
    console.log("[RouteGuard] Effect: loading=", loading, "user=", user?.email ?? null, "segments=", segments);
    
    if (loading) {
      console.log("[RouteGuard] Still loading, skipping redirect");
      return;
    }

    const inAuthGroup = String(segments[0] ?? "") === "(auth)";
    console.log("[RouteGuard] inAuthGroup=", inAuthGroup);

    if (!user && !inAuthGroup) {
      // Not signed in → go to login
      console.log("[RouteGuard] Redirecting to login");
      router.replace("/(auth)/login");
    } 
    else if (user && inAuthGroup) {
      // Signed in → go to dashboard
      console.log("[RouteGuard] Redirecting to dashboard");
      router.replace("/(app)/dashboard");
    } else {
      console.log("[RouteGuard] No redirect needed");
    }
  }, [user, loading, segments, router]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RouteGuard />
    </AuthProvider>
  );
}