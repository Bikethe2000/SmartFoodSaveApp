import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Pressable,
  StyleSheet,
  Platform,
  StatusBar,
  Dimensions as RN_Dimensions,
} from "react-native";


import {
  TrendingUp,
  TrendingDown,
  PieChart,
  CalendarDays,
  Lightbulb,
  LogOut,
  LayoutDashboard,
  CalendarRange,
  BarChart2,
  Database,
  Settings,
  Mail,
  X,
} from "lucide-react-native";
import { useRouter } from "expo-router";

const SCREEN_WIDTH = RN_Dimensions.get("window").width;

const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 300);


// ─── Palette (kept consistent with existing screens) ──────────────────────────
const C = {
  emerald600: "#059669",
  emerald700: "#047857",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray700: "#374151",
  gray900: "#111827",
  white: "#FFFFFF",
  red600: "#DC2626",
};

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/(app)/dashboard", icon: <LayoutDashboard size={18} color={C.gray700} /> },
  { label: "Schedule", href: "/(app)/schedule", icon: <CalendarRange size={18} color={C.gray700} /> },
  { label: "Predictions", href: "/(app)/predictions", icon: <BarChart2 size={18} color={C.gray700} /> },
  { label: "Data", href: "/(app)/data", icon: <Database size={18} color={C.gray700} /> },
  { label: "Settings", href: "/(app)/settings", icon: <Settings size={18} color={C.gray700} /> },
  { label: "Contact", href: "/(app)/contact", icon: <Mail size={18} color={C.gray700} /> },
];

export default function SlideDrawer({
  visible,
  onClose,
  onLogout,
}: {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
}) {
  const router = useRouter();
  const slideX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayO = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 20,
        }),
        Animated.timing(overlayO, {
          toValue: 1,
          useNativeDriver: true,
          duration: 200,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: -DRAWER_WIDTH,
          useNativeDriver: true,
          duration: 220,
        }),
        Animated.timing(overlayO, {
          toValue: 0,
          useNativeDriver: true,
          duration: 200,
        }),
      ]).start();
    }
  }, [visible, slideX, overlayO]);

  const navigate = (href: string) => {
    onClose();
    setTimeout(() => router.push(href as any), 240);
  };

  return (
    <>
      {/* Scrim */}
      <Animated.View
        pointerEvents={visible ? "auto" : "none"}
        style={[ds.scrim, { opacity: overlayO }]}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View style={[ds.drawer, { transform: [{ translateX: slideX }] }]}>
        {/* Header */}
        <View style={ds.drawerHeader}>
          <Text style={ds.drawerLogo}>SmartFoodSave</Text>
          <TouchableOpacity
            onPress={onClose}
            style={ds.closeBtn}
            accessibilityLabel="Close menu"
          >
            <X size={20} color={C.gray500} />
          </TouchableOpacity>
        </View>

        {/* Nav items */}
        <View style={ds.navList}>
          {NAV_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.href}
              style={ds.navItem}
              onPress={() => navigate(item.href)}
              accessibilityRole="menuitem"
            >
              <View style={ds.navIcon}>{item.icon}</View>
              <Text style={ds.navLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Divider + Logout */}
        <View style={ds.drawerFooter}>
          <View style={ds.divider} />
          <TouchableOpacity
            style={ds.logoutRow}
            onPress={() => {
              onClose();
              setTimeout(onLogout, 240);
            }}
            accessibilityRole="button"
          >
            <View style={ds.navIcon}>
              <LogOut size={18} color={C.red600} />
            </View>
            <Text style={ds.logoutLabel}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

const ds = StyleSheet.create({
  scrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 100,
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: C.white,
    zIndex: 101,
    paddingTop: Platform.OS === "ios" ? 56 : (StatusBar.currentHeight ?? 24) + 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
  },
  drawerLogo: {
    fontSize: 16,
    fontWeight: "800",
    color: C.emerald700,
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: 4,
  },
  navList: {
    paddingTop: 12,
    paddingHorizontal: 12,
    flex: 1,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
  },
  navIcon: {
    width: 24,
    alignItems: "center",
  },
  navLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: C.gray700,
  },
  drawerFooter: {
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
  },
  divider: {
    height: 1,
    backgroundColor: C.gray100,
    marginBottom: 8,
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  logoutLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: C.red600,
  },
});

