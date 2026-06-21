/**
 * app/(app)/settings.tsx
 *
 * Ported from web Settings.jsx.
 * School profile form (name, city, student count, portion size, timezone)
 * + confidence range toggle, saved to the API.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Settings as SettingsIcon, Save, Sparkles, ChevronDown } from "lucide-react-native";
import { auth } from "../../firebase";
import SchoolProfilePopup from "../../components/SchoolProfilePopup";
import { Menu } from "lucide-react-native";
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

async function getToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

// ─── Timezone list ─────────────────────────────────────────────────────────────
const TIMEZONES = [
  "GMT-12","GMT-11","GMT-10","GMT-9:30","GMT-9","GMT-8","GMT-7","GMT-6",
  "GMT-5","GMT-4","GMT-3:30","GMT-3","GMT-2","GMT-1","GMT+0","GMT+1",
  "GMT+2","GMT+3","GMT+3:30","GMT+4","GMT+4:30","GMT+5","GMT+5:30",
  "GMT+5:45","GMT+6","GMT+6:30","GMT+7","GMT+8","GMT+8:45","GMT+9",
  "GMT+9:30","GMT+10","GMT+10:30","GMT+11","GMT+12","GMT+12:45","GMT+13","GMT+14",
];

// ─── Shared components ─────────────────────────────────────────────────────────
function FieldLabel({ text }: { text: string }) {
  return <Text style={s.label}>{text}</Text>;
}

function StyledInput({
  value, onChange, placeholder, keyboardType, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      style={[s.input, focused && s.inputFocused, disabled && s.inputDisabled]}
      value={value}
      onChangeText={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      placeholderTextColor={C.gray300}
      keyboardType={keyboardType ?? "default"}
      editable={!disabled}
      autoCapitalize="words"
      autoCorrect={false}
    />
  );
}

// ─── Timezone picker (scrollable modal-style inline list) ─────────────────────
function TimezonePicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <TouchableOpacity
        style={[s.input, s.pickerBtn, disabled && s.inputDisabled]}
        onPress={() => !disabled && setOpen(o => !o)}
        accessibilityRole="button"
      >
        <Text style={{ fontSize: 14, color: C.gray900, flex: 1 }}>{value}</Text>
        <ChevronDown size={16} color={C.gray400} />
      </TouchableOpacity>

      {open && (
        <View style={s.tzDropdown}>
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
            {TIMEZONES.map(tz => (
              <TouchableOpacity
                key={tz}
                style={[s.tzOption, tz === value && s.tzOptionActive]}
                onPress={() => { onChange(tz); setOpen(false); }}
              >
                <Text style={[s.tzOptionText, tz === value && { color: C.emerald600, fontWeight: "700" }]}>
                  {tz}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [schoolName, setSchoolName]         = useState("");
  const [city, setCity]                     = useState("");
  const [studentCount, setStudentCount]     = useState("");
  const [portionSize, setPortionSize]       = useState("");
  const [timezone, setTimezone]             = useState("GMT+2");
  const [showConfidence, setShowConfidence] = useState(false);

  const [loading, setLoading]   = useState(true);
  const [showSchoolPopup, setShowSchoolPopup] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    async function load() {
      setError("");
      try {
        const token = await getToken();
        if (!token) { setError("Not authenticated."); setLoading(false); return; }

        // First-launch school profile popup logic (Firestore user doc)
        try {
          const resSchool = await fetch(`${API_BASE}/settings`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (resSchool.ok) {
            const dataSchool = await resSchool.json();
            const hasSchool = !!(dataSchool?.schoolName && dataSchool?.location);
            setShowSchoolPopup(!hasSchool);
          } else {
            setShowSchoolPopup(true);
          }
        } catch {
          setShowSchoolPopup(true);
        }

        // Token already validated above

        const res = await fetch(`${API_BASE}/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load settings.");
        const data = await res.json();

        setSchoolName(data.schoolName    ?? "");
        setCity(data.location            ?? "");
        setStudentCount(String(data.studentCount ?? ""));
        setPortionSize(data.portionSize  ?? "");
        setTimezone(data.timezone        ?? "GMT+2");
        setShowConfidence(data.showConfidenceRanges ?? false);
      } catch (err: any) {
        setError(err.message ?? "Failed to load.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = useCallback(async () => {
    if (!schoolName || !city) { setError("School name and city are required."); return; }
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated.");

      const res = await fetch(`${API_BASE}/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          schoolName,
          location: city,
          studentCount,
          portionSize,
          timezone,
          showConfidenceRanges: showConfidence,
        }),
      });
      if (!res.ok) throw new Error("Failed to save settings.");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  }, [schoolName, city, studentCount, portionSize, timezone, showConfidence]);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={C.emerald600} size="large" />
        <Text style={s.loadingText}>Loading settings…</Text>
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

          <SettingsIcon size={22} color={C.emerald600} />
          <View>
            <Text style={s.heading}>Settings</Text>
            <Text style={s.subheading}>Manage your cafeteria profile</Text>
          </View>
        </View>

        {/* Error */}
        {error ? (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Saved */}
        {saved ? (
          <View style={s.successBanner}>
            <Sparkles size={14} color={C.emerald600} />
            <Text style={s.successText}>Settings saved successfully!</Text>
          </View>
        ) : null}

        {/* Profile card */}
        <View style={s.card}>
          <View style={s.cardHeaderRow}>
            <SettingsIcon size={18} color={C.emerald600} />
            <Text style={s.cardTitle}>Cafeteria Profile</Text>
          </View>

          <View style={{ gap: 14 }}>
            <View style={s.twoCol}>
              <View style={{ flex: 1 }}>
                <FieldLabel text="School Name" />
                <StyledInput value={schoolName} onChange={setSchoolName} placeholder="Lincoln High" disabled={saving} />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel text="City" />
                <StyledInput value={city} onChange={setCity} placeholder="Athens" disabled={saving} />
              </View>
            </View>

            <View style={s.twoCol}>
              <View style={{ flex: 1 }}>
                <FieldLabel text="Typical Students" />
                <StyledInput value={studentCount} onChange={setStudentCount} placeholder="300" keyboardType="numeric" disabled={saving} />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel text="Default Portion Size" />
                <StyledInput value={portionSize} onChange={setPortionSize} placeholder="350g" disabled={saving} />
              </View>
            </View>

            <View>
              <FieldLabel text="Timezone" />
              <TimezonePicker value={timezone} onChange={setTimezone} disabled={saving} />
            </View>
          </View>
        </View>

        {/* Visualization toggle card */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>Visualization Parameters</Text>

          <View style={s.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.toggleTitle}>Show confidence ranges</Text>
              <Text style={s.toggleSub}>
                Display lower/upper margin limits for waste predictions.
              </Text>
            </View>
            <Switch
              value={showConfidence}
              onValueChange={setShowConfidence}
              trackColor={{ false: C.gray200, true: C.emerald600 }}
              thumbColor={C.white}
              disabled={saving}
            />
          </View>
        </View>

        {/* Save button */}
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
            {saving ? "Saving…" : "Save Configuration"}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <SchoolProfilePopup
        visible={showSchoolPopup}
        onClose={() => setShowSchoolPopup(false)}
        initialSettings={{
          schoolName,
          schoolType: "Primary",
          studentCount,
          portionSize,
          malePercent: 50,
          femalePercent: 50,
          location: city,
        }}
        onSaved={(payload) => {
          setSchoolName(payload.schoolName);
          setCity(payload.location);
          setStudentCount(String(payload.studentCount));
          setPortionSize(payload.portionSize);
          setShowSchoolPopup(false);
        }}
      />

      <SlideDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogout={logout}
      />

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
  subheading:{ fontSize: 13, color: C.gray500, marginTop: 4 },
  errorBanner: {
    backgroundColor: C.red50, borderWidth: 1,
    borderColor: C.red200, borderRadius: 12, padding: 12,
  },
  errorText: { color: C.red600, fontSize: 13 },
  successBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.emerald50, borderWidth: 1,
    borderColor: C.emerald100, borderRadius: 12, padding: 12,
  },
  successText: { color: C.emerald700, fontSize: 13, fontWeight: "600" },
  card: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.gray200,
    gap: 14,
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle:     { fontSize: 16, fontWeight: "700", color: C.gray900 },
  twoCol:        { flexDirection: "row", gap: 12 },
  label: {
    fontSize: 10, fontWeight: "700", color: C.gray400,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5,
  },
  input: {
    borderWidth: 1.5, borderColor: C.gray200, borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    fontSize: 14, color: C.gray900, backgroundColor: C.white,
  },
  inputFocused:  { borderColor: C.emerald600 },
  inputDisabled: { backgroundColor: C.gray100 },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  tzDropdown: {
    borderWidth: 1,
    borderColor: C.gray200,
    borderRadius: 12,
    backgroundColor: C.white,
    marginTop: 4,
    overflow: "hidden",
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  tzOption:       { paddingHorizontal: 14, paddingVertical: 10 },
  tzOptionActive: { backgroundColor: C.emerald50 },
  tzOptionText:   { fontSize: 14, color: C.gray700 },
  sectionLabel: {
    fontSize: 10, fontWeight: "700", color: C.gray400,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.gray50,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.gray200,
  },
  toggleTitle: { fontSize: 14, fontWeight: "700", color: C.gray900, marginBottom: 2 },
  toggleSub:   { fontSize: 12, color: C.gray400, lineHeight: 17 },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: C.emerald600, borderRadius: 12, paddingVertical: 14,
  },
  saveBtnDisabled: { backgroundColor: C.gray300 },
  saveBtnText:     { color: C.white, fontSize: 15, fontWeight: "700" },
  smallHint:      { fontSize: 12, color: C.gray400, marginTop: 2 },
});