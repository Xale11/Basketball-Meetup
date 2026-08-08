import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { User as UserIcon, BookOpen, GraduationCap, CalendarClock, CheckCircle2, ChevronDown, X, Search } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { OnboardingStatus, OnboardingUserForm } from '@/types/user';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ImagePicker } from '@/components/ImagePicker';
import { useFetchUniversities } from '@/hooks/universities/useFetchUniversities';
import { useFetchSocietiesByUniId } from '@/hooks/societies/useFetchSocietiesByUniId';
import { useOnboardUser } from '@/hooks/users/useOnboardUser';
import { Button } from '@/components/ui/Button';
import { TextInputField } from '@/components/ui/TextInputField';
import { FormAlert } from '@/components/ui/FormAlert';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { appVariant } from '@/constants/appVariant';
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';

const AC_LOGO = require('@/assets/images/activCampus/logo.png');
const isActivCampus = appVariant === 'activCampus';

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { user, loading, session } = useAuth();
  const { onboardUser, loading: onboardingLoading } = useOnboardUser();
  
  const [step, setStep] = useState(1);
  const [photoUri, setPhotoUri] = useState<string | null>(user?.photo_url ?? null);
  const [selectedSocieties, setSelectedSocieties] = useState<string[]>([]);
  const [societySearch, setSocietySearch] = useState('');
  const [showUniversityPicker, setShowUniversityPicker] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<OnboardingUserForm>({
    id: session?.user?.id ?? '',
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    bio: user?.bio ?? '',
    over_18: user?.over_18 ?? false,
    photo_url: user?.photo_url ?? '',
    university_id: user?.university_id ?? '',
    course: user?.course ?? '',
    degree: user?.degree ?? '',
    year_of_study: user?.year_of_study ?? '',
    societies: [],
  });

  const { universities, isLoading: universitiesLoading, isError: universitiesError } = useFetchUniversities();
  const { societies, isLoading: societiesLoading, isError: societiesError } = useFetchSocietiesByUniId(form.university_id ?? '');

  const isLastStep = step === 4;

  const handleNext = () => {
    setError('');

    if (step === 1) {
      if (!form.first_name.trim() || !form.last_name.trim()) {
        setError('Please enter your first and last name.');
        return;
      }
    }

    if (step === 3) {
      // University is optional. If the user picked one, it must be non-empty.
      if (form.university_id != null && form.university_id !== '' && !form.university_id.trim()) {
        setError('Please select a University');
        return;
      }
    }

    if (isLastStep) {
      handleFinish();
      return;
    }

    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (step === 1) {
      router.back();
      return;
    }
    setError('');
    setStep((prev) => prev - 1);
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const handleFinish = async () => {
    try {
      setSubmitting(true);
      setError('');

      await onboardUser({
        form: {
          ...form,
          id: form.id || session?.user?.id || '',
          societies: selectedSocieties,
        },
        photoUri: photoUri ?? undefined,
      });

      // No navigation here — once the profile row exists the route guard in
      // app/_layout.tsx releases the onboarding group and swaps to the app.
    } catch (e) {
      setError('Something went wrong while saving your profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openUniversityPicker = () => {
    setShowUniversityPicker(true);
  }

  const handleUniversitySelect = (university_id: string) => {
    setForm(prev => ({
      ...prev,
      university_id: university_id,
    }));
    setSelectedSocieties([]);
    setSocietySearch('');
    setShowUniversityPicker(false);
  }

  const selectedUniversity = universities.find(u => u.id === form.university_id);
  const selectedSocietiesNames = societies
    .filter(s => selectedSocieties.includes(s.id))
    .map(s => s.name);

  const normalizedSocietyQuery = societySearch.trim().toLowerCase();
  // `societies.name` is nullable in the schema — a null used to throw here on
  // both the search filter and the sort comparator.
  const filteredSocieties = societies
    .filter((s) => {
      if (!normalizedSocietyQuery) return true;
      return (s.name ?? '').toLowerCase().includes(normalizedSocietyQuery);
    })
    .sort((a, b) => {
      const aSelected = selectedSocieties.includes(a.id);
      const bSelected = selectedSocieties.includes(b.id);
      if (aSelected !== bSelected) return aSelected ? -1 : 1;
      return (a.name ?? '').localeCompare(b.name ?? '');
    })
    .slice(0, 5);

  const toggleSociety = (societyId: string) => {
    setSelectedSocieties(prev => 
      prev.includes(societyId)
        ? prev.filter(id => id !== societyId)
        : [...prev, societyId]
    );
  };

  // Keep the submitted form state in sync with what the user selected in the UI.
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      societies: selectedSocieties,
    }));
  }, [selectedSocieties]);

  if (loading || submitting || onboardingLoading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              {isActivCampus ? (
                <Image
                  source={AC_LOGO}
                  resizeMode="contain"
                  style={styles.brandLogo}
                  accessibilityRole="image"
                  accessibilityLabel="Active Campus"
                />
              ) : (
                <View style={styles.logo}>
                  <Text style={styles.logoText}>🏀</Text>
                </View>
              )}
              <Text style={styles.title}>Set up your profile</Text>
              <Text style={styles.subtitle}>
                {isActivCampus
                  ? 'Tell us a bit about yourself so we can show you the right activities.'
                  : 'Tell other hoopers a bit about yourself so we can match you with the right games.'}
              </Text>

              <View style={styles.stepIndicator}>
                {[1, 2, 3, 4].map((s) => {
                  const active = s === step;
                  const completed = s < step;
                  return (
                    <View
                      key={s}
                      style={[
                        styles.stepDot,
                        active && styles.stepDotActive,
                        completed && styles.stepDotCompleted,
                      ]}
                    />
                  );
                })}
              </View>
            </View>

            <View style={styles.form}>
              {error ? <FormAlert message={error} style={styles.errorSpacing} /> : null}

              {step === 1 && (
                <View>
                  <Text style={styles.sectionTitle}>Basic info</Text>
                  <TextInputField
                    icon={UserIcon}
                    placeholder="First name"
                    value={form.first_name}
                    onChangeText={(text) => setForm((prev) => ({ ...prev, first_name: text }))}
                    autoCapitalize="words"
                    style={styles.inputSpacing}
                  />

                  <TextInputField
                    icon={UserIcon}
                    placeholder="Last name"
                    value={form.last_name}
                    onChangeText={(text) => setForm((prev) => ({ ...prev, last_name: text }))}
                    autoCapitalize="words"
                    style={styles.inputSpacing}
                  />

                  <ToggleRow
                    label="Are you over 18?"
                    sublabel="You must be 18+ to join games and events."
                    value={form.over_18}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, over_18: value }))}
                    style={styles.toggleRow}
                  />

                  <View style={styles.photoSection}>
                    <Text style={styles.photoLabel}>Profile Photo (Optional)</Text>
                    <ImagePicker
                      selectedImage={photoUri || undefined}
                      onImageSelected={setPhotoUri}
                      onImageRemoved={() => setPhotoUri(null)}
                      placeholder="Add Profile Photo"
                    />
                  </View>
                </View>
              )}

              {step === 2 && (
                <View>
                  <Text style={styles.sectionTitle}>About you</Text>
                  <TextInputField
                    icon={BookOpen}
                    placeholder="Share your playing style, favorite position, or anything you'd like other players to know."
                    value={form.bio ?? ""}
                    onChangeText={(text) => setForm((prev) => ({ ...prev, bio: text }))}
                    multiline
                    numberOfLines={4}
                    multilineHeight={120}
                  />
                </View>
              )}

              {step === 3 && (
                <View>
                  <Text style={styles.sectionTitle}>University (optional)</Text>
                  <TouchableOpacity
                    style={styles.universityPicker}
                    onPress={openUniversityPicker}
                  >
                    <GraduationCap size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                    <Text style={[styles.universityPickerText, !selectedUniversity && styles.placeholderText]}>
                      {selectedUniversity ? selectedUniversity.name : 'Select University'}
                    </Text>
                    <ChevronDown size={20} color={theme.colors.textMuted} />
                  </TouchableOpacity>

                  <TextInputField
                    icon={BookOpen}
                    placeholder="Course"
                    value={form.course ?? ""}
                    onChangeText={(text) => setForm((prev) => ({ ...prev, course: text }))}
                    style={styles.inputSpacing}
                  />

                  {/* Degree and year of study (AC-26). Both optional — they
                      only enrich the profile header's "{degree} ({year})". */}
                  <TextInputField
                    icon={GraduationCap}
                    placeholder="Degree (optional) — e.g. BSc Computer Science"
                    value={form.degree ?? ''}
                    onChangeText={(text) => setForm((prev) => ({ ...prev, degree: text }))}
                    style={styles.inputSpacing}
                  />

                  <TextInputField
                    icon={CalendarClock}
                    placeholder="Year of study (optional) — e.g. 2nd Year"
                    value={form.year_of_study ?? ''}
                    onChangeText={(text) =>
                      setForm((prev) => ({ ...prev, year_of_study: text }))
                    }
                    style={styles.inputSpacing}
                  />
                </View>
              )}

              {step === 4 && (
                <View>
                  <Text style={styles.sectionTitle}>Societies (optional)</Text>
                  <Text style={styles.sectionSubtitle}>
                    Select the societies you're part of
                  </Text>

                  <TextInputField
                    icon={Search}
                    placeholder="Search societies"
                    value={societySearch}
                    onChangeText={setSocietySearch}
                    autoCapitalize="none"
                    style={styles.inputSpacing}
                  />

                  {societiesLoading ? (
                    <Text style={styles.societyHelperText}>Loading societies…</Text>
                  ) : societiesError ? (
                    <Text style={styles.societyHelperText}>Couldn’t load societies. Try again.</Text>
                  ) : null}

                  {!societiesLoading && filteredSocieties.length === 0 ? (
                    <Text style={styles.noSocietiesText}>
                      No societies match “{societySearch.trim()}”.
                    </Text>
                  ) : null}

                  <View style={styles.societiesContainer}>
                    {filteredSocieties.map((society) => {
                      const isSelected = selectedSocieties.includes(society.id);
                      return (
                        <TouchableOpacity
                          key={society.id}
                          style={[
                            styles.societyChip,
                            isSelected && styles.societyChipSelected,
                          ]}
                          onPress={() => toggleSociety(society.id)}
                        >
                          <Text
                            style={[
                              styles.societyChipText,
                              isSelected && styles.societyChipTextSelected,
                            ]}
                          >
                            {society.name}
                          </Text>
                          {isSelected && (
                            <View style={styles.societyChipCheck}>
                              <CheckCircle2 size={16} color={theme.colors.accentTone.text} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {selectedSocieties.length > 0 && (
                    <View style={styles.selectedSocietiesContainer}>
                      <Text style={styles.selectedSocietiesLabel}>Selected:</Text>
                      <Text style={styles.selectedSocietiesText}>
                        {selectedSocietiesNames.join(', ')}
                      </Text>
                    </View>
                  )}

                  <View style={styles.summaryCard}>
                    <CheckCircle2 size={22} color={theme.colors.successTone.solid} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={styles.summaryTitle}>You're almost ready to hoop</Text>
                      <Text style={styles.summaryText}>
                        Finish this step to complete onboarding and start joining games.
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.footer}>
              <View style={styles.footerButtons}>
                <Button
                  label={step === 1 ? 'Back' : 'Previous'}
                  variant="secondary"
                  onPress={handleBack}
                  style={styles.footerButton}
                />
                <Button
                  label={isLastStep ? 'Finish' : 'Continue'}
                  onPress={handleNext}
                  style={styles.footerButton}
                />
              </View>
              <Button label="Skip for now" variant="ghost" onPress={handleSkip} style={styles.skipButton} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* University Picker Modal */}
      <Modal
        visible={showUniversityPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUniversityPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select University</Text>
              <TouchableOpacity onPress={() => setShowUniversityPicker(false)}>
                <X size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={universities}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    form.university_id === item.id && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    handleUniversitySelect(item.id);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      form.university_id === item.id && styles.modalItemTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {form.university_id === item.id && (
                    <CheckCircle2 size={20} color={theme.colors.accentHi} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.colors.canvas,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: t.spacing.xl,
      paddingVertical: t.spacing.xxl,
      justifyContent: 'space-between',
    },
    header: {
      alignItems: 'center',
      marginBottom: t.spacing.xl,
    },
    logo: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: t.colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: t.spacing.lg,
    },
    logoText: {
      fontSize: 30,
    },
    brandLogo: {
      width: 96,
      height: 96,
      marginBottom: t.spacing.xs,
    },
    title: {
      ...t.typography.h1,
      fontSize: 26,
      color: t.colors.textPrimary,
      marginBottom: t.spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      ...t.typography.body,
      color: t.colors.textMuted,
      textAlign: 'center',
      lineHeight: 21,
    },
    stepIndicator: {
      flexDirection: 'row',
      marginTop: t.spacing.lg,
      gap: t.spacing.sm,
    },
    stepDot: {
      height: 6,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.surfaceAlt,
      flex: 1,
    },
    stepDotActive: {
      backgroundColor: t.colors.accent,
    },
    // Completed steps read as accent-but-spent: the tinted fill rather than
    // the solid one, so the current step stays the brightest thing in the row.
    stepDotCompleted: {
      backgroundColor: t.colors.accentTone.border,
    },
    form: {
      flex: 1,
      marginTop: t.spacing.sm,
    },
    errorSpacing: {
      marginBottom: t.spacing.lg,
    },
    inputSpacing: {
      marginBottom: t.spacing.lg,
    },
    sectionTitle: {
      ...t.typography.h3,
      color: t.colors.textPrimary,
      marginBottom: t.spacing.lg,
    },
    inputIcon: {
      marginRight: t.spacing.md,
    },
    universityPicker: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.colors.surfaceInset,
      borderRadius: t.radius.card,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: 4,
      marginBottom: t.spacing.lg,
      borderWidth: 1,
      borderColor: t.colors.borderStrong,
    },
    universityPickerText: {
      ...t.typography.body,
      flex: 1,
      fontSize: 15,
      paddingVertical: 14,
      color: t.colors.textPrimary,
    },
    toggleRow: {
      marginTop: t.spacing.sm,
      padding: t.spacing.lg,
      borderRadius: t.radius.card,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    summaryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: t.spacing.lg,
      borderRadius: t.radius.card,
      backgroundColor: t.colors.successTone.bg,
      borderWidth: 1,
      borderColor: t.colors.successTone.border,
      marginTop: t.spacing.sm,
    },
    summaryTitle: {
      ...t.typography.bodyStrong,
      fontSize: 15,
      color: t.colors.textPrimary,
      marginBottom: 4,
    },
    summaryText: {
      ...t.typography.caption,
      color: t.colors.textBody,
    },
    footer: {
      marginTop: t.spacing.xl,
    },
    footerButtons: {
      flexDirection: 'row',
      gap: t.spacing.md,
    },
    footerButton: {
      flex: 1,
    },
    skipButton: {
      marginTop: 4,
    },
    photoSection: {
      marginTop: t.spacing.sm,
    },
    photoLabel: {
      ...t.typography.label,
      fontSize: 15,
      color: t.colors.textPrimary,
      marginBottom: t.spacing.md,
    },
    placeholderText: {
      color: t.colors.textFaint,
    },
    societyHelperText: {
      ...t.typography.caption,
      color: t.colors.textMuted,
      marginBottom: t.spacing.sm,
    },
    noSocietiesText: {
      ...t.typography.caption,
      color: t.colors.textMuted,
      marginBottom: t.spacing.sm,
    },
    societiesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: t.spacing.sm,
      marginTop: t.spacing.sm,
    },
    societyChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: t.spacing.lg,
      paddingVertical: 10,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
      marginBottom: t.spacing.sm,
    },
    societyChipSelected: {
      backgroundColor: t.colors.accentTone.bg,
      borderColor: t.colors.accentTone.border,
    },
    societyChipText: {
      ...t.typography.label,
      color: t.colors.textBody,
    },
    societyChipTextSelected: {
      color: t.colors.accentTone.text,
    },
    societyChipCheck: {
      marginLeft: t.spacing.sm,
    },
    selectedSocietiesContainer: {
      marginTop: t.spacing.lg,
      padding: t.spacing.md,
      backgroundColor: t.colors.surfaceInset,
      borderRadius: t.radius.chip,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    selectedSocietiesLabel: {
      ...t.typography.microLabel,
      fontSize: 11,
      color: t.colors.textMuted,
      marginBottom: 4,
    },
    selectedSocietiesText: {
      ...t.typography.body,
      color: t.colors.textPrimary,
    },
    sectionSubtitle: {
      ...t.typography.body,
      color: t.colors.textMuted,
      marginBottom: t.spacing.lg,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: t.colors.overlay,
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: t.colors.surface,
      borderTopLeftRadius: t.radius.hero,
      borderTopRightRadius: t.radius.hero,
      borderTopWidth: 1,
      borderColor: t.colors.chromeBorder,
      maxHeight: '80%',
      paddingBottom: t.spacing.xxl,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: t.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    modalTitle: {
      ...t.typography.h2,
      color: t.colors.textPrimary,
    },
    modalItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    modalItemSelected: {
      backgroundColor: t.colors.accentTone.bg,
    },
    modalItemText: {
      ...t.typography.body,
      fontSize: 15,
      color: t.colors.textPrimary,
    },
    modalItemTextSelected: {
      color: t.colors.accentTone.text,
      fontFamily: t.typography.label.fontFamily,
    },
  });

