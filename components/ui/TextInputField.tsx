import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
} from 'react-native';
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react-native';
import { theme } from '@/constants/theme';

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
  returnKeyType?: ReturnKeyTypeOptions;
  /** Fires on the keyboard's submit key — used by the tag input to commit a tag. */
  onSubmitEditing?: () => void;
  /** Keeps the keyboard up after submit, for repeated entry. */
  blurOnSubmit?: boolean;
  /** 'large' = auth variant (borderRadius 16, larger padding). Defaults to 'large' when icon is provided. */
  size?: 'default' | 'large';
  style?: ViewStyle;
}

const { colors, radius, typography, dark } = theme;

export function TextInputField({
  value,
  onChangeText,
  label,
  icon: Icon,
  rightElement,
  placeholder,
  placeholderTextColor = colors.textFaint,
  error,
  multiline,
  multilineHeight,
  numberOfLines,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoComplete,
  maxLength,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
  size,
  style,
}: TextInputFieldProps) {
  const isLarge = size === 'large' || (size == null && !!Icon);

  return (
    <View style={style}>
      {label && <Text style={[typography.label, styles.label]}>{label}</Text>}
      <View
        style={[
          styles.container,
          isLarge ? styles.containerLarge : styles.containerDefault,
          multiline && styles.containerMultiline,
          error ? styles.containerError : null,
        ]}
      >
        {Icon && (
          <Icon
            size={20}
            color={colors.textMuted}
            style={[styles.iconLeft, multiline && styles.iconLeftMultiline]}
          />
        )}
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
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : undefined}
          keyboardAppearance={dark ? 'dark' : 'light'}
        />
        {rightElement}
      </View>
      {error ? <Text style={[typography.caption, styles.errorText]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 6,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceInset,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  containerLarge: {
    borderRadius: radius.card,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  containerDefault: {
    borderRadius: radius.chip,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  containerMultiline: {
    alignItems: 'flex-start',
  },
  containerError: {
    borderColor: colors.dangerTone.solid,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: typography.body.fontFamily,
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
  /**
   * A multiline container switches to `alignItems: 'flex-start'` so the input
   * grows downward — which also pins the icon to the container's top edge,
   * above the first line of text. This nudges it down to sit on that line.
   */
  iconLeftMultiline: {
    marginTop: 14,
  },
  errorText: {
    color: colors.dangerTone.text,
    marginTop: 4,
  },
});
