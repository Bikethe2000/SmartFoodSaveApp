/**
 * app/(app)/predictions.tsx
 *
 * Ported from web Predictions.jsx.
 * Single-prediction form with date, menu item, portions, attendance,
 * preferred foods — returns waste prediction from the API.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";

import { BarChart2, Menu } from "lucide-react-native";
import { auth } from "../../firebase";
import SlideDrawer from "../../components/SlideDrawer";
import { useAuth } from "../../context/AuthContext";


// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  emerald600: "#059669",
  emerald700: "#047857",
  emerald50:  "#ECFDF5",
  emerald100: "#D1FAE5",
  indigo600:  "#4F46E5",
  indigo400:  "#818CF8",
  gray50:  "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray700: "#374151",
  gray900: "#111827",
  red50:   "#FEF2F2",
  red200:  "#FECACA",
  red600:  "#DC2626",
  yellow600: "#D97706",
  white:   "#FFFFFF",
};

const API_BASE = "https://foodwasteai-production.up.railway.app/api";

async function getToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

// ─── Shared components ────────────────────────────────────────────────────────
function FieldLabel({ text, optional }: { text: string; optional?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
      <Text style={s.label}>{text}</Text>
      {optional ? <Text style={s.labelOptional}>(optional)</Text> : null}
    </View>
  );
}

function StyledInput({
  value, onChange, placeholder, keyboardType, disabled, multiline,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address";
  disabled?: boolean;
  multiline?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      style={[s.input, focused && s.inputFocused, disabled && s.inputDisabled, multiline && { height: 80, textAlignVertical: "top" }]}
      value={value}
      onChangeText={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      placeholderTextColor={C.gray300}
      keyboardType={keyboardType ?? "default"}
      editable={!disabled}
      multiline={multiline}
      autoCapitalize="none"
      autoCorrect={false}
    />
  );
}

function RiskPill({ level }: { level: string }) {
  const bg    = level === "Low" ? C.emerald50  : level === "Medium" ? "#FFFBEB" : C.red50;
  const color = level === "Low" ? C.emerald700 : level === "Medium" ? C.yellow600 : C.red600;
  const dot   = level === "Low" ? C.emerald600 : level === "Medium" ? C.yellow600 : C.red600;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dot }} />
      <Text style={{ fontSize: 13, fontWeight: "700", color }}>{level} risk</Text>
    </View>
  );
}

interface PredictionResult {
  menuItemUsed: string;
  predictedWastePortions: number;
  riskLevel: string;
  historicalAvgLeftovers: number;
  explanation: string;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PredictionsScreen() {
  const { logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [date, setDate]                   = useState("");

  const [menuItem, setMenuItem]           = useState("");
  const [preparedPortions, setPrepared]   = useState("");
  const [attendance, setAttendance]       = useState("");
  const [preferredFoods, setPreferredFoods] = useState("");

  const [result, setResult]   = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handlePredict = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated.");

      // Validate required fields
      if (!preparedPortions || !attendance) {
        throw new Error("Please fill in Prepared Portions and Attendance.");
      }

      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: date || new Date().toISOString().split('T')[0],
          menu_item: menuItem.trim() || null,
          prepared_portions: Number(preparedPortions),
          attendance: Number(attendance),
          preferred_foods: preferredFoods
            ? preferredFoods.split(",").map(s => s.trim()).filter(Boolean)
            : null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? "Prediction failed.");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [date, menuItem, preparedPortions, attendance, preferredFoods]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.gray50 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={s.headerRow}>
          <TouchableOpacity
            onPress={() => setDrawerOpen(true)}
            style={s.menuBtn}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <Menu size={20} color={C.gray700} />
          </TouchableOpacity>

          <BarChart2 size={22} color={C.indigo600} />
          <View>
            <Text style={s.heading}>Food Waste Prediction</Text>

            <Text style={s.subheading}>Forecast waste for a specific day</Text>
          </View>
        </View>

        {/* Error */}
        {error ? (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Form card */}
        <View style={s.card}>
          <View style={{ gap: 16 }}>

            {/* Date */}
            <View>
              <FieldLabel text="Date" />
              <StyledInput
                value={date}
                onChange={setDate}
                placeholder="YYYY-MM-DD"
                disabled={loading}
              />
            </View>

            {/* Menu item */}
            <View>
              <FieldLabel text="Menu Item" optional />
              <StyledInput
                value={menuItem}
                onChange={setMenuItem}
                placeholder="e.g. Pasta"
                disabled={loading}
              />
            </View>

            {/* Preferred foods */}
            <View>
              <FieldLabel text="Preferred Foods" optional />
              <StyledInput
                value={preferredFoods}
                onChange={setPreferredFoods}
                placeholder="e.g. chicken, vegetarian"
                disabled={loading}
              />
            </View>

            {/* Portions + Attendance side by side */}
            <View style={s.twoCol}>
              <View style={{ flex: 1 }}>
                <FieldLabel text="Prepared Portions" />
                <StyledInput
                  value={preparedPortions}
                  onChange={setPrepared}
                  placeholder="e.g. 150"
                  keyboardType="numeric"
                  disabled={loading}
                />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel text="Attendance" />
                <StyledInput
                  value={attendance}
                  onChange={setAttendance}
                  placeholder="e.g. 120"
                  keyboardType="numeric"
                  disabled={loading}
                />
              </View>
            </View>
          </View>

          {/* Predict button */}
          <TouchableOpacity
            style={[s.predictBtn, loading && s.predictBtnDisabled]}
            onPress={handlePredict}
            disabled={loading}
            accessibilityRole="button"
          >
            {loading
              ? <ActivityIndicator color={C.white} size="small" style={{ marginRight: 8 }} />
              : null
            }
            <Text style={s.predictBtnText}>
              {loading ? "Predicting…" : "Predict"}
            </Text>
          </TouchableOpacity>
        </View>

        <SlideDrawer
          visible={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onLogout={logout}
        />

        {/* Result card */}
        {result && (

          <View style={s.resultCard}>
            <Text style={s.resultTitle}>Prediction Result</Text>

            <View style={{ marginTop: 12, gap: 12 }}>
              {/* Menu + Risk on same row */}
              <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.resultLabel}>Menu item used</Text>
                  <Text style={s.resultValue}>{result.menuItemUsed}</Text>
                </View>
                <RiskPill level={result.riskLevel} />
              </View>

              <View style={s.resultDivider} />

              {/* Stats row */}
              <View style={s.statsRow}>
                <View style={s.statBox}>
                  <Text style={s.statNum}>{result.predictedWastePortions}</Text>
                  <Text style={s.statLabel}>Predicted{"\n"}Waste</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statBox}>
                  <Text style={s.statNum}>{result.historicalAvgLeftovers ?? "—"}</Text>
                  <Text style={s.statLabel}>Historical{"\n"}Avg</Text>
                </View>
              </View>

              <View style={s.resultDivider} />

              {/* Explanation */}
              <View>
                <Text style={s.resultLabel}>Explanation</Text>
                <Text style={[s.resultValue, { color: C.gray500, fontWeight: "400", lineHeight: 20 }]}>
                  {result.explanation}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.gray200,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },

  heading:   { fontSize: 22, fontWeight: "700", color: "#111827" },
  subheading:{ fontSize: 13, color: "#6B7280", marginTop: 2 },
  errorBanner: {
    backgroundColor: C.red50,
    borderWidth: 1,
    borderColor: C.red200,
    borderRadius: 12,
    padding: 12,
  },
  errorText: { color: C.red600, fontSize: 13 },
  card: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.gray200,
    gap: 0,
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  twoCol: {
    flexDirection: "row",
    gap: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: C.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  labelOptional: {
    fontSize: 10,
    color: C.gray400,
  },
  input: {
    borderWidth: 1.5,
    borderColor: C.gray200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    fontSize: 14,
    color: C.gray900,
    backgroundColor: C.white,
  },
  inputFocused:  { borderColor: C.emerald600 },
  inputDisabled: { backgroundColor: C.gray100 },
  predictBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.indigo600,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
  },
  predictBtnDisabled: { backgroundColor: C.indigo400 },
  predictBtnText: { color: C.white, fontSize: 15, fontWeight: "700" },

  // Result
  resultCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.gray200,
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  resultTitle: { fontSize: 16, fontWeight: "700", color: C.gray900 },
  resultLabel: { fontSize: 10, fontWeight: "700", color: C.gray400, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  resultValue: { fontSize: 15, fontWeight: "600", color: C.gray900 },
  resultDivider: { height: 1, backgroundColor: C.gray100 },
  statsRow: {
    flexDirection: "row",
    borderRadius: 14,
    backgroundColor: C.gray50,
    borderWidth: 1,
    borderColor: C.gray100,
    overflow: "hidden",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    gap: 4,
  },
  statNum: { fontSize: 28, fontWeight: "700", color: C.gray900 },
  statLabel: { fontSize: 11, color: C.gray400, textAlign: "center", lineHeight: 16 },
  statDivider: { width: 1, backgroundColor: C.gray200, marginVertical: 12 },
});