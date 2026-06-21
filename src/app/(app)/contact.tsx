import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
} from 'react-native';
import {
  Mail,
  Phone,
  User,
  MessageSquare,
  Send,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  X,
} from 'lucide-react-native';
import CountryFlag from 'react-native-country-flag';

// ---- Theme tokens (mirrors the web app's --sf-* CSS variables) ----
const COLORS = {
  primary: '#059669',
  primaryTint: 'rgba(5, 150, 105, 0.1)',
  bg: '#ffffff',
  card: '#ffffff',
  text: '#111827',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  danger: '#ef4444',
  dangerTint: 'rgba(239, 68, 68, 0.1)',
  dangerText: '#991b1b',
} as const;

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://foodwasteai-production.up.railway.app';

interface Country {
  code: string;
  name: string;
}

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

type FormField = keyof ContactFormData;

const COUNTRIES: Country[] = [
  { code: '+1', name: 'US' },
  { code: '+1', name: 'CA' },
  { code: '+44', name: 'GB' },
  { code: '+30', name: 'GR' },
  { code: '+49', name: 'DE' },
  { code: '+33', name: 'FR' },
  { code: '+39', name: 'IT' },
  { code: '+34', name: 'ES' },
  { code: '+31', name: 'NL' },
  { code: '+32', name: 'BE' },
  { code: '+41', name: 'CH' },
  { code: '+43', name: 'AT' },
  { code: '+351', name: 'PT' },
  { code: '+48', name: 'PL' },
  { code: '+46', name: 'SE' },
  { code: '+47', name: 'NO' },
  { code: '+45', name: 'DK' },
  { code: '+358', name: 'FI' },
  { code: '+353', name: 'IE' },
  { code: '+420', name: 'CZ' },
  { code: '+36', name: 'HU' },
  { code: '+40', name: 'RO' },
  { code: '+359', name: 'BG' },
  { code: '+385', name: 'HR' },
  { code: '+7', name: 'RU' },
  { code: '+380', name: 'UA' },
  { code: '+90', name: 'TR' },
  { code: '+972', name: 'IL' },
  { code: '+971', name: 'AE' },
  { code: '+966', name: 'SA' },
  { code: '+91', name: 'IN' },
  { code: '+86', name: 'CN' },
  { code: '+81', name: 'JP' },
  { code: '+82', name: 'KR' },
  { code: '+65', name: 'SG' },
  { code: '+61', name: 'AU' },
  { code: '+64', name: 'NZ' },
  { code: '+55', name: 'BR' },
  { code: '+52', name: 'MX' },
  { code: '+54', name: 'AR' },
  { code: '+27', name: 'ZA' },
  { code: '+20', name: 'EG' },
  { code: '+234', name: 'NG' },
  { code: '+254', name: 'KE' },
];

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [countryCode, setCountryCode] = useState<Country>(
    COUNTRIES.find((c) => c.name === 'GR') as Country
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field: FormField) => (value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search)
  );

  const openPicker = () => {
    setSearch('');
    setPickerVisible(true);
  };

  const selectCountry = (c: Country) => {
    setCountryCode(c);
    setPickerVisible(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    const fullPhone = formData.phone
      ? `${countryCode.code}${formData.phone}`
      : '';

    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, phone: fullPhone }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to send message');
      }

      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const isValid =
    formData.name.trim().length > 0 &&
    formData.email.trim().length > 0 &&
    formData.message.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <Mail size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Get in Touch</Text>
          <Text style={styles.subtitle}>
            Have questions about SmartFoodSave? We'd love to hear from you!
          </Text>
        </View>

        {/* Success Message */}
        {success && (
          <View style={styles.successBanner}>
            <CheckCircle size={24} color={COLORS.primary} />
            <View style={styles.bannerTextWrap}>
              <Text style={styles.successTitle}>Message sent successfully!</Text>
              <Text style={styles.successBody}>
                We'll get back to you within 24-48 hours.
              </Text>
            </View>
          </View>
        )}

        {/* Error Message */}
        {error ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={24} color={COLORS.danger} />
            <View style={styles.bannerTextWrap}>
              <Text style={styles.errorTitle}>Error sending message</Text>
              <Text style={styles.errorBody}>{error}</Text>
            </View>
          </View>
        ) : null}

        {/* Form */}
        <View style={styles.card}>
          {/* Name */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <User size={16} color={COLORS.primary} />
              <Text style={styles.label}>Full Name *</Text>
            </View>
            <TextInput
              value={formData.name}
              onChangeText={updateField('name')}
              placeholder="John Doe"
              placeholderTextColor={COLORS.textMuted}
              style={styles.input}
            />
          </View>

          {/* Email */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Mail size={16} color={COLORS.primary} />
              <Text style={styles.label}>Email Address *</Text>
            </View>
            <TextInput
              value={formData.email}
              onChangeText={updateField('email')}
              placeholder="john@example.com"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          {/* Phone with country code */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Phone size={16} color={COLORS.primary} />
              <Text style={styles.label}>Phone Number (Optional)</Text>
            </View>
            <View style={styles.phoneRow}>
              <Pressable onPress={openPicker} style={styles.countryButton}>
                <CountryFlag isoCode={countryCode.name} size={16} style={styles.flagIcon} />
                <Text style={styles.countryCodeText}>{countryCode.code}</Text>
                <ChevronDown size={14} color={COLORS.textMuted} />
              </Pressable>

              <TextInput
                value={formData.phone}
                onChangeText={updateField('phone')}
                placeholder="69XXXXXXXX"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                style={[styles.input, styles.phoneInput]}
              />
            </View>
          </View>

          {/* Message */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <MessageSquare size={16} color={COLORS.primary} />
              <Text style={styles.label}>Message *</Text>
            </View>
            <TextInput
              value={formData.message}
              onChangeText={updateField('message')}
              placeholder="Tell us what's on your mind..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={5}
              style={[styles.input, styles.textarea]}
            />
          </View>

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading || !isValid}
            style={[
              styles.submitButton,
              (loading || !isValid) && styles.submitButtonDisabled,
            ]}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#ffffff" />
                <Text style={styles.submitText}>Sending...</Text>
              </>
            ) : (
              <>
                <Send size={20} color="#ffffff" />
                <Text style={styles.submitText}>Send Message</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.privacyNote}>
            We respect your privacy. Your message will only be used to respond
            to your inquiry.
          </Text>
        </View>

        {/* Info Cards */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <View style={styles.infoIconBadge}>
              <Mail size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.infoTitle}>Email</Text>
            <Text style={styles.infoBody}>smartfoodsave@gmail.com</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoIconBadge}>
              <Phone size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.infoTitle}>Phone</Text>
            <Text style={styles.infoBody}>+30 6941625842</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoIconBadge}>
              <MessageSquare size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.infoTitle}>Response Time</Text>
            <Text style={styles.infoBody}>24-48 hours</Text>
          </View>
        </View>
      </ScrollView>

      {/* Country code picker — native modal action sheet */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPickerVisible(false)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select country code</Text>
            <Pressable onPress={() => setPickerVisible(false)} hitSlop={8}>
              <X size={22} color={COLORS.textMuted} />
            </Pressable>
          </View>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search country or code..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
            autoFocus
          />

          <FlatList
            data={filteredCountries}
            keyExtractor={(item, idx) => `${item.name}-${item.code}-${idx}`}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No results</Text>
            }
            renderItem={({ item }: { item: Country }) => {
              const isSelected =
                countryCode.name === item.name && countryCode.code === item.code;
              return (
                <Pressable
                  onPress={() => selectCountry(item)}
                  style={[
                    styles.countryRow,
                    isSelected && styles.countryRowSelected,
                  ]}
                >
                  <CountryFlag isoCode={item.name} size={16} style={styles.flagIcon} />
                  <Text
                    style={[
                      styles.countryName,
                      isSelected && styles.countryNameSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.countryCodeMuted}>{item.code}</Text>
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { padding: 20, paddingBottom: 40 },

  header: { alignItems: 'center', marginBottom: 32, marginTop: 20 },
  iconBadge: {
    backgroundColor: COLORS.primaryTint,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  successBanner: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.primaryTint,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.dangerTint,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
  },
  bannerTextWrap: { flex: 1 },
  successTitle: { fontWeight: '600', color: COLORS.primary, marginBottom: 2 },
  successBody: { color: COLORS.primary, opacity: 0.9 },
  errorTitle: { fontWeight: '600', color: COLORS.dangerText, marginBottom: 2 },
  errorBody: { color: COLORS.dangerText },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    gap: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  field: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    color: COLORS.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textarea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },

  phoneRow: { flexDirection: 'row', gap: 8 },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  flagIcon: { borderRadius: 3, overflow: 'hidden' },
  countryCodeText: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  phoneInput: { flex: 1 },

  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },

  privacyNote: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  infoGrid: { marginTop: 32, gap: 16 },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  infoTitle: { fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  infoBody: { color: COLORS.textMuted },

  // Modal / action sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '70%',
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 8,
  },
  separator: { height: 1, backgroundColor: COLORS.border },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    paddingVertical: 24,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  countryRowSelected: { backgroundColor: COLORS.primaryTint, borderRadius: 8 },
  countryName: { flex: 1, fontWeight: '500', color: COLORS.text },
  countryNameSelected: { color: COLORS.primary },
  countryCodeMuted: { color: COLORS.textMuted },
});