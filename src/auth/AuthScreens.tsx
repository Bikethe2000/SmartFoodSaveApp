/**
 * auth/AuthScreens.tsx
 *
 * SignupScreen  — OTP via /api/auth/send-otp + /api/auth/verify-otp
 * LoginScreen   — Firebase signInWithEmailAndPassword
 */

import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

// ─── Constants ────────────────────────────────────────────────────────────────
const API_BASE      = "https://foodwasteai-production.up.railway.app";
const EMAIL_RE      = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const OTP_LENGTH    = 6;
const OTP_COOLDOWN  = 60; // seconds

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  emerald600:  "#059669",
  emerald700:  "#047857",
  emerald100:  "#D1FAE5",
  emerald50:   "#ECFDF5",
  red50:       "#FEF2F2",
  red200:      "#FECACA",
  red600:      "#DC2626",
  gray50:      "#F9FAFB",
  gray100:     "#F3F4F6",
  gray200:     "#E5E7EB",
  gray300:     "#D1D5DB",
  gray400:     "#9CA3AF",
  gray500:     "#6B7280",
  gray700:     "#374151",
  gray900:     "#111827",
  white:       "#FFFFFF",
  red400:      "#F87171",
  orange400:   "#FB923C",
  yellow400:   "#FACC15",
  green400:    "#4ADE80",
  green600:    "#16A34A",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sanitize(s: string) { return s.trim().replace(/\0/g, ""); }

function calcStrength(pw: string): number {
  let s = 0;
  if (pw.length >= 8)           s++;
  if (pw.length >= 12)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

// ─── Validators ───────────────────────────────────────────────────────────────
function validateName(v: string): string | null {
  if (!v)            return "Full name is required.";
  if (v.length < 2)  return "Name must be at least 2 characters.";
  if (v.length > 100) return "Name is too long.";
  if (/[<>]/.test(v)) return "Name contains invalid characters.";
  return null;
}
function validateEmail(v: string): string | null {
  if (!v)                return "Email is required.";
  if (!EMAIL_RE.test(v)) return "Enter a valid email address.";
  if (v.length > 254)    return "Email address is too long.";
  return null;
}
function validatePassword(v: string): string | null {
  if (!v)            return "Password is required.";
  if (v.length < 8)  return "Password must be at least 8 characters.";
  if (v.length > 128) return "Password is too long.";
  if (calcStrength(v) < 2) return "Too weak — add uppercase letters or numbers.";
  return null;
}

// ─── Password Strength ────────────────────────────────────────────────────────
const STRENGTH_LABELS  = ["", "Very weak", "Weak", "Fair", "Strong", "Very strong"];
const STRENGTH_COLORS  = ["", C.red400, C.orange400, C.yellow400, C.green400, C.green600];

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = calcStrength(password);
  const color = STRENGTH_COLORS[score];
  const textColor = score <= 2 ? C.red600 : score === 3 ? "#92400E" : C.green600;
  return (
    <View style={{ marginTop: 8 }} accessibilityLiveRegion="polite">
      <View style={{ flexDirection: "row", gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <View
            key={i}
            style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= score ? color : C.gray200 }}
          />
        ))}
      </View>
      <Text style={{ fontSize: 12, color: textColor, fontWeight: "500" }}>
        {STRENGTH_LABELS[score]}
        {score < 3 && score > 0 ? " — add uppercase, numbers, or symbols" : ""}
      </Text>
    </View>
  );
}

// ─── OTP Input ────────────────────────────────────────────────────────────────
interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  hasError: boolean;
  disabled: boolean;
}

function OtpInput({ value, onChange, hasError, disabled }: OtpInputProps) {
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? "");
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const focusIndex = (i: number) => {
    inputRefs.current[Math.max(0, Math.min(OTP_LENGTH - 1, i))]?.focus();
  };

  const handleChange = (text: string, i: number) => {
    const digit = text.replace(/\D/g, "").slice(-1);
    const newVal = (value.slice(0, i) + digit + value.slice(i + 1)).slice(0, OTP_LENGTH);
    onChange(newVal);
    if (digit && i < OTP_LENGTH - 1) focusIndex(i + 1);
  };

  const handleKeyPress = (key: string, i: number) => {
    if (key === "Backspace") {
      if (digits[i]) {
        onChange(value.slice(0, i) + value.slice(i + 1));
      } else if (i > 0) {
        onChange(value.slice(0, i - 1) + value.slice(i));
        focusIndex(i - 1);
      }
    }
  };

  return (
    <View style={otpSt.row}>
      {digits.map((digit, i) => (
        <TextInput
          key={i}
          ref={el => { inputRefs.current[i] = el; }}
          value={digit}
          onChangeText={text => handleChange(text, i)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
          keyboardType="number-pad"
          maxLength={1}
          editable={!disabled}
          selectTextOnFocus
          textContentType="oneTimeCode"
          autoComplete={i === 0 ? "sms-otp" : "off"}
          accessibilityLabel={`Digit ${i + 1} of ${OTP_LENGTH}`}
          style={[
            otpSt.cell,
            digit   ? otpSt.cellFilled   : null,
            hasError  ? otpSt.cellError    : null,
            disabled  ? otpSt.cellDisabled : null,
          ]}
        />
      ))}
    </View>
  );
}

