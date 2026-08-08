import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      {/* Reached after sign-up when Supabase is holding the session pending
          email confirmation. It was routable by file-system discovery alone,
          but listing it keeps the group's screens explicit. */}
      <Stack.Screen name="checkEmail" />
    </Stack>
  );
}