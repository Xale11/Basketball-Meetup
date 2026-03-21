import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { User as UserIcon, BookOpen, GraduationCap, CheckCircle2, Camera, ChevronDown, X, Search } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { OnboardingStatus, OnboardingUserForm } from '@/types/user';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ImagePicker } from '@/components/ImagePicker';
import useFetchUniversities from '@/hooks/universities/useFetchUniversities';
import useFetchSocietiesByUniId from '@/hooks/societies/useFetchSocietiesByUniId';
import useOnboardUser from '@/hooks/users/useOnboardUser';

export default function OnboardingScreen() {
  const { user, loading, session } = useAuth();
  const { onboardUser, loading: onboardingLoading } = useOnboardUser();
  
  const [step, setStep] = useState(1);
  const [photoUri, setPhotoUri] = useState<string | null>(user?.photoUrl ?? null);
  const [selectedSocieties, setSelectedSocieties] = useState<string[]>([]);
  const [societySearch, setSocietySearch] = useState('');
  const [showUniversityPicker, setShowUniversityPicker] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<OnboardingUserForm>({
    id: session?.user?.id ?? '',
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    bio: user?.bio ?? '',
    over18: user?.over18 ?? false,
    photoUrl: user?.photoUrl ?? '',
    universityId: user?.universityId ?? '',
    course: user?.course ?? '',
    societies: [],
  });

  const { universities, isLoading: universitiesLoading, isError: universitiesError, fetchUniversities } = useFetchUniversities();
  const { societies, isLoading: societiesLoading, isError: societiesError, fetchSocieties } = useFetchSocietiesByUniId(form.universityId ?? '');

  const isLastStep = step === 4;

  const handleNext = () => {
    setError('');

    if (step === 1) {
      if (!form.firstName.trim() || !form.lastName.trim()) {
        setError('Please enter your first and last name.');
        return;
      }
    }

    if (step === 3) {
      // University is optional. If the user picked one, it must be non-empty.
      if (form.universityId != null && form.universityId !== '' && !form.universityId.trim()) {
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

      router.replace('/(tabs)');
    } catch (e) {
      setError('Something went wrong while saving your profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openUniversityPicker = () => {
    setShowUniversityPicker(true);
    fetchUniversities();
  }

  const handleUniversitySelect = (universityId: string) => {
    setForm(prev => ({
      ...prev,
      universityId,
    }));
    setSelectedSocieties([]);
    setSocietySearch('');
    setShowUniversityPicker(false);
  }

  const selectedUniversity = universities.find(u => u.id === form.universityId);
  const selectedSocietiesNames = societies
    .filter(s => selectedSocieties.includes(s.id))
    .map(s => s.name);

  const normalizedSocietyQuery = societySearch.trim().toLowerCase();
  const filteredSocieties = societies
    .filter((s) => {
      if (!normalizedSocietyQuery) return true;
      return s.name.toLowerCase().includes(normalizedSocietyQuery);
    })
    .sort((a, b) => {
      const aSelected = selectedSocieties.includes(a.id);
      const bSelected = selectedSocieties.includes(b.id);
      if (aSelected !== bSelected) return aSelected ? -1 : 1;
      return a.name.localeCompare(b.name);
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

  useEffect(() => {
    if (step === 4 && form.universityId) {
      fetchSocieties();
    }
  }, [step, form.universityId]);

  if (loading || submitting || onboardingLoading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>🏀</Text>
              </View>
              <Text style={styles.title}>Set up your profile</Text>
              <Text style={styles.subtitle}>
                Tell other hoopers a bit about yourself so we can match you with the right games.
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
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {step === 1 && (
                <View>
                  <Text style={styles.sectionTitle}>Basic info</Text>
                  <View style={styles.inputContainer}>
                    <UserIcon size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="First name"
                      value={form.firstName}
                      onChangeText={(text) =>
                        setForm((prev) => ({ ...prev, firstName: text }))
                      }
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <UserIcon size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Last name"
                      value={form.lastName}
                      onChangeText={(text) =>
                        setForm((prev) => ({ ...prev, lastName: text }))
                      }
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleLabel}>Are you over 18?</Text>
                      <Text style={styles.toggleDescription}>
                        You must be 18+ to join games and events.
                      </Text>
                    </View>
                    <Switch
                      value={form.over18}
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          over18: value,
                        }))
                      }
                      thumbColor={form.over18 ? '#FFFFFF' : '#FFFFFF'}
                      trackColor={{ false: '#E9ECEF', true: '#FF6B35' }}
                    />
                  </View>

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
                  <View style={[styles.inputContainer, styles.textAreaContainer]}>
                    <BookOpen size={20} color="#666" style={styles.inputIconTop} />
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Share your playing style, favorite position, or anything you'd like other players to know."
                      value={form.bio}
                      onChangeText={(text) =>
                        setForm((prev) => ({
                          ...prev,
                          bio: text,
                        }))
                      }
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              )}

              {step === 3 && (
                <View>
                  <Text style={styles.sectionTitle}>University (optional)</Text>
                  <TouchableOpacity
                    style={styles.inputContainer}
                    onPress={openUniversityPicker}
                  >
                    <GraduationCap size={20} color="#666" style={styles.inputIcon} />
                    <Text style={[styles.input, !selectedUniversity && styles.placeholderText]}>
                      {selectedUniversity ? selectedUniversity.name : 'Select University'}
                    </Text>
                    <ChevronDown size={20} color="#666" />
                  </TouchableOpacity>

                  <View style={styles.inputContainer}>
                    <BookOpen size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Course"
                      value={form.course}
                      onChangeText={(text) =>
                        setForm((prev) => ({
                          ...prev,
                          course: text,
                        }))
                      }
                    />
                  </View>
                </View>
              )}

              {step === 4 && (
                <View>
                  <Text style={styles.sectionTitle}>Societies (optional)</Text>
                  <Text style={styles.sectionSubtitle}>
                    Select the societies you're part of
                  </Text>

                  <View style={[styles.inputContainer, styles.societySearchContainer]}>
                    <Search size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Search societies"
                      value={societySearch}
                      onChangeText={setSocietySearch}
                      autoCorrect={false}
                      autoCapitalize="none"
                      clearButtonMode="while-editing"
                    />
                  </View>

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
                              <CheckCircle2 size={16} color="#FFFFFF" />
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
                    <CheckCircle2 size={22} color="#28A745" />
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
                <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
                  <Text style={styles.secondaryButtonText}>
                    {step === 1 ? 'Back' : 'Previous'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                  <Text style={styles.primaryButtonText}>
                    {isLastStep ? 'Finish' : 'Continue'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
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
                <X size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={universities}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    form.universityId === item.id && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    handleUniversitySelect(item.id);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      form.universityId === item.id && styles.modalItemTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {form.universityId === item.id && (
                    <CheckCircle2 size={20} color="#FF6B35" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  stepIndicator: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 8,
  },
  stepDot: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#E9ECEF',
    flex: 1,
  },
  stepDotActive: {
    backgroundColor: '#FF6B35',
  },
  stepDotCompleted: {
    backgroundColor: '#FFC2A3',
  },
  form: {
    flex: 1,
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  inputIcon: {
    marginRight: 12,
  },
  inputIconTop: {
    marginRight: 12,
    marginTop: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
    color: '#1A1A1A',
  },
  textAreaContainer: {
    alignItems: 'flex-start',
  },
  textArea: {
    minHeight: 120,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 13,
    color: '#666',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#E8F5E8',
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 13,
    color: '#4B5563',
  },
  footer: {
    marginTop: 24,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  skipButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'underline',
  },
  photoSection: {
    marginTop: 8,
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  societySearchContainer: {
    marginBottom: 8,
  },
  societyHelperText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  noSocietiesText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  societiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  societyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 8,
  },
  societyChipSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  societyChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  societyChipTextSelected: {
    color: '#FFFFFF',
  },
  societyChipCheck: {
    marginLeft: 8,
  },
  selectedSocietiesContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  selectedSocietiesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  selectedSocietiesText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  modalItemSelected: {
    backgroundColor: '#FFF4F0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  modalItemTextSelected: {
    fontWeight: '600',
    color: '#FF6B35',
  },
});

