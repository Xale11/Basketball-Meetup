import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { OpeningHours } from '@/types/courts';
import { useState } from 'react';

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
            themeVariant="light"
            textColor="#1A1A1A"
          />
        ))}
    </View>
  );
};

export default TimeInput;

const styles = StyleSheet.create({
  timeInputGroup: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  timeInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    // Matches the height a single-line TextInput used to occupy.
    justifyContent: 'center',
    minHeight: 38,
  },
  timeValue: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  timePlaceholder: {
    fontSize: 14,
    color: '#999',
  },
});
