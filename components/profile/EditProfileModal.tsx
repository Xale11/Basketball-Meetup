import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { User } from '@/types/user';
import { TextInputField } from '@/components/ui/TextInputField';
import { Button } from '@/components/ui/Button';

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

          <TextInputField
            label="First Name"
            value={form.first_name}
            onChangeText={(t) => setForm((p) => ({ ...p, first_name: t }))}
            autoCapitalize="words"
            style={styles.inputSpacing}
          />

          <TextInputField
            label="Last Name"
            value={form.last_name}
            onChangeText={(t) => setForm((p) => ({ ...p, last_name: t }))}
            autoCapitalize="words"
            style={styles.inputSpacing}
          />

          <TextInputField
            label="Bio"
            value={form.bio}
            onChangeText={(t) => setForm((p) => ({ ...p, bio: t }))}
            multiline
            numberOfLines={3}
            multilineHeight={80}
            style={styles.inputSpacing}
          />

          <TextInputField
            label="Course"
            value={form.course}
            onChangeText={(t) => setForm((p) => ({ ...p, course: t }))}
            style={styles.inputSpacing}
          />

          <Button label={saving ? 'Saving…' : 'Save Changes'} onPress={() => onSave(form)} disabled={saving} style={styles.saveButton} />
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
  inputSpacing: { marginBottom: 16 },
  saveButton: { marginTop: 4 },
});
