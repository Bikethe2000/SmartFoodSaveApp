/**
 * app/(app)/index.tsx
 * Landing page for authenticated users
 */

import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import {
  Utensils,
  BarChart3,
  Sparkles,
  ClipboardList,
  Award,
} from "lucide-react-native";

const COLORS = {
  primary: "#059669",
  bg: "#F9FAFB",
  card: "#FFFFFF",
  text: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
};

export default function LandingPage() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        {/* Badge */}
        <View style={styles.badge}>
          <Award size={20} color={COLORS.primary} />
          <Text style={styles.badgeText}>Built for USAII Global AI Hackathon 2026</Text>
        </View>

        {/* Icon */}
        <View style={styles.heroIcon}>
          <Utensils size={48} color={COLORS.primary} />
        </View>

        {/* Title */}
        <Text style={styles.heroTitle}>Make Your Cafeteria Smarter</Text>
        <Text style={[styles.heroTitle, { color: COLORS.primary }]}>
          with AI‑Powered Food Waste Insights
        </Text>

        {/* Subtitle */}
        <Text style={styles.heroSubtitle}>
          SmartFoodSave helps schools predict food waste, optimize portions, and take meaningful
          action. Built for real cafeteria staff — simple, practical, and powered by machine
          learning.
        </Text>

        {/* CTA Button */}
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => router.push("/(app)/dashboard")}
        >
          <Text style={styles.buttonText}>Enter Dashboard</Text>
        </TouchableOpacity>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>How SmartFoodSave Supports Your Cafeteria</Text>

        {/* Feature 1 */}
        <View style={styles.featureCard}>
          <View style={styles.featureIconBg}>
            <BarChart3 size={28} color={COLORS.primary} />
          </View>
          <Text style={styles.featureTitle}>AI Predictions</Text>
          <Text style={styles.featureDesc}>
            Forecast daily food waste and portion needs using machine learning trained on your
            cafeteria&apos;s patterns.
          </Text>
        </View>

        {/* Feature 2 */}
        <View style={styles.featureCard}>
          <View style={styles.featureIconBg}>
            <Sparkles size={28} color={COLORS.primary} />
          </View>
          <Text style={styles.featureTitle}>Smart Recommendations</Text>
          <Text style={styles.featureDesc}>
            Get clear, actionable suggestions to reduce waste — from portion adjustments to menu
            insights.
          </Text>
        </View>

        {/* Feature 3 */}
        <View style={styles.featureCard}>
          <View style={styles.featureIconBg}>
            <ClipboardList size={28} color={COLORS.primary} />
          </View>
          <Text style={styles.featureTitle}>Daily Logging</Text>
          <Text style={styles.featureDesc}>
            Easily track prepared, served, and leftover portions to build accurate historical
            data.
          </Text>
        </View>
      </View>

      {/* CTA Section */}
      <View style={[styles.ctaSection, { backgroundColor: COLORS.primary }]}>
        <Text style={styles.ctaTitle}>Start Reducing Waste Today</Text>
        <Text style={styles.ctaSubtitle}>
          Join schools taking real climate action through simple, everyday decisions powered by
          AI.
        </Text>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => router.push("/(auth)/signup")}
        >
          <Text style={[styles.buttonText, { color: COLORS.primary }]}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(5, 150, 105, 0.1)",
    marginBottom: 24,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "rgba(5, 150, 105, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  featuresSection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    gap: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 20,
  },
  featureCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureIconBg: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "rgba(5, 150, 105, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  ctaSection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    marginBottom: 12,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
});
