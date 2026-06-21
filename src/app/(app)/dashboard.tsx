/**
 * app/(app)/dashboard.tsx
 *
 * Full dashboard — ported from the web version.
 *
 * Dependencies (add to your project if not already installed):
 *   npx expo install victory-native react-native-svg
 *
 * Uses:
 *   - victory-native for Line + Bar charts
 *   - lucide-react-native for icons
 *   - Firebase auth for token
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  RefreshControl,
} from "react-native";
import {
  VictoryLine,
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from "victory-native";
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  CalendarDays,
  Lightbulb,
  Menu,
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../firebase";
import SlideDrawer from "../../components/SlideDrawer";





// ─── Palette (matches the web UI) ─────────────────────────────────────────────
const C = {
  emerald600:  "#059669",
  emerald700:  "#047857",
  emerald100:  "#D1FAE5",
  emerald50:   "#ECFDF5",
  indigo600:   "#4F46E5",
  indigo400:   "#818CF8",
  red600:      "#DC2626",
  yellow600:   "#D97706",
  gray50:      "#F9FAFB",
  gray100:     "#F3F4F6",
  gray200:     "#E5E7EB",
  gray300:     "#D1D5DB",
  gray400:     "#9CA3AF",
  gray500:     "#6B7280",
  gray700:     "#374151",
  gray900:     "#111827",
  white:       "#FFFFFF",
  slate200:    "#E2E8F0",
  slate400:    "#94A3B8",
};

const API_BASE = "https://foodwasteai-production.up.railway.app/api";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface DailyLog {
  date: string;
  prepared: number;
  leftovers: number;
  attendance: number;
  menuItems: string[];
}

interface MealStats {
  [meal: string]: { count: number; waste: number };
}

interface PredictionResult {
  menuItemUsed: string;
  predictedWastePortions: number;
  riskLevel: string;
  explanation: string;
}

interface WeeklyPrediction {
  [day: string]: PredictionResult;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
async function getToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

function getNextWeekdays(): string[] {
  const today = new Date();
  const dow = today.getDay();
  const daysUntilMonday = dow === 0 ? 1 : 8 - dow;
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + daysUntilMonday + i);
    return d.toISOString().split("T")[0];
  });
}

function wasteColor(pct: number): string {
  if (pct < 10) return C.emerald600;
  if (pct < 20) return C.yellow600;
  return C.red600;
}

// (drawer extracted into shared component)


function SummaryCard({
  title,
  value,
  icon,
  valueColor,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <View style={sc.card}>
      <View style={sc.header}>
        {icon}
        <Text style={sc.title}>{title}</Text>
      </View>
      <Text style={[sc.value, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.gray200,
    gap: 6,
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  header: { flexDirection: "row", alignItems: "center", gap: 6 },
  title:  { fontSize: 10, fontWeight: "700", color: C.gray500, textTransform: "uppercase", letterSpacing: 0.5, flex: 1 },
  value:  { fontSize: 22, fontWeight: "700", color: C.gray900 },
});

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.sectionCard}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InsightBanner({ message }: { message: string }) {
  return (
    <View style={s.insightBanner}>
      <Text style={s.insightText}>{message}</Text>
    </View>
  );
}

function RiskPill({ level }: { level: string }) {
  const bg    = level === "Low" ? C.emerald50  : level === "Medium" ? "#FFFBEB" : "#FEF2F2";
  const color = level === "Low" ? C.emerald700 : level === "Medium" ? "#92400E" : C.red600;
  const dot   = level === "Low" ? C.emerald600 : level === "Medium" ? C.yellow600 : C.red600;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: bg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dot }} />
      <Text style={{ fontSize: 11, fontWeight: "700", color }}>{level} risk</Text>
    </View>
  );
}

const DAY_SHORT: Record<string, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri",
};

function DayPredictionCard({
  day,
  result,
  defaultMeal,
}: {
  day: string;
  result: PredictionResult;
  defaultMeal: string | undefined;
}) {
  const isSame = defaultMeal && defaultMeal === result.menuItemUsed;

  return (
    <View style={s.dayCard}>
      {/* Day pill + risk badge row */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={s.dayPill}>
          <Text style={s.dayPillText}>{DAY_SHORT[day] ?? day}</Text>
        </View>
        <RiskPill level={result.riskLevel} />
      </View>

      {/* Meal comparison */}
      <View style={s.dayMealRow}>
        <View style={s.dayMealCol}>
          <Text style={s.dayLabel}>Default</Text>
          <Text style={s.dayMealText} numberOfLines={2}>{defaultMeal || "—"}</Text>
        </View>

        <View style={s.dayArrowWrap}>
          <Text style={s.dayArrow}>→</Text>
        </View>

        <View style={[s.dayMealCol, { alignItems: "flex-end" }]}>
          <Text style={s.dayLabel}>Suggested</Text>
          <Text style={[s.dayMealText, { color: isSame ? C.gray500 : C.emerald600, textAlign: "right" }]} numberOfLines={2}>
            {result.menuItemUsed}
            {isSame ? " ✓" : ""}
          </Text>
        </View>
      </View>

      {/* Waste bar */}
      <View style={s.dayWasteRow}>
        <Text style={s.dayWasteLabel}>
          {result.predictedWastePortions} portions wasted
        </Text>
        <View style={s.dayWasteBarBg}>
          <View style={[s.dayWasteBarFill, {
            width: `${Math.min(100, (result.predictedWastePortions / 30) * 100)}%`,
            backgroundColor: result.riskLevel === "Low" ? C.emerald600 : result.riskLevel === "Medium" ? C.yellow600 : C.red600,
          }]} />
        </View>
      </View>

      {/* Explanation */}
      <Text style={s.dayExplanation} numberOfLines={3}>{result.explanation}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [logs, setLogs]                       = useState<DailyLog[]>([]);
  const [mealStats, setMealStats]             = useState<MealStats>({});
  const [loading, setLoading]                 = useState(true);
  const [refreshing, setRefreshing]           = useState(false);
  const [weeklyPrediction, setWeeklyPrediction] = useState<WeeklyPrediction | null>(null);
  const [predicting, setPredicting]           = useState(false);
  const [defaultSchedule, setDefaultSchedule] = useState<Record<string, string>>({});
  const [error, setError]                     = useState("");

  // ── Data fetching ──────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setError("");
    try {
      const token = await getToken();
      if (!token) { setError("Not authenticated."); return; }

      // Logs
      const logsRes = await fetch(`${API_BASE}/data/daily-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!logsRes.ok) throw new Error("Failed to load logs.");
      const logsData: DailyLog[] = await logsRes.json();
      setLogs(logsData);

      const stats: MealStats = {};
      logsData.forEach((log) => {
        log.menuItems?.forEach((item) => {
          if (!stats[item]) stats[item] = { count: 0, waste: 0 };
          stats[item].count  += 1;
          stats[item].waste  += log.leftovers;
        });
      });
      setMealStats(stats);

      // Schedule
      const schedRes = await fetch(`${API_BASE}/schedule`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (schedRes.ok) {
        const schedData = await schedRes.json();
        const raw = schedData.schedule || {};
        const normalized: Record<string, string> = {};
        Object.keys(raw).forEach((day) => {
          normalized[day.charAt(0).toUpperCase() + day.slice(1)] = raw[day];
        });
        setDefaultSchedule(normalized);
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    // eslint-disable-next-line
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // ── Predict ────────────────────────────────────────────────────────────────
  const predictNextWeek = useCallback(async () => {
    setPredicting(true);
    setWeeklyPrediction(null);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated.");

      const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      const dates    = getNextWeekdays();
      const results: WeeklyPrediction = {};
      const suggestedSoFar: string[]  = [];

      for (let i = 0; i < 5; i++) {
        const day  = weekdays[i];
        const date = dates[i];
        const res = await fetch(`${API_BASE}/predict`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date,
            menu_item:          defaultSchedule[day] || null,
            prepared_portions:  120,
            attendance:         100,
            preferred_foods:    null,
            excluded_meals:     suggestedSoFar,
          }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.detail || `Prediction for ${day} failed.`);
        }

        const data: PredictionResult = await res.json();
        results[day] = data;
        if (data.menuItemUsed) suggestedSoFar.push(data.menuItemUsed);
      }

      setWeeklyPrediction(results);
    } catch (err: any) {
      setError(err.message || "Prediction failed. Try again.");
    } finally {
      setPredicting(false);
    }
  }, [defaultSchedule]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalPrepared   = logs.reduce((a, b) => a + (b.prepared   || 0), 0);
  const totalLeftovers  = logs.reduce((a, b) => a + (b.leftovers  || 0), 0);
  const totalAttendance = logs.reduce((a, b) => a + (b.attendance || 0), 0);
  const wastePercent    = totalPrepared > 0
    ? parseFloat(((totalLeftovers / totalPrepared) * 100).toFixed(1))
    : 0;

  const insight =
    wastePercent > 25
      ? "Waste levels are high. Consider adjusting portions or reviewing menu items."
      : wastePercent > 10
      ? "Moderate waste. Some improvements could help reduce leftovers."
      : "Great job! Waste levels are low and stable.";

  const mealPerformance = Object.entries(mealStats).map(([meal, stats]) => ({
    x: meal,
    y: parseFloat((stats.waste / stats.count).toFixed(1)),
  }));

  const trendData = logs.slice(-14).map((log) => ({
    x: log.date?.slice(5) ?? "",  // "MM-DD"
    y: log.leftovers ?? 0,
  }));

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.loadingWrap}>
        <ActivityIndicator color={C.emerald600} size="large" />
        <Text style={s.loadingText}>Loading dashboard…</Text>
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: C.gray50 }}>
      <SlideDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogout={logout}
      />

      <ScrollView
        style={s.bg}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.emerald600} />}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => setDrawerOpen(true)}
            style={s.menuBtn}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <Menu size={22} color={C.gray700} />
          </TouchableOpacity>
          <Text style={s.heading}>Dashboard</Text>
          <View style={{ width: 38 }} />
        </View>

      {error ? (
        <View style={s.errorBanner}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Summary cards — 2×2 grid */}
      <View style={s.grid}>
        <SummaryCard
          title="Attendance"
          value={totalAttendance}
          icon={<CalendarDays size={16} color={C.emerald600} />}
        />
        <SummaryCard
          title="Prepared"
          value={totalPrepared}
          icon={<PieChart size={16} color={C.indigo600} />}
        />
      </View>
      <View style={[s.grid, { marginTop: 10 }]}>
        <SummaryCard
          title="Leftovers"
          value={totalLeftovers}
          icon={<TrendingDown size={16} color={C.red600} />}
        />
        <SummaryCard
          title="Waste %"
          value={`${wastePercent}%`}
          icon={<TrendingUp size={16} color={C.yellow600} />}
          valueColor={wasteColor(wastePercent)}
        />
      </View>

      {/* Line chart — Waste Trend */}
      <SectionCard title="Waste Trend (Last 14 Days)">
        {trendData.length > 0 ? (
          <View style={{ height: 120, overflow: "hidden", marginTop: -10, marginBottom: 10 }}>
            <VictoryChart
              height={140}
              padding={{ top: 10, bottom: 10, left: 35, right: 15 }}
              containerComponent={
                <VictoryVoronoiContainer
                  labels={({ datum }) => `${datum.y}`}
                  labelComponent={<VictoryTooltip />}
                />
              }
            >
              <VictoryAxis
                style={{
                  axis:       { stroke: "transparent" },
                  tickLabels: { fontSize: 0, fill: "transparent" },
                  grid:       { stroke: "transparent" },
                }}
              />
              <VictoryAxis
                dependentAxis
                style={{
                  axis:       { stroke: "transparent" },
                  tickLabels: { fontSize: 8, fill: C.slate400 },
                  grid:       { stroke: C.slate200, strokeDasharray: "4,4" },
                }}
              />
              <VictoryLine
                data={[...trendData].sort((a, b) =>
                  new Date(a.x).getTime() - new Date(b.x).getTime()
                )}
                interpolation="monotoneX"
                style={{
                  data: { stroke: C.emerald600, strokeWidth: 2 },
                }}
              />
            </VictoryChart>
          </View>
        ) : (
          <Text style={s.emptyChart}>No data yet.</Text>
        )}
      </SectionCard>

      {/* Bar chart — Meal Performance */}
      <SectionCard title="Meal Performance (Avg Waste)">
        {mealPerformance.length > 0 ? (
          <VictoryChart
            height={220}
            domainPadding={{ x: 60, y: 35 }}
            padding={{ top: 10, bottom: 50, left: 40, right: 20 }}
          >
            <VictoryAxis
              style={{
                axis:       { stroke: C.slate200 },
                tickLabels: { fontSize: 9, fill: C.slate400, angle: -30, textAnchor: "end" },
                grid:       { stroke: "transparent" },
              }}
            />
            <VictoryAxis
              dependentAxis
              style={{
                axis:       { stroke: "transparent" },
                tickLabels: { fontSize: 9, fill: C.slate400 },
                grid:       { stroke: C.slate200, strokeDasharray: "4,4" },
              }}
            />
            <VictoryBar
              data={mealPerformance}
              style={{ data: { fill: C.indigo400, borderRadius: 4 } }}
              labels={({ datum }) => `${datum.y}`}
              labelComponent={<VictoryTooltip />}
            />
          </VictoryChart>
        ) : (
          <Text style={s.emptyChart}>No meal data yet.</Text>
        )}
      </SectionCard>

      {/* Insight */}
      <InsightBanner message={insight} />

      {/* Predict button */}
      <TouchableOpacity
        onPress={predictNextWeek}
        disabled={predicting}
        style={[s.predictBtn, predicting && s.predictBtnDisabled]}
        accessibilityRole="button"
        accessibilityState={{ busy: predicting }}
      >
        {predicting
          ? <ActivityIndicator color={C.white} size="small" style={{ marginRight: 8 }} />
          : <Lightbulb size={16} color={C.white} style={{ marginRight: 6 }} />
        }
        <Text style={s.predictBtnText}>
          {predicting ? "Predicting…" : "Predict Next Week"}
        </Text>
      </TouchableOpacity>

      {/* Weekly prediction results */}
      {weeklyPrediction && (
        <SectionCard title="Weekly Schedule Comparison">
          <View style={{ gap: 10 }}>
            {Object.entries(weeklyPrediction).map(([day, result]) => (
              <DayPredictionCard
                key={day}
                day={day}
                result={result}
                defaultMeal={defaultSchedule[day]}
              />
            ))}
          </View>
        </SectionCard>
      )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: C.gray50,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    gap: 16,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: C.gray900,
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
  logoutBtn: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.gray200,
    backgroundColor: C.white,
  },

  // Error
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: C.red600,
    fontSize: 13,
  },

  // Grid (2 cards per row)
  grid: {
    flexDirection: "row",
    gap: 10,
  },

  // Section card
  sectionCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
    borderWidth: 1,
    borderColor: C.gray200,
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.gray900,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  emptyChart: {
    textAlign: "center",
    color: C.gray400,
    fontSize: 13,
    paddingVertical: 32,
  },

  // Insight
  insightBanner: {
    backgroundColor: C.emerald50,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.emerald100,
  },
  insightText: {
    color: C.emerald700,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
  },

  // Predict button
  predictBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.indigo600,
    borderRadius: 14,
    paddingVertical: 14,
  },
  predictBtnDisabled: {
    backgroundColor: C.indigo400,
  },
  predictBtnText: {
    color: C.white,
    fontSize: 15,
    fontWeight: "700",
  },

  // Day prediction card
  dayCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.gray200,
    gap: 10,
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  dayPill: {
    backgroundColor: C.gray900,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  dayPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.white,
    letterSpacing: 0.5,
  },
  dayLabel: {
    fontSize: 10,
    color: C.gray400,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  dayMealRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dayMealCol: {
    flex: 1,
  },
  dayMealText: {
    fontSize: 13,
    fontWeight: "600",
    color: C.gray900,
    lineHeight: 18,
  },
  dayArrowWrap: {
    width: 24,
    alignItems: "center",
  },
  dayArrow: {
    fontSize: 14,
    color: C.gray300,
    fontWeight: "300",
  },
  dayWasteRow: {
    gap: 5,
  },
  dayWasteLabel: {
    fontSize: 11,
    color: C.gray500,
    fontWeight: "500",
  },
  dayWasteBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: C.gray100,
    overflow: "hidden",
  },
  dayWasteBarFill: {
    height: 4,
    borderRadius: 2,
  },
  dayExplanation: {
    fontSize: 11,
    color: C.gray500,
    lineHeight: 16,
  },

  // Loading
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: C.gray50,
    gap: 12,
  },
  loadingText: {
    color: C.gray500,
    fontSize: 14,
  },
});