const otpSt = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginVertical: 8,
  },
  cell: {
    width: 44,
    height: 56,
    borderWidth: 1.5,
    borderColor: C.gray300,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "600",
    color: C.gray900,
    backgroundColor: C.white,
  },
  cellFilled: {
    borderColor: C.emerald600,
    backgroundColor: C.emerald50,
  },
  cellError: {
    borderColor: C.red400,
    backgroundColor: C.red50,
  },
  cellDisabled: {
    backgroundColor: C.gray100,
    color: C.gray400,
  },
});

// ─── Shared UI primitives ─────────────────────────────────────────────────────
function FieldLabel({ text }: { text: string }) {
  return <Text style={s.label}>{text}</Text>;
}
function FieldError({ msg }: { msg?: string | null }) {
  if (!msg) return null;
  return <Text style={s.fieldError} accessibilityRole="alert">{msg}</Text>;
}
function Banner({ msg, type = "error" }: { msg: string; type?: "error" | "info" }) {
  if (!msg) return null;
  const isInfo = type === "info";
  return (
    <View
      style={[s.banner, isInfo && s.bannerInfo]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Text style={s.bannerIcon}>{isInfo ? "📧" : "⚠️"}</Text>
      <Text style={[s.bannerText, isInfo && s.bannerTextInfo]}>{msg}</Text>
    </View>
  );
}

interface InputProps {
  value: string;
  onChangeText: (t: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
  autoComplete?: "off" | "email" | "name" | "password" | "new-password";
  autoCapitalize?: "none" | "sentences" | "words";
  maxLength?: number;
  hasError?: boolean;
  disabled?: boolean;
  rightSlot?: React.ReactNode;
  returnKeyType?: "next" | "done" | "go";
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
}
// eslint-disable-next-line
function Field(props: InputProps) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [focused, setFocused] = useState(false);
  const border      = props.hasError ? C.red600 : C.gray300;
  const focusBorder = props.hasError ? C.red600 : C.emerald600;
  return (
    <View style={[s.inputWrap, { borderColor: focused ? focusBorder : border }, props.disabled ? s.inputDisabled : null]}>
      {/* eslint-disable-next-line */}
      <TextInput
        ref={props.inputRef}
        style={[s.input, props.rightSlot ? { paddingRight: 44 } : null]}
        value={props.value}
        onChangeText={props.onChangeText}
        onBlur={() => { setFocused(false); props.onBlur?.(); }}
        onFocus={() => setFocused(true)}
        placeholder={props.placeholder}
        placeholderTextColor={C.gray400}
        secureTextEntry={props.secureTextEntry}
        keyboardType={props.keyboardType ?? "default"}
        autoComplete={props.autoComplete ?? "off"}
        autoCapitalize={props.autoCapitalize ?? "none"}
        autoCorrect={false}
        maxLength={props.maxLength}
        editable={!props.disabled}
        returnKeyType={props.returnKeyType}
        onSubmitEditing={props.onSubmitEditing}
        accessibilityState={{ disabled: props.disabled }}
      />
      {props.rightSlot && <View style={s.inputRightSlot}>{props.rightSlot}</View>}
    </View>
  );
}

function PrimaryButton({ label, loading, loadingLabel, onPress, disabled }: {
  label: string; loading?: boolean; loadingLabel?: string; onPress: () => void; disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[s.btn, (disabled || loading) && s.btnDisabled]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading
        ? <><ActivityIndicator color={C.white} size="small" style={{ marginRight: 8 }} /><Text style={s.btnText}>{loadingLabel ?? label}</Text></>
        : <Text style={s.btnText}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

function EyeToggle({ show, onPress }: { show: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" accessibilityLabel={show ? "Hide password" : "Show password"}>
      <MaterialCommunityIcons name={show ? "eye-off-outline" : "eye-outline"} size={22} color={C.gray500} />
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGNUP SCREEN
// ─────────────────────────────────────────────────────────────────────────────
interface SignupProps {
  onSignupSuccess: () => void;
  onNavigateLogin: () => void;
}

type SignupStep = "form" | "otp";

export default function SignupScreen({ onSignupSuccess, onNavigateLogin }: SignupProps) {
  const [step, setStep]           = useState<SignupStep>("form");
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [otpVal, setOtpVal]       = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showCpw, setShowCpw]     = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading]     = useState(false);
  const [cooldown, setCooldown]   = useState(0);

  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const emailRef    = useRef<TextInput>(null);
  const pwRef       = useRef<TextInput>(null);
  const cpwRef      = useRef<TextInput>(null);

  const startCooldown = () => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    let secs = OTP_COOLDOWN;
    setCooldown(secs);
    cooldownRef.current = setInterval(() => {
      secs--;
      setCooldown(secs);
      if (secs <= 0 && cooldownRef.current) {
        clearInterval(cooldownRef.current);
        cooldownRef.current = null;
      }
    }, 1000);
  };

  const clearFieldError = (field: string) =>
    setFieldErrors(prev => ({ ...prev, [field]: null }));

  const validateField = useCallback((field: string, value: string) => {
    const validators: Record<string, (v: string) => string | null> = {
      name:      validateName,
      email:     validateEmail,
      password:  validatePassword,
      confirmPw: (v) => v !== password ? "Passwords do not match." : null,
    };
    const err = validators[field]?.(value) ?? null;
    setFieldErrors(prev => ({ ...prev, [field]: err }));
  }, [password]);

  // Step 1 — validate + send OTP
  const handleSendOtp = useCallback(async () => {
    setSubmitError("");
    const cn = sanitize(name), ce = sanitize(email),
          cp = sanitize(password), cc = sanitize(confirmPw);

    const errs = {
      name:      validateName(cn),
      email:     validateEmail(ce),
      password:  validatePassword(cp),
      confirmPw: cc !== cp ? "Passwords do not match." : null,
    };
    setFieldErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cn, email: ce }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to send verification code.");
      }
      startCooldown();
      setOtpVal("");
      setStep("otp");
    } catch (err: any) {
      setSubmitError(err.message || "Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [name, email, password, confirmPw]);

  // Step 2 — verify OTP + create account
  const handleVerifyOtp = useCallback(async () => {
    if (otpVal.length < OTP_LENGTH) {
      setFieldErrors(prev => ({ ...prev, otp: "Please enter all 6 digits." }));
      return;
    }
    setSubmitError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     sanitize(name),
          email:    sanitize(email),
          password: sanitize(password),
          otp:      otpVal,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Invalid or expired verification code.");
      }
      onSignupSuccess();
    } catch (err: any) {
      setSubmitError(err.message || "Verification failed. Please try again.");
      setFieldErrors(prev => ({ ...prev, otp: " " }));
      setOtpVal("");
    } finally {
      setLoading(false);
    }
  }, [name, email, password, otpVal, onSignupSuccess]);

  // Resend OTP
  const handleResend = useCallback(async () => {
    if (cooldown > 0 || loading) return;
    setSubmitError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: sanitize(name), email: sanitize(email) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to resend code.");
      }
      startCooldown();
      setOtpVal("");
    } catch (err: any) {
      setSubmitError(err.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  }, [cooldown, loading, name, email]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.screen} keyboardShouldPersistTaps="handled">

        <View style={s.logoWrap}>
          <View style={s.logoCircle}>
            <MaterialCommunityIcons name="food-apple" size={40} color={C.emerald700} />
          </View>
          <Text style={s.appName}>SmartFoodSave</Text>
        </View>

        <View style={s.card}>
          <Text style={s.heading}>
            {step === "form" ? "Create your account" : "Check your email"}
          </Text>
          <Text style={s.subheading}>
            {step === "form" ? "Join SmartFoodSave today" : `We sent a 6-digit code to ${email}`}
          </Text>

          {!!submitError && <Banner msg={submitError} type="error" />}

          {/* ── Step 1: Registration form ──────────────────────── */}
          {step === "form" && (
            <>
              <View style={s.fieldGroup}>
                <FieldLabel text="Full name" />
                <Field
                  value={name}
                  onChangeText={v => { setName(v); clearFieldError("name"); setSubmitError(""); }}
                  onBlur={() => validateField("name", sanitize(name))}
                  placeholder="Jane Smith"
                  autoComplete="name"
                  autoCapitalize="words"
                  maxLength={100}
                  hasError={!!fieldErrors.name}
                  disabled={loading}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
                <FieldError msg={fieldErrors.name} />
              </View>

              <View style={s.fieldGroup}>
                <FieldLabel text="Email address" />
                <Field
                  inputRef={emailRef}
                  value={email}
                  onChangeText={v => { setEmail(v); clearFieldError("email"); setSubmitError(""); }}
                  onBlur={() => validateField("email", sanitize(email))}
                  placeholder="you@example.com"
                  autoComplete="email"
                  keyboardType="email-address"
                  maxLength={254}
                  hasError={!!fieldErrors.email}
                  disabled={loading}
                  returnKeyType="next"
                  onSubmitEditing={() => pwRef.current?.focus()}
                />
                <FieldError msg={fieldErrors.email} />
              </View>

              <View style={s.fieldGroup}>
                <FieldLabel text="Password" />
                <Field
                  inputRef={pwRef}
                  value={password}
                  onChangeText={v => { setPassword(v); clearFieldError("password"); setSubmitError(""); }}
                  onBlur={() => validateField("password", sanitize(password))}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  secureTextEntry={!showPw}
                  maxLength={128}
                  hasError={!!fieldErrors.password}
                  disabled={loading}
                  returnKeyType="next"
                  onSubmitEditing={() => cpwRef.current?.focus()}
                  rightSlot={<EyeToggle show={showPw} onPress={() => setShowPw(v => !v)} />}
                />
                <FieldError msg={fieldErrors.password} />
                <PasswordStrength password={password} />
              </View>

              <View style={s.fieldGroup}>
                <FieldLabel text="Confirm password" />
                <Field
                  inputRef={cpwRef}
                  value={confirmPw}
                  onChangeText={v => { setConfirmPw(v); clearFieldError("confirmPw"); setSubmitError(""); }}
                  onBlur={() => validateField("confirmPw", sanitize(confirmPw))}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  secureTextEntry={!showCpw}
                  maxLength={128}
                  hasError={!!fieldErrors.confirmPw}
                  disabled={loading}
                  returnKeyType="done"
                  onSubmitEditing={handleSendOtp}
                  rightSlot={<EyeToggle show={showCpw} onPress={() => setShowCpw(v => !v)} />}
                />
                <FieldError msg={fieldErrors.confirmPw} />
              </View>

              <PrimaryButton
                label="Send verification code"
                loadingLabel="Sending code…"
                loading={loading}
                onPress={handleSendOtp}
              />
            </>
          )}

          {/* ── Step 2: OTP digit input ────────────────────────── */}
          {step === "otp" && (
            <>
              <Banner
                msg={`Enter the 6-digit code we sent to ${email}.`}
                type="info"
              />

              <View style={s.fieldGroup}>
                <FieldLabel text="Verification code" />
                <OtpInput
                  value={otpVal}
                  onChange={val => {
                    setOtpVal(val);
                    clearFieldError("otp");
                    setSubmitError("");
                  }}
                  hasError={!!fieldErrors.otp}
                  disabled={loading}
                />
                <FieldError msg={fieldErrors.otp} />
              </View>

              <PrimaryButton
                label="Verify & create account"
                loadingLabel="Verifying…"
                loading={loading}
                disabled={otpVal.length < OTP_LENGTH}
                onPress={handleVerifyOtp}
              />

              <View style={s.otpFooter}>
                <TouchableOpacity
                  onPress={() => { setStep("form"); setOtpVal(""); setSubmitError(""); }}
                  accessibilityRole="button"
                >
                  <Text style={s.backLink}>← Change email</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleResend}
                  disabled={cooldown > 0 || loading}
                  accessibilityRole="button"
                >
                  <Text style={[s.resendLink, (cooldown > 0 || loading) && s.resendDisabled]}>
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={s.switchRow}>
            <Text style={s.switchText}>Already have an account? </Text>
            <TouchableOpacity onPress={onNavigateLogin} accessibilityRole="link">
              <Text style={s.switchLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
interface LoginProps {
  onLoginSuccess: () => void;
  onNavigateSignup: () => void;
}

export function LoginScreen({ onLoginSuccess, onNavigateSignup }: LoginProps) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading]   = useState(false);

  const pwRef = useRef<TextInput>(null);

  const clearFieldError = (field: string) =>
    setFieldErrors(prev => ({ ...prev, [field]: null }));

  const validateFieldBlur = (field: string, value: string) => {
    const validators: Record<string, (v: string) => string | null> = {
      email:    validateEmail,
      password: (v) => !v ? "Password is required." : null,
    };
    const err = validators[field]?.(value) ?? null;
    setFieldErrors(prev => ({ ...prev, [field]: err }));
  };

  const handleLogin = useCallback(async () => {
    setSubmitError("");
    const ce = sanitize(email), cp = sanitize(password);
    const errs = {
      email:    validateEmail(ce),
      password: !cp ? "Password is required." : null,
    };
    setFieldErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, ce, cp);
      onLoginSuccess();
    } catch (err: any) {
      setSubmitError(err.message ?? "Login failed. Check your email and password.");
    } finally {
      setLoading(false);
    }
  }, [email, password, onLoginSuccess]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.screen} keyboardShouldPersistTaps="handled">

        <View style={s.logoWrap}>
          <View style={s.logoCircle}>
            <MaterialCommunityIcons name="food-apple" size={40} color={C.emerald700} />
          </View>
          <Text style={s.appName}>SmartFoodSave</Text>
        </View>

        <View style={s.card}>
          <Text style={s.heading}>Welcome back</Text>
          <Text style={s.subheading}>Sign in to your account</Text>

          {!!submitError && <Banner msg={submitError} />}

          <View style={s.fieldGroup}>
            <FieldLabel text="Email address" />
            <Field
              value={email}
              onChangeText={v => { setEmail(v); clearFieldError("email"); setSubmitError(""); }}
              onBlur={() => validateFieldBlur("email", sanitize(email))}
              placeholder="you@example.com"
              autoComplete="email"
              keyboardType="email-address"
              maxLength={254}
              hasError={!!fieldErrors.email}
              disabled={loading}
              returnKeyType="next"
              onSubmitEditing={() => pwRef.current?.focus()}
            />
            <FieldError msg={fieldErrors.email} />
          </View>

          <View style={s.fieldGroup}>
            <FieldLabel text="Password" />
            <Field
              inputRef={pwRef}
              value={password}
              onChangeText={v => { setPassword(v); clearFieldError("password"); setSubmitError(""); }}
              onBlur={() => validateFieldBlur("password", sanitize(password))}
              placeholder="Your password"
              autoComplete="password"
              secureTextEntry={!showPw}
              maxLength={128}
              hasError={!!fieldErrors.password}
              disabled={loading}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              rightSlot={<EyeToggle show={showPw} onPress={() => setShowPw(v => !v)} />}
            />
            <FieldError msg={fieldErrors.password} />
          </View>

          <PrimaryButton
            label="Sign in"
            loadingLabel="Signing in…"
            loading={loading}
            onPress={handleLogin}
          />

          <View style={s.switchRow}>
            <Text style={s.switchText}>Don't have an account? </Text>
            <TouchableOpacity onPress={onNavigateSignup} accessibilityRole="link">
              <Text style={s.switchLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: C.emerald50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: C.emerald100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  appName: {
    fontSize: 13,
    fontWeight: "600",
    color: C.emerald700,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: C.gray900,
    textAlign: "center",
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    color: C.gray500,
    textAlign: "center",
    marginBottom: 20,
  },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: C.red50,
    borderWidth: 1,
    borderColor: C.red200,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  bannerInfo: {
    backgroundColor: C.emerald50,
    borderColor: C.emerald100,
  },
  bannerIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    color: C.red600,
    lineHeight: 18,
  },
  bannerTextInfo: {
    color: C.emerald700,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: C.gray700,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 10,
    backgroundColor: C.white,
    overflow: "hidden",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: C.gray900,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 13 : 10,
  },
  inputDisabled: {
    backgroundColor: C.gray100,
  },
  inputRightSlot: {
    paddingRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldError: {
    marginTop: 4,
    fontSize: 12,
    color: C.red600,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.emerald600,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 4,
  },
  btnDisabled: {
    backgroundColor: C.gray300,
  },
  btnText: {
    color: C.white,
    fontSize: 15,
    fontWeight: "600",
  },
  otpFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  backLink: {
    fontSize: 14,
    color: C.gray500,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: "600",
    color: C.emerald600,
  },
  resendDisabled: {
    color: C.gray400,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  switchText: {
    fontSize: 13,
    color: C.gray500,
  },
  switchLink: {
    fontSize: 13,
    fontWeight: "700",
    color: C.emerald600,
  },
});