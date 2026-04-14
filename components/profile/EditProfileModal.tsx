import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { User } from '@/types/user';

interface EditProfileForm {
  first_name: string;
  last_name: string;
  bio: string;
  course: string;
}

interface EditProfileModalProps {
  visible: boolean;
  user: User | null;
  saving: boolean;
  onClose: () => void;
  onSave: (form: EditProfileForm) => void;
}

export function EditProfileModal({ visible, user, saving, onClose, onSave }: EditProfileModalProps) {
  const [form, setForm] = useState<EditProfileForm>({
    first_name: '',
    last_name: '',
    bio: '',
    course: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        bio: user.bio ?? '',
        course: user.course ?? '',
      });
    }
  }, [user]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={form.first_name}
            onChangeText={(t) => setForm((p) => ({ ...p, first_name: t }))}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={form.last_name}
            onChangeText={(t) => setForm((p) => ({ ...p, last_name: t }))}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.bio}
            onChangeText={(t) => setForm((p) => ({ ...p, bio: t }))}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Course</Text>
          <TextInput
            style={styles.input}
            value={form.course}
            onChangeText={(t) => setForm((p) => ({ ...p, course: t }))}
          />

          <TouchableOpacity style={styles.saveButton} onPress={() => onSave(form)} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  label: { fontSize: 14, fontWeight: '500', color: '#444', marginBottom: 6 },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 16,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
