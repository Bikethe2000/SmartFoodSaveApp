/**
 * app/(app)/forgot-password.tsx
 * Password reset page
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Mail, ChevronLeft } from "lucide-react-native";

const COLORS = {
  primary: "#059669",
  bg: "#F9FAFB",
  card: "#FFFFFF",
  text: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  error: "#DC2626",
  success: "#16A34A",
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // TODO: Implement password reset API call
      // await api.sendPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reset Password</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {!sent ? (
            <>
              <View style={styles.iconBg}>
                <Mail size={48} color={COLORS.primary} />
              </View>

              <Text style={styles.title}>Forgot your password?</Text>
              <Text style={styles.subtitle}>
                No worries! Enter your email address and we&apos;ll send you a link to reset your
                password.
              </Text>

              {error && <View style={styles.errorBanner}>{/* <AlertCircle /> */}</View>}

              <View style={styles.field}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleReset}
                disabled={loading}
              >
                <Text style={styles.buttonText}>{loading ? "Sending..." : "Send Reset Link"}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.backLink}>Back to Login</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.successIconBg}>
                <Mail size={48} color={COLORS.success} />
              </View>

              <Text style={styles.successTitle}>Check your email!</Text>
              <Text style={styles.successSubtitle}>
                We&apos;ve sent a password reset link to{" "}
                <Text style={{ fontWeight: "600" }}>{email}</Text>
              </Text>

              <Text style={styles.infoText}>
                Click the link in the email to reset your password. If you don&apos;t see the
                email, check your spam folder.
              </Text>

              <TouchableOpacity style={styles.button} onPress={() => router.replace("/(auth)/login")}>
                <Text style={styles.buttonText}>Return to Login</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "rgba(5, 150, 105, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  successIconBg: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "rgba(22, 163, 74, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.success,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  successSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 18,
  },
  errorBanner: {
    width: "100%",
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  field: {
    width: "100%",
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.card,
  },
  button: {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  backLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
    textAlign: "center",
  },
});
