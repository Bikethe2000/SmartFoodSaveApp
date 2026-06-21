/**
 * app/(app)/weekly-schedule.tsx
 *
 * Ported from web WeeklySchedulePro + WeeklyPlanEditor.
 * Loads the user's school from Firestore, then lets them edit
 * the Mon–Fri meal schedule and save it to the API.
 */

import React, { useEffect, useState, useCallback } from "react";
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

import { CalendarRange, Save, CheckCircle, Menu } from "lucide-react-native";



import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import SlideDrawer from "../../components/SlideDrawer";
import { useAuth } from "../../context/AuthContext";




// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  emerald600: "#059669",
  emerald700: "#047857",
  emerald50:  "#ECFDF5",
  emerald100: "#D1FAE5",
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
  white:   "#FFFFFF",
};

const API_BASE = "https://foodwasteai-production.up.railway.app/api";
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

async function getToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

// ─── Shared field ─────────────────────────────────────────────────────────────
function FieldLabel({ text, sub }: { text: string; sub?: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
      <Text style={s.label}>{text}</Text>
      {sub ? <Text style={s.labelSub}>{sub}</Text> : null}
    </View>
  );
}

function StyledInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      style={[
        s.input,
        focused && s.inputFocused,
        disabled && s.inputDisabled,
      ]}
      value={value}
      onChangeText={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      placeholderTextColor={C.gray300}
      editable={!disabled}
      autoCapitalize="words"
      autoCorrect={false}
    />
  );
}

// ─── Day row ──────────────────────────────────────────────────────────────────
function DayRow({
  day,
  value,
  onChange,
  saving,
}: {
  day: string;
  value: string;
  onChange: (v: string) => void;
  saving: boolean;
}) {
  const SHORT: Record<string, string> = {
    Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed",
    Thursday: "Thu", Friday: "Fri",
  };
  return (
    <View style={s.dayRow}>
      <View style={s.dayPill}>
        <Text style={s.dayPillText}>{SHORT[day]}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <StyledInput
          value={value}
          onChange={onChange}
          placeholder="e.g. Pasta, Salad"
          disabled={saving}
        />
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function WeeklyScheduleScreen() {
  const { logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [school, setSchool]       = useState<string | null>(null);

  const [schedule, setSchedule]   = useState<Record<string, string>>(
    Object.fromEntries(WEEKDAYS.map(d => [d, ""]))
  );
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState("");

  // Load school from Firestore + existing schedule from API
  useEffect(() => {
    async function load() {
      setError("");
      try {
        const user = auth.currentUser;
        if (!user) { setError("Not authenticated."); setLoading(false); return; }

        // Firestore school
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setSchool(snap.data().school ?? null);

        // API schedule
        const token = await getToken();
        if (!token) { setLoading(false); return; }

        const res = await fetch(`${API_BASE}/schedule`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const raw: Record<string, string> = data.schedule ?? {};
          const normalized: Record<string, string> = {};
          WEEKDAYS.forEach(day => {
            const key = Object.keys(raw).find(
              k => k.toLowerCase() === day.toLowerCase()
            );
            normalized[day] = key ? raw[key] : "";
          });
          setSchedule(normalized);
        }
      } catch (err: any) {
        setError(err.message ?? "Failed to load schedule.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated.");

      const payload: Record<string, string> = {};
      WEEKDAYS.forEach(day => {
        if (schedule[day]?.trim()) payload[day.toLowerCase()] = schedule[day].trim();
      });

      const res = await fetch(`${API_BASE}/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ schedule: payload }),
      });
      if (!res.ok) throw new Error("Failed to save schedule.");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }, [schedule]);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={C.emerald600} size="large" />
        <Text style={s.loadingText}>Loading schedule…</Text>
      </View>
    );
  }

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

          <CalendarRange size={22} color={C.emerald600} />
          <View style={{ flex: 1 }}>
            <Text style={s.heading}>Weekly Schedule</Text>
            {school ? (
              <Text style={s.subheading}>{school}</Text>
            ) : null}
          </View>
        </View>

        <SlideDrawer
          visible={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onLogout={logout}
        />


        {/* Banners */}
        {error ? (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        {saved ? (
          <View style={s.successBanner}>
            <CheckCircle size={16} color={C.emerald600} />
            <Text style={s.successText}>Schedule saved successfully!</Text>
          </View>
        ) : null}

        {/* Schedule card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Set this week's meals</Text>
          <Text style={s.cardSub}>
            Enter the planned menu for each day. Leave blank to skip a day.
          </Text>

          <View style={{ gap: 12, marginTop: 16 }}>
            {WEEKDAYS.map(day => (
              <DayRow
                key={day}
                day={day}
                value={schedule[day] ?? ""}
                onChange={v => setSchedule(prev => ({ ...prev, [day]: v }))}
                saving={saving}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[s.saveBtn, saving && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
          >
            {saving
              ? <ActivityIndicator color={C.white} size="small" style={{ marginRight: 8 }} />
              : <Save size={16} color={C.white} style={{ marginRight: 6 }} />
            }
            <Text style={s.saveBtnText}>
              {saving ? "Saving…" : "Save Schedule"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info box */}
        <View style={s.infoBox}>
          <Text style={s.infoText}>
            💡 The AI uses this schedule as a starting point for waste predictions. You can override any day during the prediction step.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.gray50, gap: 12 },
  loadingText: { color: C.gray500, fontSize: 14 },
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

  heading:   { fontSize: 22, fontWeight: "700", color: C.gray900 },
  subheading:{ fontSize: 13, color: C.emerald600, fontWeight: "600", marginTop: 2 },
  errorBanner: {
    backgroundColor: C.red50,
    borderWidth: 1,
    borderColor: C.red200,
    borderRadius: 12,
    padding: 12,
  },
  errorText: { color: C.red600, fontSize: 13 },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.emerald50,
    borderWidth: 1,
    borderColor: C.emerald100,
    borderRadius: 12,
    padding: 12,
  },
  successText: { color: C.emerald700, fontSize: 13, fontWeight: "600" },
  card: {
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
  cardTitle: { fontSize: 16, fontWeight: "700", color: C.gray900 },
  cardSub:   { fontSize: 13, color: C.gray500, marginTop: 4 },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dayPill: {
    width: 44,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.gray900,
    alignItems: "center",
    justifyContent: "center",
  },
  dayPillText: { fontSize: 11, fontWeight: "700", color: C.white, letterSpacing: 0.4 },
  label:    { fontSize: 10, fontWeight: "700", color: C.gray400, textTransform: "uppercase", letterSpacing: 0.5 },
  labelSub: { fontSize: 10, color: C.gray400 },
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
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.emerald600,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
  },
  saveBtnDisabled: { backgroundColor: C.gray300 },
  saveBtnText:     { color: C.white, fontSize: 15, fontWeight: "700" },
  infoBox: {
    backgroundColor: C.gray50,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.gray200,
  },
  infoText: { fontSize: 13, color: C.gray500, lineHeight: 20 },
});