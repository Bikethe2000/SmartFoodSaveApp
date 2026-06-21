/**
 * app/(app)/about.tsx
 * About Us page
 */

import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Heart, Globe, Zap, Award, ChevronLeft } from "lucide-react-native";

const COLORS = {
  primary: "#059669",
  bg: "#F9FAFB",
  card: "#FFFFFF",
  text: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
};

export default function AboutPage() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroIcon}>
          <Text style={styles.heroEmoji}>🌱</Text>
        </View>
        <Text style={styles.heroTitle}>SmartFoodSave</Text>
        <Text style={styles.heroSubtitle}>
          Reducing food waste through AI-powered insights
        </Text>
      </View>

      {/* Mission Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Mission</Text>
        <Text style={styles.sectionText}>
          SmartFoodSave empowers schools and institutions to combat food waste through
          intelligent prediction and actionable insights. By leveraging machine learning, we help
          cafeteria staff optimize portions, reduce waste, and make a real impact on sustainability
          and climate action.
        </Text>
      </View>

      {/* Values Section */}
      <View style={styles.valuesSection}>
        <Text style={styles.sectionTitle}>Our Values</Text>

        <View style={styles.valueCard}>
          <View style={styles.valueIcon}>
            <Heart size={28} color={COLORS.primary} />
          </View>
          <View style={styles.valueContent}>
            <Text style={styles.valueTitle}>Sustainability</Text>
            <Text style={styles.valueDesc}>
              Every portion saved contributes to environmental conservation
            </Text>
          </View>
        </View>

        <View style={styles.valueCard}>
          <View style={styles.valueIcon}>
            <Zap size={28} color={COLORS.primary} />
          </View>
          <View style={styles.valueContent}>
            <Text style={styles.valueTitle}>Simplicity</Text>
            <Text style={styles.valueDesc}>
              Easy to use tools designed for real cafeteria staff
            </Text>
          </View>
        </View>

        <View style={styles.valueCard}>
          <View style={styles.valueIcon}>
            <Globe size={28} color={COLORS.primary} />
          </View>
          <View style={styles.valueContent}>
            <Text style={styles.valueTitle}>Impact</Text>
            <Text style={styles.valueDesc}>Making a difference one school at a time</Text>
          </View>
        </View>

        <View style={styles.valueCard}>
          <View style={styles.valueIcon}>
            <Award size={28} color={COLORS.primary} />
          </View>
          <View style={styles.valueContent}>
            <Text style={styles.valueTitle}>Innovation</Text>
            <Text style={styles.valueDesc}>
              Cutting-edge AI technology applied to real-world problems
            </Text>
          </View>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Built for Hackathon 2026</Text>
        <Text style={styles.sectionText}>
          SmartFoodSave was created for the USAII Global AI Hackathon 2026, bringing together
          innovative thinking and practical solutions to address food waste in educational
          institutions.
        </Text>
      </View>

      {/* Contact Section */}
      <View style={styles.contactSection}>
        <Text style={styles.sectionTitle}>Get in Touch</Text>
        <Text style={styles.contactText}>
          Have questions? Want to learn more about SmartFoodSave?
        </Text>
        <TouchableOpacity style={styles.contactButton} onPress={() => router.push("/(app)/contact")}>
          <Text style={styles.contactButtonText}>Contact Us</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 SmartFoodSave. All rights reserved.</Text>
      </View>
    </ScrollView>
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
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "rgba(5, 150, 105, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  heroEmoji: {
    fontSize: 48,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 22,
  },
  valuesSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  valueCard: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  valueIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "rgba(5, 150, 105, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  valueContent: {
    flex: 1,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  valueDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  contactSection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
  },
  contactText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  contactButton: {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
