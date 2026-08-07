import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';

interface DateTimeInputProps {
  onChange: (time: string) => boolean;
  label: string;
  defaultValue: string;
  initialValue?: string;
}

const DateTimeInput = ({
  onChange,
  label,
  defaultValue,
  initialValue,
}: DateTimeInputProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const [dateTime, setDateTime] = useState<Date | undefined>(
    initialValue ? new Date(initialValue) : undefined
  );
  const [tempDate, setTempDate] = useState<Date>(
    initialValue ? new Date(initialValue) : new Date()
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  // Bumped on every open so the iOS picker is re-created from scratch. See the
  // comment on the picker itself for why that matters under the New Arch.
  const [pickerSession, setPickerSession] = useState(0);

  const openPicker = () => {
    setTempDate(dateTime || new Date());
    setSelectedDate(null);
    setPickerMode('date');
    setPickerSession((n) => n + 1);
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
      <TouchableOpacity onPress={openPicker} activeOpacity={0.7}>
        <Text style={styles.timeLabel}>{label}</Text>
        {/* A read-only display, so it must not be a TextInput. A TextInput here
            can still take focus and raise the soft keyboard even with
            editable={false}, which is what put a number pad over the picker. */}
        <View style={styles.timeInput}>
          <Text style={dateTime ? styles.timeValue : styles.timePlaceholder}>
            {dateTime ? formatDateTime(dateTime) : defaultValue}
          </Text>
        </View>
      </TouchableOpacity>
      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={pickerMode === 'date'
            ? (dateTime || new Date())
            : (selectedDate || dateTime || new Date())}
          mode={pickerMode}
          // 'spinner' for time: the Material clock has a keyboard-entry toggle
          // that pops a number pad. The wheel has no such affordance.
          display={pickerMode === 'time' ? 'spinner' : 'default'}
          is24Hour={true}
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
        onRequestClose={() => setShowPicker(false)}
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
            {/*
              Mounted only while open, with a key that changes per open.

              Under the New Architecture the Fabric picker applies
              `preferredDatePickerStyle` ONLY inside an
              `if (oldProps.displayIOS != newProps.displayIOS)` diff. A picker
              that stays mounted (as this one did, because the Modal is always
              rendered and only toggles `visible`) never sees that prop change,
              so the style is never applied and iOS falls back to `.automatic`
              — which for `datetime` is the compact style whose time pill opens
              a number pad. Re-creating the view guarantees the diff runs and we
              actually get UIDatePickerStyleWheels.
            */}
            {showPicker && (
              <DateTimePicker
                key={pickerSession}
                value={tempDate}
                mode="datetime"
                display="spinner"
                is24Hour={true}
                onChange={handleTimePickerChange}
                style={styles.iosPicker}
                themeVariant="light"
                textColor="#1A1A1A"
              />
            )}
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
