import { useEffect, useRef } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';

import {
  HAS_MAPTILER_KEY,
  MAPTILER_ATTRIBUTION_URL,
  MAPTILER_TILE_URL,
} from '@/lib/maptiler';
import { LatLng } from '@/types/activity';

type Props = {
  currentLocation: LatLng | null;
  coordinates: LatLng[];
  isTracking: boolean;
};

const FALLBACK_REGION = {
  latitude: 41.9981,
  longitude: 21.4254,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function TrackingMap({
  currentLocation,
  coordinates,
  isTracking,
}: Props) {
  const mapRef = useRef<MapView | null>(null);

  const shouldUseMapTilerTiles = HAS_MAPTILER_KEY && Platform.OS === 'ios';

  useEffect(() => {
    if (!mapRef.current) return;

    if (coordinates.length > 1) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 120, right: 40, bottom: 220, left: 40 },
        animated: true,
      });
      return;
    }

    if (currentLocation) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    }
  }, [currentLocation, coordinates]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={FALLBACK_REGION}
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

        {currentLocation ? (
          <Marker coordinate={currentLocation} title="Current location" />
        ) : null}

        {coordinates.length > 1 ? (
          <Polyline
            coordinates={coordinates}
            strokeColor="#22c55e"
            strokeWidth={5}
          />
        ) : null}
      </MapView>

      {shouldUseMapTilerTiles ? (
        <Pressable
          onPress={() => Linking.openURL(MAPTILER_ATTRIBUTION_URL)}
          style={styles.attribution}
        >
          <Text style={styles.attributionText}>© MapTiler © OpenStreetMap</Text>
        </Pressable>
      ) : null}

      {isTracking ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>TRACKING</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  attribution: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  attributionText: {
    color: '#e5e7eb',
    fontSize: 11,
  },
  badge: {
    position: 'absolute',
    top: 18,
    alignSelf: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: '#052e16',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});