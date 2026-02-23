import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
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
      <TouchableOpacity onPress={() => setShowPicker(true)}>
        <Text style={styles.timeLabel}>{label}</Text>
        <TextInput
          style={styles.timeInput}
          value={
            !time
              ? defaultValue
              : time.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })
          }
          editable={false}
          onPress={() => setShowPicker(true)}
          placeholder={defaultValue}
          placeholderTextColor="#999"
        />
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
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e) =>
              handleTimePickerChange(e, new Date(e.nativeEvent.timestamp))
            }
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
    fontSize: 14,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
});
