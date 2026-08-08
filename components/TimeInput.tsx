import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { useTheme, useThemedStyles, Theme } from '@/hooks/useTheme';

interface TimeInputProps {
  onChange: (time: string) => boolean;
  label: string;
  defaultValue: string;
  mode?: 'time' | 'date' | 'datetime' | 'countdown';
}

const TimeInput = ({
  onChange,
  label,
  defaultValue,
  mode = 'time',
}: TimeInputProps) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [showPicker, setShowPicker] = useState(false);
  const [time, setTime] = useState<Date>();

  const handleTimePickerChange = (event: any, selectedDate?: Date) => {
    // TODO: Add validation to check if the time is before the close time
    // Just add props for the day and field. Move function from add-court.tsx to here.
    setShowPicker(false);
    if (selectedDate) {
      if (
        onChange(
          selectedDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        )
      ) {
        setTime(selectedDate);
      }
    }
  };

  return (
    <View style={styles.timeInputGroup}>
      <TouchableOpacity onPress={() => setShowPicker(true)} activeOpacity={0.7}>
        <Text style={styles.timeLabel}>{label}</Text>
        {/* A read-only display, so it must not be a TextInput. A TextInput here
            can still take focus and raise the soft keyboard even with
            editable={false}, which is what put a number pad over the picker. */}
        <View style={styles.timeInput}>
          <Text style={time ? styles.timeValue : styles.timePlaceholder}>
            {time
              ? time.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })
              : defaultValue}
          </Text>
        </View>
      </TouchableOpacity>
      {showPicker &&
        (Platform.OS === 'android' && mode === 'datetime' ? (
          <DateTimePicker
            value={time || new Date()}
            mode={mode}
            is24Hour={true}
            display={'default'}
            onChange={(e) =>
              handleTimePickerChange(e, new Date(e.nativeEvent.timestamp))
            }
          />
        ) : (
          <DateTimePicker
            value={time || new Date()}
            mode={mode}
            is24Hour={true}
            // 'spinner' for time on both platforms: Android's Material clock has
            // a keyboard-entry toggle that pops a number pad over the dial.
            display={Platform.OS === 'ios' || mode === 'time' ? 'spinner' : 'default'}
            onChange={(e) =>
              handleTimePickerChange(e, new Date(e.nativeEvent.timestamp))
            }
            // Drawn by the platform, not by our stylesheet — without this it
            // renders dark-on-dark under the ActivCampus palette.
            themeVariant={theme.dark ? 'dark' : 'light'}
            textColor={theme.colors.textPrimary}
          />
        ))}
    </View>
  );
};

export default TimeInput;

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    timeInputGroup: {
      flex: 1,
    },
    timeLabel: {
      ...t.typography.caption,
      color: t.colors.textMuted,
      marginBottom: 4,
    },
    timeInput: {
      backgroundColor: t.colors.surfaceInset,
      borderRadius: t.radius.sm,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.sm,
      borderWidth: 1,
      borderColor: t.colors.borderStrong,
      // Matches the height a single-line TextInput used to occupy.
      justifyContent: 'center',
      minHeight: 38,
    },
    timeValue: {
      ...t.typography.bodyStrong,
      color: t.colors.textPrimary,
    },
    timePlaceholder: {
      ...t.typography.body,
      color: t.colors.textFaint,
    },
  });
