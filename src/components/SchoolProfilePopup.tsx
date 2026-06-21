import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import { Save, Sparkles, X } from "lucide-react-native";
import { auth } from "../firebase";

const C = {
  emerald600: "#059669",
  emerald700: "#047857",
  emerald50: "#ECFDF5",
  emerald100: "#D1FAE5",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray700: "#374151",
  gray900: "#111827",
  red600: "#DC2626",
  white: "#FFFFFF",
};

const API_BASE = "https://foodwasteai-production.up.railway.app/api";

async function getToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

type SchoolProfilePayload = {
  schoolName: string;
  schoolType: string;
  studentCount: string;
  portionSize: string;
  malePercent: number;
  femalePercent: number;
  location: string;
};

function normalizePercents(malePercent: string | number, femalePercent: string | number): [number, number] {
  const m = Number(malePercent);
  const f = Number(femalePercent);

  if (!Number.isFinite(m) && !Number.isFinite(f)) return [0, 0];
  if (Number.isFinite(m) && !Number.isFinite(f)) return [m, 100 - m];
  if (!Number.isFinite(m) && Number.isFinite(f)) return [100 - f, f];

  const total = m + f;
  if (total === 0) return [0, 0];

  const mm = Math.round((m / total) * 100);
  return [mm, 100 - mm];
}

export default function SchoolProfilePopup({
  visible,
  initialSettings,
  onClose,
  onSaved,
}: {
  visible: boolean;
  initialSettings?: Partial<SchoolProfilePayload>;
  onClose: () => void;
  onSaved?: (payload: SchoolProfilePayload) => void;
}) {
  const init = initialSettings ?? {};

  const [schoolName, setSchoolName] = useState(init.schoolName ?? "");
  const [schoolType, setSchoolType] = useState(init.schoolType ?? "Primary");
  const [studentCount, setStudentCount] = useState(String(init.studentCount ?? ""));
  const [portionSize, setPortionSize] = useState(String(init.portionSize ?? ""));
  const [malePercent, setMalePercent] = useState(init.malePercent ?? "");
  const [femalePercent, setFemalePercent] = useState(init.femalePercent ?? "");
  const [location, setLocation] = useState(init.location ?? "");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    setSchoolName(init.schoolName ?? "");
    setSchoolType(init.schoolType ?? "Primary");
    setStudentCount(String(init.studentCount ?? ""));
    setPortionSize(String(init.portionSize ?? ""));
    setMalePercent(init.malePercent ?? "");
    setFemalePercent(init.femalePercent ?? "");
    setLocation(init.location ?? "");
    setSaving(false);
    setSaved(false);
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const payloadDefaults = useMemo(() => {
    const [mRounded, fRounded] = normalizePercents(malePercent, femalePercent);
    return {
      schoolName,
      schoolType,
      studentCount,
      portionSize,
      malePercent: mRounded,
      femalePercent: fRounded,
      location,
    } satisfies SchoolProfilePayload;
  }, [femalePercent, malePercent, portionSize, schoolName, schoolType, studentCount, location]);

  const handleSave = async () => {
    setError("");
    setSaving(true);
    setSaved(false);

    const [mRounded, fRounded] = normalizePercents(malePercent, femalePercent);

    const payload: SchoolProfilePayload = {
      schoolName: schoolName.trim(),
      schoolType,
      studentCount: studentCount.trim(),
      portionSize: portionSize.trim(),
      malePercent: mRounded,
      femalePercent: fRounded,
      location: location.trim(),
    };

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated.");

      const res = await fetch(`${API_BASE}/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save school profile");

      setSaved(true);
      onSaved?.(payload);
      setTimeout(() => setSaved(false), 3000);
      onClose();
    } catch {
      setError("Failed to save school profile");
    } finally {
      setSaving(false);
    }
  };

  const schoolTypeOptions = ["Primary", "Secondary", "High School", "Other"];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.scrim} />

        <View style={styles.modalWrap}>
          <ScrollView
            style={{ width: "100%" }}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Complete your school profile</Text>
                <Text style={styles.subtitle}>Please provide a few details to get started</Text>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
                <X size={20} color={C.gray500} />
              </TouchableOpacity>
            </View>

            {saved ? (
              <View style={styles.savedBanner}>
                <Sparkles size={14} color={C.emerald600} />
                <Text style={styles.savedText}>Saved</Text>
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.formGrid}>
              <View style={styles.span2}>
                <Text style={styles.label}>School name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="School name"
                  value={schoolName}
                  onChangeText={setSchoolName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.span1}>
                <Text style={styles.label}>School type</Text>
              <View style={{ flexDirection: "row" }}>
                {/** Simple tap-to-cycle for native friendliness */}
                  <TouchableOpacity
                    style={styles.pickerLike}
                    onPress={() => {
                      const idx = schoolTypeOptions.indexOf(schoolType);
                      const next = schoolTypeOptions[(idx + 1) % schoolTypeOptions.length];
                      setSchoolType(next);
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={styles.pickerText}>{schoolType}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.span1}>
                <Text style={styles.label}>Student count</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Student count"
                  value={studentCount}
                  onChangeText={setStudentCount}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.span1}>
                <Text style={styles.label}>Portion size</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Portion size"
                  value={portionSize}
                  onChangeText={setPortionSize}
                />
              </View>

              <View style={styles.span1}>
                <Text style={styles.label}>Male %</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Male %"
                  value={String(malePercent ?? "")}
                  onChangeText={setMalePercent as any}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.span1}>
                <Text style={styles.label}>Female %</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Female %"
                  value={String(femalePercent ?? "")}
                  onChangeText={setFemalePercent as any}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.span2}>
                <Text style={styles.label}>Location (city, country)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Location (city, country)"
                  value={location}
                  onChangeText={setLocation}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                  accessibilityRole="button"
                >
                  {saving ? (
                    <ActivityIndicator color={C.white} size="small" style={{ marginRight: 8 }} />
                  ) : (
                    <Save size={16} color={C.white} style={{ marginRight: 6 }} />
                  )}
                  <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save"}</Text>
                </TouchableOpacity>
              </View>
            </View>


          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "center",
  },
  scrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.40)",
  },
  modalWrap: {
    width: "100%",
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    gap: 12,
    maxHeight: "78%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: C.emerald700,
    lineHeight: 24,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: C.gray500,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.gray100,
  },
  savedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.emerald50,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.emerald100,
  },
  savedText: {
    color: C.emerald700,
    fontWeight: "700",
    fontSize: 13,
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: C.red600,
    fontWeight: "600",
    fontSize: 13,
  },
  formGrid: {
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: C.gray700,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: C.gray200,
    backgroundColor: C.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 14,
    color: C.gray900,
  },
  pickerLike: {
    borderWidth: 1,
    borderColor: C.gray200,
    backgroundColor: C.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.gray900,
  },
  span2: {
    width: "100%",
  },
  span1: {
    width: "100%",
  },
  actionsRow: {
    marginTop: 2,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.emerald600,
    borderRadius: 12,
    paddingVertical: 14,
  },
  saveBtnDisabled: {
    backgroundColor: C.gray300,
  },
  saveBtnText: {
    color: C.white,
    fontWeight: "800",
    fontSize: 15,
  },
  debugText: {
    color: C.gray500,
    fontSize: 12,
  },
});

