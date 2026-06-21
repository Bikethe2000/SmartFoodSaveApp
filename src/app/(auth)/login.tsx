/**
 * app/(auth)/login.tsx
 */
import { useRouter } from "expo-router";
import { LoginScreen } from "../../auth/AuthScreens";
import React from "react";
export default function LoginPage() {
  const router = useRouter();
  return (
    <LoginScreen
      onLoginSuccess={() => router.replace("/(app)/dashboard" as any)}

      onNavigateSignup={() => router.push("/(auth)/signup" as any)}


    />
  );
}