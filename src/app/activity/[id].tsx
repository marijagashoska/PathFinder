import EmptyState from '@/components/EmptyState';
import {
  formatActivityDate,
  formatDistance,
  formatDuration,
} from '@/lib/format';
import {
  HAS_MAPTILER_KEY,
  MAPTILER_ATTRIBUTION_URL,
  MAPTILER_TILE_URL,
} from '@/lib/maptiler';
import { getActivityById } from '@/lib/storage';
import { Activity } from '@/types/activity';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

  const shouldUseMapTilerTiles = HAS_MAPTILER_KEY && Platform.OS === 'ios';

  const firstPoint = activity?.coordinates[0] ?? null;
  const lastPoint =
    activity && activity.coordinates.length > 0
      ? activity.coordinates[activity.coordinates.length - 1]
      : null;

  const mapRef = useRef<MapView | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const load = async () => {
        try {
          setLoading(true);
          const data = id ? await getActivityById(id) : null;
          if (!cancelled) {
            setActivity(data);
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

      void load();

      return () => {
        cancelled = true;
      };
    }, [id])
  );

  const initialRegion = useMemo(() => {
    if (!firstPoint) return null;

    return {
      latitude: firstPoint.latitude,
      longitude: firstPoint.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [firstPoint]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center bg-gray-900 px-6">
          <ActivityIndicator size="large" color="#22c55e" />
          <Text className="mt-3.5 text-base text-gray-200">
            Loading activity...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activity || !firstPoint || !initialRegion) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex-1 bg-gray-900">
          <EmptyState
            title="Activity not found"
            message="This saved route could not be loaded from local storage."
          />
          <View className="px-4 pb-4">
            <Pressable
              className="items-center rounded-2xl bg-green-500 py-4"
              onPress={() => router.replace('/history')}
            >
              <Text className="text-base font-extrabold text-green-950">
                Back to History
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-gray-900 p-4">
        <View className="mb-4">
          <Text className="text-[28px] font-extrabold text-white">
            Activity Detail
          </Text>
          <Text className="mt-1.5 text-gray-400">
            {formatActivityDate(activity.createdAt)}
          </Text>
        </View>

        <View className="h-[340px] overflow-hidden rounded-[20px] border border-gray-700 bg-slate-900">
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={initialRegion}
            onMapReady={() => {
              if (activity.coordinates.length > 1) {
                mapRef.current?.fitToCoordinates(activity.coordinates, {
                  edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
                  animated: false,
                });
              }
            }}
            mapType={shouldUseMapTilerTiles ? 'none' : 'standard'}
            rotateEnabled={false}
            pitchEnabled={false}
            showsCompass={false}
            toolbarEnabled={false}
          >
            {shouldUseMapTilerTiles ? (
              <UrlTile
                urlTemplate={MAPTILER_TILE_URL}
                maximumZ={19}
                flipY={false}
                zIndex={0}
              />
            ) : null}

            <Marker
              coordinate={firstPoint}
              title="Start"
              description="Route start"
            />

            {lastPoint ? (
              <Marker
                coordinate={lastPoint}
                title="Finish"
                description="Route end"
              />
            ) : null}

            {activity.coordinates.length > 1 ? (
              <Polyline
                coordinates={activity.coordinates}
                strokeColor="#22c55e"
                strokeWidth={5}
              />
            ) : null}
          </MapView>

          {shouldUseMapTilerTiles ? (
            <Pressable
              onPress={() => Linking.openURL(MAPTILER_ATTRIBUTION_URL)}
              className="absolute bottom-2.5 right-2.5 rounded-full bg-slate-900/80 px-2.5 py-1.5"
            >
              <Text className="text-[11px] text-slate-200">
                © MapTiler © OpenStreetMap
              </Text>
            </Pressable>
          ) : null}

          {HAS_MAPTILER_KEY && Platform.OS === 'android' ? (
            <View className="absolute bottom-[45px] left-3 right-3 rounded-xl bg-red-900/90 p-3">
              <Text className="text-center font-semibold text-white">
                Android is using the native map fallback.
              </Text>
            </View>
          ) : null}
        </View>

        <View className="mt-4 flex-row">
          <View className="mr-1.5 flex-1 rounded-[18px] border border-gray-700 bg-gray-800 p-4">
            <Text className="mb-1.5 text-xs uppercase tracking-wide text-gray-400">
              Distance
            </Text>
            <Text className="text-lg font-extrabold text-white">
              {formatDistance(activity.distanceMeters)}
            </Text>
          </View>

          <View className="ml-1.5 flex-1 rounded-[18px] border border-gray-700 bg-gray-800 p-4">
            <Text className="mb-1.5 text-xs uppercase tracking-wide text-gray-400">
              Duration
            </Text>
            <Text className="text-lg font-extrabold text-white">
              {formatDuration(activity.durationSec)}
            </Text>
          </View>
        </View>

        <View className="mt-3 rounded-[18px] border border-gray-700 bg-gray-800 p-4">
          <Text className="text-gray-300">
            Points recorded: {activity.coordinates.length}
          </Text>
          <Text className="mt-2 text-gray-300">
            Map provider: {shouldUseMapTilerTiles ? 'MapTiler' : 'Default map'}
          </Text>
        </View>

        <Pressable
          className="mt-auto items-center rounded-2xl bg-green-500 py-4"
          onPress={() => router.replace('/history')}
        >
          <Text className="text-base font-extrabold text-green-950">
            Back to History
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}