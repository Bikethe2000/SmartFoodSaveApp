/**
 * app/(app)/data.tsx
 *
 * Ported from web DataLogs.jsx.
 * Form to add daily log entries + scrollable history list.
 * Auto-calculates leftovers from prepared − served.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";

import {
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { ClipboardList, History, Plus, Info, Calendar } from "lucide-react-native";
import { auth } from "../../firebase";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  RefreshControl,
  Animated,
  Pressable,
  Dimensions,
  StatusBar,
} from "react-native";
import { Menu } from "lucide-react-native";
import SlideDrawer from "../../components/SlideDrawer";
import { useAuth } from "../../context/AuthContext";

import {
  LayoutDashboard,
  CalendarRange,
  BarChart2,
  Database,
  Settings,
  Mail,
} from "lucide-react-native";

import { useRouter } from "expo-router";


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
  slate50: "#F8FAFC",
  slate100:"#F1F5F9",
  slate200:"#E2E8F0",
  slate400:"#94A3B8",
  slate600:"#475569",
  slate700:"#334155",
  white:   "#FFFFFF",
};

const API_BASE = "https://foodwasteai-production.up.railway.app/api";

async function getToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

function getDayOfWeek(dateStr: string): string {
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  return days[new Date(dateStr).getDay()];
}

// ─── Shared field ─────────────────────────────────────────────────────────────
function FieldLabel({ text }: { text: string }) {
  return <Text style={s.label}>{text}</Text>;
}


function StyledInput({
  value, onChange, placeholder, keyboardType, disabled, bg,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
  disabled?: boolean;
  bg?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      style={[
        s.input,
        focused && s.inputFocused,
        disabled && s.inputDisabled,
        bg ? { backgroundColor: bg } : null,
      ]}
      value={value}
      onChangeText={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      placeholderTextColor={C.gray300}
      keyboardType={keyboardType ?? "default"}
      editable={!disabled}
      autoCapitalize="none"
      autoCorrect={false}
    />
  );
}

// ─── Log row ──────────────────────────────────────────────────────────────────
interface DailyLog {
  id: string;
  date: string;
  dayOfWeek?: string;
  menuItems: string[];
  prepared: number;
  served: number;
  leftovers: number;
}

function LogRow({ log }: { log: DailyLog }) {
  const wastePercent = log.prepared > 0
    ? (((log.prepared - log.served) / log.prepared) * 100).toFixed(1)
    : "0.0";

  return (
    <View style={s.logRow}>
      {/* Date + day */}
      <View style={s.logDateRow}>
        <Calendar size={13} color={C.slate400} />
        <Text style={s.logDate}>
          {log.dayOfWeek ? `${log.dayOfWeek} · ` : ""}{log.date}
        </Text>
        <View style={[s.wasteTag, { marginLeft: "auto" }]}>
          <Text style={s.wasteTagText}>{wastePercent}% waste</Text>
        </View>
      </View>

      {/* Meals */}
      <Text style={s.logMeals} numberOfLines={2}>
        {log.menuItems?.join(", ") || "—"}
      </Text>

      {/* Stats row */}
      <View style={s.logStats}>
        <View style={s.logStat}>
          <Text style={s.logStatNum}>{log.prepared}</Text>
          <Text style={s.logStatLabel}>Prepared</Text>
        </View>
        <View style={s.logStatDivider} />
        <View style={s.logStat}>
          <Text style={s.logStatNum}>{log.served}</Text>
          <Text style={s.logStatLabel}>Served</Text>
        </View>
        <View style={s.logStatDivider} />
        <View style={s.logStat}>
          <Text style={[s.logStatNum, { color: C.emerald600 }]}>{log.leftovers}</Text>
          <Text style={s.logStatLabel}>Leftovers</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DataScreen() {
  const { logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [logs, setLogs]         = useState<DailyLog[]>([]);

  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError]     = useState("");

  // Form state
  const [date, setDate]             = useState("");
  const [menuItems, setMenuItems]   = useState("");
  const [attendance, setAttendance] = useState("");
  const [prepared, setPrepared]     = useState("");
  const [served, setServed]         = useState("");
  const [leftovers, setLeftovers]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError]     = useState("");

  // Auto-calculate leftovers
  useEffect(() => {
    const p = parseInt(prepared);
    const sv = parseInt(served);
    if (!isNaN(p) && !isNaN(sv)) {
      setLeftovers(String(Math.max(0, p - sv)));
    }
  }, [prepared, served]);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    setLogsError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated.");
      const res = await fetch(`${API_BASE}/data/daily-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch logs.");
      setLogs(await res.json());
    } catch (err: any) {
      setLogsError(err.message ?? "Failed to load logs.");
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleSubmit = useCallback(async () => {
    setFormError("");
    setFormSuccess(false);

    if (!date || !menuItems || !prepared || !served || !leftovers) {
      setFormError("All fields are required.");
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated.");

      const res = await fetch(`${API_BASE}/data/daily-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dayOfWeek:   getDayOfWeek(date),
          date,
          menuItems:   menuItems.split(",").map(i => i.trim()).filter(Boolean),
          attendance:  parseInt(attendance) || 0,
          prepared:    parseInt(prepared),
          served:      parseInt(served),
          leftovers:   parseInt(leftovers),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? "Failed to submit.");
      }

      // Reset form
      setDate(""); setMenuItems(""); setAttendance("");
      setPrepared(""); setServed(""); setLeftovers("");
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 3000);
      fetchLogs();
    } catch (err: any) {
      setFormError(err.message ?? "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }, [date, menuItems, attendance, prepared, served, leftovers, fetchLogs]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.gray50 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={{ marginBottom: 4 }}>
          <TouchableOpacity
            onPress={() => setDrawerOpen(true)}
            style={s.menuBtn}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <Menu size={20} color={C.gray700} />
          </TouchableOpacity>
          <Text style={s.heading}>Data Input & Logs</Text>

          <Text style={s.subheading}>Record portions to improve AI predictions.</Text>
        </View>

        {/* ── Add Log Form ─────────────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.cardHeaderRow}>
            <ClipboardList size={18} color={C.emerald600} />
            <Text style={s.cardTitle}>Add Daily Log Entry</Text>
          </View>

          {formError ? (
            <View style={s.formError}>
              <Text style={s.formErrorText}>{formError}</Text>
            </View>
          ) : null}

          {formSuccess ? (
            <View style={s.formSuccess}>
              <Text style={s.formSuccessText}>✓ Daily log recorded successfully!</Text>
            </View>
          ) : null}

          <View style={{ gap: 14, marginTop: 4 }}>
            <View>
              <FieldLabel text="Date (YYYY-MM-DD)" />
              <StyledInput value={date} onChange={setDate} placeholder="2025-06-01" disabled={submitting} />
            </View>

            <View>
              <FieldLabel text="Menu Items (comma-separated)" />
              <StyledInput value={menuItems} onChange={setMenuItems} placeholder="e.g. Pasta, Green Salad" disabled={submitting} />
            </View>

            <View>
              <FieldLabel text="Attendance" />
              <StyledInput value={attendance} onChange={setAttendance} placeholder="e.g. 150" keyboardType="numeric" disabled={submitting} />
            </View>

            <View style={s.twoCol}>
              <View style={{ flex: 1 }}>
                <FieldLabel text="Prepared" />
                <StyledInput value={prepared} onChange={setPrepared} placeholder="150" keyboardType="numeric" disabled={submitting} />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel text="Served" />
                <StyledInput value={served} onChange={setServed} placeholder="130" keyboardType="numeric" disabled={submitting} />
              </View>
            </View>

            <View>
              <FieldLabel text="Leftover Portions (auto-calculated)" />
              <StyledInput value={leftovers} onChange={setLeftovers} placeholder="20" keyboardType="numeric" disabled={submitting} bg={C.gray50} />
            </View>
          </View>

          <TouchableOpacity
            style={[s.submitBtn, submitting && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            accessibilityRole="button"
          >
            {submitting
              ? <ActivityIndicator color={C.white} size="small" style={{ marginRight: 8 }} />
              : <Plus size={16} color={C.white} style={{ marginRight: 6 }} />
            }
            <Text style={s.submitBtnText}>
              {submitting ? "Saving…" : "Save Daily Log"}
            </Text>
          </TouchableOpacity>

          {/* Info box */}
          <View style={s.infoBox}>
            <Info size={15} color={C.slate400} style={{ marginTop: 1, flexShrink: 0 }} />
            <Text style={s.infoText}>
              Synthetic or sample data can be used during testing. In real deployment, this connects to cafeteria records.
            </Text>
          </View>
        </View>

        {/* ── Log History ────────────────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.cardHeaderRow}>
            <History size={18} color={C.emerald600} />
            <Text style={s.cardTitle}>Daily History Logs</Text>
          </View>

          {logsLoading ? (
            <View style={{ paddingVertical: 32, alignItems: "center" }}>
              <ActivityIndicator color={C.emerald600} />
            </View>
          ) : logsError ? (
            <View style={s.formError}>
              <Text style={s.formErrorText}>{logsError}</Text>
            </View>
          ) : logs.length === 0 ? (
            <View style={{ paddingVertical: 32, alignItems: "center" }}>
              <Text style={{ color: C.slate400, fontSize: 14 }}>No logs submitted yet.</Text>
            </View>
          ) : (
            <View style={{ gap: 10, marginTop: 8 }}>
              {logs.map(log => (
                <LogRow key={log.id ?? log.date} log={log} />
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  scroll: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    gap: 16,
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

  card: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.gray200,
    gap: 12,
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle:     { fontSize: 16, fontWeight: "700", color: C.gray900 },
  twoCol: { flexDirection: "row", gap: 12 },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: C.slate400,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 5,
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
  formError: {
    backgroundColor: C.red50,
    borderWidth: 1,
    borderColor: C.red200,
    borderRadius: 10,
    padding: 10,
  },
  formErrorText:   { color: C.red600, fontSize: 12, fontWeight: "600" },
  formSuccess: {
    backgroundColor: C.emerald50,
    borderWidth: 1,
    borderColor: C.emerald100,
    borderRadius: 10,
    padding: 10,
  },
  formSuccessText: { color: C.emerald700, fontSize: 12, fontWeight: "600" },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.emerald600,
    borderRadius: 12,
    paddingVertical: 14,
  },
  submitBtnDisabled: { backgroundColor: C.gray300 },
  submitBtnText:     { color: C.white, fontSize: 15, fontWeight: "700" },
  infoBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: C.gray50,
    borderWidth: 1,
    borderColor: C.gray200,
    borderRadius: 12,
    padding: 12,
    alignItems: "flex-start",
  },
  infoText: { flex: 1, fontSize: 12, color: C.slate400, lineHeight: 18 },

  // Log rows
  logRow: {
    backgroundColor: C.gray50,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: C.gray200,
    gap: 8,
  },
  logDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  logDate:  { fontSize: 12, fontWeight: "600", color: C.slate700 },
  logMeals: { fontSize: 13, color: C.slate600, fontWeight: "500" },
  wasteTag: {
    backgroundColor: C.emerald50,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  wasteTagText: { fontSize: 10, fontWeight: "700", color: C.emerald700 },
  logStats: {
    flexDirection: "row",
    backgroundColor: C.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.gray200,
    overflow: "hidden",
  },
  logStat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    gap: 2,
  },
  logStatNum:   { fontSize: 16, fontWeight: "700", color: C.gray900 },
  logStatLabel: { fontSize: 10, color: C.gray400, fontWeight: "500" },
  logStatDivider: { width: 1, backgroundColor: C.gray200, marginVertical: 8 },
});