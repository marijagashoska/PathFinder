import '../global.css';

import { Stack } from 'expo-router';
import { LogBox } from 'react-native';

import { TrackingProvider } from '@/hooks/useTracking';

LogBox.ignoreLogs(['Failed to get initial live location']);

export default function RootLayout() {
  return (
    <TrackingProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="history" />
        <Stack.Screen name="activity/[id]" />
      </Stack>
    </TrackingProvider>
  );
}