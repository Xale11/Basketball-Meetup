import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { theme } from '@/constants/theme';

export interface SegmentedTab<T extends string> {
  key: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedTabsProps<T extends string> {
  tabs: SegmentedTab<T>[];
  activeTab: T;
  onTabChange: (key: T) => void;
  style?: ViewStyle;
}

const { colors, radius, typography } = theme;

/**
 * Equal-width segmented control on a recessed track — the Today/Tomorrow/This
 * Week switcher in Discover, and the sub-tab rows in Profile and Societies.
 */
export function SegmentedTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  style,
}: SegmentedTabsProps<T>) {
  return (
    <View style={[styles.track, style]}>
      {tabs.map((tab) => {
        const active = tab.key === activeTab;
        const Icon = tab.icon;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.85}
          >
            {Icon && (
              <Icon size={14} color={active ? colors.textOnAccent : colors.textMuted} />
            )}
            <Text
              style={[typography.button, styles.label, active && styles.labelActive]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 6,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radius.chip,
  },
  segmentActive: {
    backgroundColor: colors.accent,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.textOnAccent,
  },
});
