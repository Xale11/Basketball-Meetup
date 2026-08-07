import { Keyboard, Platform, TouchableWithoutFeedback, View, ViewProps } from 'react-native';

/**
 * Dismisses the soft keyboard when the user taps anywhere that isn't an
 * interactive child. For screens without a ScrollView — scrolling screens get
 * the same behaviour from `keyboardShouldPersistTaps="handled"` instead.
 *
 * `accessible={false}` keeps the wrapper out of the screen reader's tree so it
 * doesn't swallow the contents into one big element.
 */
export function DismissKeyboardView({ children, style, ...rest }: ViewProps) {
  // No soft keyboard on web, and wrapping there interferes with text selection.
  if (Platform.OS === 'web') {
    return (
      <View style={style} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
      <View style={style} {...rest}>
        {children}
      </View>
    </TouchableWithoutFeedback>
  );
}
