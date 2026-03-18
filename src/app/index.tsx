import { router } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import EmptyState from '@/components/EmptyState';
import StatsCard from '@/components/StatsCard';
import TrackingMap from '@/components/TrackingMap';
import { useTracking } from '@/hooks/useTracking';
import { saveActivity } from '@/lib/storage';

export default function HomeScreen() {
  const {
    permissionState,
    locationError,
    currentLocation,
    coordinates,
    durationSec,
    distanceMeters,
    isTracking,
    startTracking,
    stopTracking,
    resetSession,
    retryLocation,
    useDemoLocation,
  } = useTracking();

  async function handleStopAndSave() {
    try {
      await stopTracking();

      if (coordinates.length === 0) {
        Alert.alert(
          'Nothing to save',
          'Start tracking before saving an activity.'
        );
        return;
      }

      await saveActivity({
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        durationSec,
        distanceMeters,
        coordinates,
      });

      resetSession();
      router.push('/history');
    } catch (error) {
      console.error('Failed to save activity:', error);
      Alert.alert('Save failed', 'The activity could not be saved locally.');
    }
  }

  if (permissionState === 'loading') {
    return (
      <EmptyState
        title="Checking location permission"
        message="Please wait while the app requests access to your location."
      />
    );
  }

  return (
    <View className="flex-1 bg-slate-900">
      <TrackingMap
        currentLocation={currentLocation}
        coordinates={coordinates}
        isTracking={isTracking}
      />

      <View className="absolute inset-0">
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <StatsCard durationSec={durationSec} distanceMeters={distanceMeters} />

          {permissionState === 'denied' ? (
            <View className="mx-4 mt-28 rounded-2xl bg-red-900/90 p-3">
              <Text className="text-center font-semibold text-white">
                Location permission is denied. Open settings or use demo
                location.
              </Text>
            </View>
          ) : null}

          {permissionState !== 'denied' && !currentLocation ? (
            <View className="mx-4 mt-28 rounded-xl bg-slate-800/90 p-2.5">
              <Text className="text-center text-sm font-semibold text-white">
                No live GPS yet. Tap Retry Location or Use Demo Location.
              </Text>
            </View>
          ) : null}

          {locationError && currentLocation ? (
            <View className="mx-4 mt-28 rounded-2xl bg-red-900/90 p-3">
              <Text className="text-center font-semibold text-white">
                {locationError}
              </Text>
            </View>
          ) : null}

          <View className="mt-auto px-4 pb-5">
            {currentLocation ? (
              !isTracking ? (
                <Pressable
                  className="mb-3 items-center rounded-2xl bg-green-500 py-4"
                  onPress={startTracking}
                >
                  <Text className="text-base font-extrabold text-green-950">
                    Start Tracking
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  className="mb-3 items-center rounded-2xl bg-red-500 py-4"
                  onPress={handleStopAndSave}
                >
                  <Text className="text-base font-extrabold text-white">
                    Stop & Save
                  </Text>
                </Pressable>
              )
            ) : (
              <>
                <Pressable
                  className="mb-3 items-center rounded-2xl bg-green-500 py-4"
                  onPress={retryLocation}
                >
                  <Text className="text-base font-extrabold text-green-950">
                    Retry Location
                  </Text>
                </Pressable>

                <Pressable
                  className="mb-3 items-center rounded-2xl bg-slate-700 py-3.5"
                  onPress={() => void useDemoLocation()}
                >
                  <Text className="text-[15px] font-bold text-white">
                    Use Demo Location
                  </Text>
                </Pressable>
              </>
            )}

            {!isTracking && coordinates.length > 0 ? (
              <Pressable
                className="mb-3 items-center rounded-2xl bg-slate-700 py-3.5"
                onPress={resetSession}
              >
                <Text className="text-[15px] font-bold text-white">
                  Clear Current Route
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              className="items-center rounded-2xl border border-slate-600 bg-slate-900 py-3.5"
              onPress={() => router.push('/history')}
            >
              <Text className="text-[15px] font-bold text-slate-200">
                Open History
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}