import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Plus, X } from 'lucide-react-native';

const COMMON_TAGS = [
  'Outdoor Court',
  'Indoor Court',
  'Full Court',
  'Half Court',
  'Lighting',
  'Free Parking',
  'Restrooms',
  'Water Fountain',
  'Seating',
  'Scoreboard',
];

interface CourtTagSelectorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function CourtTagSelector({ tags, onChange }: CourtTagSelectorProps) {
  const [newTag, setNewTag] = useState('');

  const addTag = (tag: string) => {
    if (!tags.includes(tag)) onChange([...tags, tag]);
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const addCustomTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setNewTag('');
    }
  };

  return (
    <View>
      <View style={styles.tagsGrid}>
        {COMMON_TAGS.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[styles.tagChip, tags.includes(tag) && styles.tagChipSelected]}
            onPress={() => (tags.includes(tag) ? removeTag(tag) : addTag(tag))}
          >
            <Text style={[styles.tagText, tags.includes(tag) && styles.tagTextSelected]}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.customTagRow}>
        <TextInput
          style={styles.customTagInput}
          value={newTag}
          onChangeText={setNewTag}
          placeholder="Add custom tag"
          placeholderTextColor="#999"
          onSubmitEditing={addCustomTag}
        />
        <TouchableOpacity style={styles.addTagButton} onPress={addCustomTag}>
          <Plus size={20} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      {tags.length > 0 && (
        <View style={styles.selectedSection}>
          <Text style={styles.selectedTitle}>Selected Tags:</Text>
          <View style={styles.selectedGrid}>
            {tags.map((tag) => (
              <View key={tag} style={styles.selectedChip}>
                <Text style={styles.selectedChipText}>{tag}</Text>
                <TouchableOpacity onPress={() => removeTag(tag)}>
                  <X size={16} color="#666" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  tagChip: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  tagChipSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  tagText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  tagTextSelected: {
    color: '#FFFFFF',
  },
  customTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  customTagInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  addTagButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF4F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  selectedSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  selectedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  selectedChipText: {
    fontSize: 12,
    color: '#28A745',
    fontWeight: '500',
  },
});
