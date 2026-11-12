import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
} from 'expo-router';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider
      value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
    >
      <Stack>
        {/* Configure presentation before mounting the form so input updates cannot recreate it.
            Dismiss through the form's close button to preserve its discard confirmation. */}
        <Stack.Screen
          name="moment/new"
          options={{ headerShown: false, presentation: 'modal', gestureEnabled: false }}
        />
      </Stack>
    </ThemeProvider>
  );
}
