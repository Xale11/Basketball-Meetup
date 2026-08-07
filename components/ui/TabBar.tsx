import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { theme } from '@/constants/theme';

export interface TabItem {
  key: string;
  label: string;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  scrollable?: boolean;
  style?: object;
}

const { colors, radius, typography } = theme;

export function TabBar({ tabs, activeTab, onTabChange, scrollable, style }: TabBarProps) {
  const buttons = tabs.map((tab) => (
    <TouchableOpacity
      key={tab.key}
      style={[styles.tab, activeTab === tab.key && styles.activeTab]}
      onPress={() => onTabChange(tab.key)}
      activeOpacity={0.8}
    >
      <Text style={[typography.label, styles.tabText, activeTab === tab.key && styles.activeTabText]}>
        {tab.label}
      </Text>
    </TouchableOpacity>
  ));

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.container, style]}
        contentContainerStyle={styles.scrollContent}
      >
        {buttons}
      </ScrollView>
    );
  }

  return <View style={[styles.container, style]}>{buttons}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 16,
    borderRadius: radius.pill,
  },
  activeTab: {
    backgroundColor: colors.accent,
  },
  tabText: {
    color: colors.textMuted,
  },
  activeTabText: {
    color: colors.textOnAccent,
  },
});
