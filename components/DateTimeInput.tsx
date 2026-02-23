import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';

interface DateTimeInputProps {
  onChange: (time: string) => boolean;
  label: string;
  defaultValue: string;
}

const DateTimeInput = ({
  onChange,
  label,
  defaultValue,
}: DateTimeInputProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const [dateTime, setDateTime] = useState<Date>();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  const openPicker = () => {
    setSelectedDate(null);
    setPickerMode('date');
    setShowPicker(true);
  };

  const handleDatePickerChange = (event: any, selectedDateValue?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && selectedDateValue) {
        // Date was selected, now switch to time picker
        // On Android, the picker closes after selection, so we need to reopen it
        setSelectedDate(selectedDateValue);
        setPickerMode('time');
        // The picker will close, so we'll reopen it in time mode
        // Use setTimeout to ensure the picker reopens after the current one closes
        setTimeout(() => {
          setShowPicker(true);
        }, 100);
      } else if (event.type === 'dismissed') {
        // User cancelled, close picker
        setShowPicker(false);
        setSelectedDate(null);
        setPickerMode('date');
      }
    }
  };

  const handleTimePickerChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && selectedTime && selectedDate) {
        // Combine the selected date with the selected time
        const combinedDateTime = new Date(selectedDate);
        combinedDateTime.setHours(selectedTime.getHours());
        combinedDateTime.setMinutes(selectedTime.getMinutes());
        combinedDateTime.setSeconds(0);
        combinedDateTime.setMilliseconds(0);

        // Format as datetime string (ISO format or custom format)
        const dateTimeString = combinedDateTime.toISOString();
        
        if (onChange(dateTimeString)) {
          setDateTime(combinedDateTime);
        }
        setShowPicker(false);
        setSelectedDate(null);
        setPickerMode('date');
      } else if (event.type === 'dismissed') {
        // User cancelled time selection, close picker
        setShowPicker(false);
        setSelectedDate(null);
        setPickerMode('date');
      }
    } else {
      // iOS handles datetime in one picker
      if (event.type === 'set' && selectedTime) {
        const dateTimeString = selectedTime.toISOString();
        if (onChange(dateTimeString)) {
          setDateTime(selectedTime);
        }
      }
      // Close picker for both 'set' and 'dismissed' events on iOS
      setShowPicker(false);
    }
  };

  const formatDateTime = (date: Date): string => {
    const dateStr = date.toLocaleDateString([], {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const timeStr = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${dateStr} ${timeStr}`;
  };

  return (
    <View style={styles.timeInputGroup}>
      <TouchableOpacity onPress={openPicker}>
        <Text style={styles.timeLabel}>{label}</Text>
        <TextInput
          style={styles.timeInput}
          value={
            !dateTime
              ? defaultValue
              : formatDateTime(dateTime)
          }
          editable={false}
          onPress={openPicker}
          placeholder={defaultValue}
          placeholderTextColor="#999"
        />
      </TouchableOpacity>
      {showPicker &&
        (Platform.OS === 'android' ? (
          <DateTimePicker
            value={pickerMode === 'date' 
              ? (dateTime || new Date())
              : (selectedDate || dateTime || new Date())}
            mode={pickerMode}
            display="default"
            onChange={(e, selectedValue) => {
              if (pickerMode === 'date') {
                handleDatePickerChange(e, selectedValue);
              } else {
                handleTimePickerChange(e, selectedValue);
              }
            }}
          />
        ) : (
          <DateTimePicker
            value={dateTime || new Date()}
            mode="datetime"
            display="spinner"
            onChange={handleTimePickerChange}
          />
        ))}
    </View>
  );
};

export default DateTimeInput;

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
