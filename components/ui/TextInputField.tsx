import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  KeyboardTypeOptions,
} from 'react-native';
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react-native';

interface TextInputFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  icon?: LucideIcon;
  rightElement?: ReactNode;
  placeholder?: string;
  placeholderTextColor?: string;
  error?: string;
  multiline?: boolean;
  multilineHeight?: number;
  numberOfLines?: number;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
  maxLength?: number;
  /** 'large' = auth variant (borderRadius 16, larger padding). Defaults to 'large' when icon is provided. */
  size?: 'default' | 'large';
  style?: ViewStyle;
}

export function TextInputField({
  value,
  onChangeText,
  label,
  icon: Icon,
  rightElement,
  placeholder,
  placeholderTextColor = '#999',
  error,
  multiline,
  multilineHeight,
  numberOfLines,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoComplete,
  maxLength,
  size,
  style,
}: TextInputFieldProps) {
  const isLarge = size === 'large' || (size == null && !!Icon);

  return (
    <View style={style}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.container,
          isLarge ? styles.containerLarge : styles.containerDefault,
          multiline && styles.containerMultiline,
          error ? styles.containerError : null,
        ]}
      >
        {Icon && <Icon size={20} color="#666" style={styles.iconLeft} />}
        <TextInput
          style={[
            styles.input,
            isLarge ? styles.inputLarge : styles.inputDefault,
            multiline && styles.inputMultiline,
            multilineHeight ? { height: multilineHeight } : null,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete as any}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : undefined}
        />
        {rightElement}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
    marginBottom: 6,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  containerLarge: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  containerDefault: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  containerMultiline: {
    alignItems: 'flex-start',
  },
  containerError: {
    borderColor: '#DC3545',
  },
  input: {
    flex: 1,
    color: '#1A1A1A',
  },
  inputLarge: {
    fontSize: 16,
    paddingVertical: 16,
  },
  inputDefault: {
    fontSize: 15,
  },
  inputMultiline: {
    textAlignVertical: 'top',
  },
  iconLeft: {
    marginRight: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#DC3545',
    marginTop: 4,
  },
});
