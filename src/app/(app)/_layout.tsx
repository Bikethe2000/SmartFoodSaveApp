import { Stack, useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";

export default function AppLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/(auth)/login" as any);
    }
  }, [user, loading, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
