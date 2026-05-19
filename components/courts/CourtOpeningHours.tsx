import { View, Text, Switch, StyleSheet, Alert } from 'react-native';
import { OpeningHours } from '@/types/courts';
import TimeInput from '@/components/TimeInput';

const DAYS: { key: keyof Omit<OpeningHours, 'always_open'>; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

interface CourtOpeningHoursProps {
  value: OpeningHours;
  onChange: (value: OpeningHours) => void;
}

export function CourtOpeningHours({ value, onChange }: CourtOpeningHoursProps) {
  const setGlobalAlwaysOpen = (always: boolean) => {
    onChange({
      ...value,
      always_open: always,
      monday: { ...value.monday, always_open: always },
      tuesday: { ...value.tuesday, always_open: always },
      wednesday: { ...value.wednesday, always_open: always },
      thursday: { ...value.thursday, always_open: always },
      friday: { ...value.friday, always_open: always },
      saturday: { ...value.saturday, always_open: always },
      sunday: { ...value.sunday, always_open: always },
    });
  };

  const updateDay = (
    day: keyof Omit<OpeningHours, 'always_open'>,
    field: 'always_open' | 'open_time' | 'close_time',
    newValue: boolean | string,
  ) => {
    if (
      (field === 'open_time' && newValue > value[day].close_time) ||
      (field === 'close_time' && newValue < value[day].open_time)
    ) {
      Alert.alert('Error', 'Open time must be before close time');
      return false;
    }
    onChange({
      ...value,
      [day]: { ...value[day], [field]: newValue },
    });
    return true;
  };

  return (
    <View>
      {/* Global always-open toggle */}
      <View style={styles.globalToggle}>
        <View style={styles.globalToggleText}>
          <Text style={styles.label}>Always Open</Text>
          <Text style={styles.subtitle}>Court is available 24/7</Text>
        </View>
        <Switch
          value={value.always_open}
          onValueChange={setGlobalAlwaysOpen}
          trackColor={{ false: '#E9ECEF', true: '#FF6B35' }}
          thumbColor="#FFFFFF"
        />
      </View>

      {!value.always_open &&
        DAYS.map(({ key, label }) => {
          const day = value[key];
          return (
            <View key={key} style={styles.dayRow}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayLabel}>{label}</Text>
                <View style={styles.openAllDayRow}>
                  <Text style={styles.openAllDayText}>Open All Day</Text>
                  <Switch
                    value={day.always_open}
                    onValueChange={(v) => updateDay(key, 'always_open', v)}
                    trackColor={{ false: '#E9ECEF', true: '#FF6B35' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              {!day.always_open && (
                <View style={styles.timeRow}>
                  <TimeInput
                    defaultValue={day.open_time}
                    label="Open Time"
                    onChange={(time) => updateDay(key, 'open_time', time)}
                  />
                  <Text style={styles.timeSeparator}>to</Text>
                  <View style={styles.timeInputFlex}>
                    <TimeInput
                      defaultValue={day.close_time}
                      label="Close Time"
                      onChange={(time) => updateDay(key, 'close_time', time)}
                    />
                  </View>
                </View>
              )}
            </View>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  globalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  globalToggleText: { flex: 1 },
  label: { fontSize: 16, fontWeight: '500', color: '#1A1A1A' },
  subtitle: { fontSize: 12, color: '#666', marginTop: 2 },
  dayRow: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayLabel: { fontSize: 16, fontWeight: '500', color: '#1A1A1A' },
  openAllDayRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  openAllDayText: { fontSize: 14, color: '#666' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeInputFlex: { flex: 1 },
  timeSeparator: { fontSize: 14, color: '#666', fontWeight: '500' },
});
