import {
  Modal,
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
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  const openPicker = () => {
    setTempDate(dateTime || new Date());
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
      // iOS: just track the scrolled value, don't close yet
      if (selectedTime) {
        setTempDate(selectedTime);
      }
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
      {showPicker && Platform.OS === 'android' && (
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
      )}

      <Modal
        visible={showPicker && Platform.OS === 'ios'}
        transparent
        animationType="slide"
      >
        <View style={styles.iosModalOverlay}>
          <View style={styles.iosPickerContainer}>
            <View style={styles.iosPickerHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.iosPickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                const dateTimeString = tempDate.toISOString();
                if (onChange(dateTimeString)) {
                  setDateTime(tempDate);
                }
                setShowPicker(false);
              }}>
                <Text style={styles.iosPickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={dateTime || new Date()}
              mode="datetime"
              display="spinner"
              onChange={handleTimePickerChange}
              style={styles.iosPicker}
            />
          </View>
        </View>
      </Modal>
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
  iosModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  iosPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iosPickerCancel: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
  iosPickerDone: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
  },
  iosPicker: {
    width: '100%',
    alignSelf: 'center',
  },
});
