import * as Location from 'expo-location';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

import { getDistanceInMeters } from '@/lib/distance';
import { LatLng } from '@/types/activity';

type PermissionState = 'loading' | 'granted' | 'denied';
type TrackingMode = 'live' | 'demo';

const DEMO_WAYPOINTS: LatLng[] = [
  { latitude: 41.9981, longitude: 21.4254 },
  { latitude: 41.9986, longitude: 21.4262 },
  { latitude: 41.9992, longitude: 21.4271 },
  { latitude: 41.9998, longitude: 21.4281 },
  { latitude: 42.0003, longitude: 21.4292 },
  { latitude: 42.0009, longitude: 21.4301 },
  { latitude: 42.0014, longitude: 21.4310 },
];

const OSRM_BASE_URL = 'https://router.project-osrm.org';

type OsrmRouteResponse = {
  code: string;
  message?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: [number, number][];
    };
  }>;
};

function timeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Location timeout')), ms);
  });
}

function toLatLng(location: Location.LocationObject): LatLng {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

function compressRoute(points: LatLng[], minStepMeters = 8): LatLng[] {
  if (points.length <= 2) return points;

  const result: LatLng[] = [points[0]];
  let lastKept = points[0];

  for (let i = 1; i < points.length - 1; i += 1) {
    const point = points[i];
    const delta = getDistanceInMeters(lastKept, point);

    if (delta >= minStepMeters) {
      result.push(point);
      lastKept = point;
    }
  }

  const lastPoint = points[points.length - 1];
  if (getDistanceInMeters(lastKept, lastPoint) > 0) {
    result.push(lastPoint);
  }

  return result;
}

async function fetchWalkingDemoRoute(waypoints: LatLng[]): Promise<LatLng[]> {
  if (waypoints.length < 2) return waypoints;

  const coordinatesParam = waypoints
    .map((point) => `${point.longitude},${point.latitude}`)
    .join(';');

  const url =
    `${OSRM_BASE_URL}/route/v1/foot/${coordinatesParam}` +
    `?overview=full&geometries=geojson&steps=false`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`OSRM request failed with status ${response.status}`);
  }

  const data = (await response.json()) as OsrmRouteResponse;

  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error(data.message ?? 'No demo route found');
  }

  const rawRoute: LatLng[] = data.routes[0].geometry.coordinates.map(
    ([longitude, latitude]) => ({
      latitude,
      longitude,
    })
  );

  return compressRoute(rawRoute, 8);
}

function useTrackingState() {
  const [permissionState, setPermissionState] =
    useState<PermissionState>('loading');
  const [trackingMode, setTrackingMode] = useState<TrackingMode>('live');
  const [locationError, setLocationError] = useState<string | null>(null);

  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [coordinates, setCoordinates] = useState<LatLng[]>([]);
  const [durationSec, setDurationSec] = useState(0);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [demoRoute, setDemoRoute] = useState<LatLng[]>([]);

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const demoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAcceptedCoordRef = useRef<LatLng | null>(null);
  const demoRouteRef = useRef<LatLng[]>([]);

  useEffect(() => {
    void bootstrapLocation();

    return () => {
      watchRef.current?.remove();
      watchRef.current = null;

      if (demoTimerRef.current) {
        clearInterval(demoTimerRef.current);
        demoTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isTracking) return;

    const timer = setInterval(() => {
      setDurationSec((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isTracking]);

  async function ensurePermissionAndServices() {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      setPermissionState('denied');
      throw new Error('Location permission denied');
    }

    setPermissionState('granted');

    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      throw new Error('Location services are turned off');
    }

    if (Platform.OS === 'android') {
      try {
        await Location.enableNetworkProviderAsync();
      } catch {
        // user may dismiss the dialog
      }
    }
  }

  async function getFreshLiveLocation() {
    await ensurePermissionAndServices();

    const location = (await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      }),
      timeoutPromise(12000),
    ])) as Location.LocationObject;

    return location;
  }

  async function ensureDemoRoute() {
    if (demoRouteRef.current.length > 1) {
      return demoRouteRef.current;
    }

    const route = await fetchWalkingDemoRoute(DEMO_WAYPOINTS);
    demoRouteRef.current = route;
    setDemoRoute(route);

    return route;
  }

  async function bootstrapLocation() {
    try {
      setLocationError(null);
      setTrackingMode('live');

      const liveLocation = await getFreshLiveLocation();
      const point = toLatLng(liveLocation);

      setCurrentLocation(point);
      lastAcceptedCoordRef.current = point;
    } catch (error) {
      console.warn('Failed to get initial live location:', error);
      setCurrentLocation(null);
      setLocationError(
        'Could not get a live GPS fix. You can switch to demo mode.'
      );
    }
  }

  async function retryLocation() {
    setTrackingMode('live');
    await bootstrapLocation();
  }

  async function useDemoLocation() {
    watchRef.current?.remove();
    watchRef.current = null;

    if (demoTimerRef.current) {
      clearInterval(demoTimerRef.current);
      demoTimerRef.current = null;
    }

    try {
      const route = await ensureDemoRoute();
      const firstPoint = route[0];

      setTrackingMode('demo');
      setLocationError('Using road-following demo route.');
      setCurrentLocation(firstPoint);
      lastAcceptedCoordRef.current = firstPoint;
    } catch (error) {
      console.warn('Failed to build road-following demo route:', error);

      const fallbackStart = DEMO_WAYPOINTS[0] ?? null;

      demoRouteRef.current = DEMO_WAYPOINTS;
      setDemoRoute(DEMO_WAYPOINTS);
      setTrackingMode('demo');
      setLocationError(
        'Could not load road-following demo route. Using fallback demo points.'
      );
      setCurrentLocation(fallbackStart);
      lastAcceptedCoordRef.current = fallbackStart;
    }
  }

  async function startDemoTracking() {
    if (demoTimerRef.current) {
      clearInterval(demoTimerRef.current);
      demoTimerRef.current = null;
    }

    let route: LatLng[];

    try {
      route = await ensureDemoRoute();
    } catch (error) {
      console.warn('Failed to load routed demo path, using fallback:', error);
      route = DEMO_WAYPOINTS;
      demoRouteRef.current = route;
      setDemoRoute(route);
    }

    const startPoint = route[0];
    if (!startPoint) {
      setLocationError('Demo route is empty.');
      setIsTracking(false);
      return;
    }

    setCurrentLocation(startPoint);
    setCoordinates([startPoint]);
    setDurationSec(0);
    setDistanceMeters(0);
    setIsTracking(true);
    lastAcceptedCoordRef.current = startPoint;

    let index = 0;

    demoTimerRef.current = setInterval(() => {
      if (index >= route.length - 1) {
        if (demoTimerRef.current) {
          clearInterval(demoTimerRef.current);
          demoTimerRef.current = null;
        }

        setIsTracking(false);
        return;
      }

      const prevPoint = route[index];
      const nextPoint = route[index + 1];
      index += 1;

      const delta = getDistanceInMeters(prevPoint, nextPoint);

      setCurrentLocation(nextPoint);
      lastAcceptedCoordRef.current = nextPoint;
      setDistanceMeters((prev) => prev + delta);
      setCoordinates((prev) => [...prev, nextPoint]);
    }, 1000);
  }

  async function startTracking() {
    if (isTracking) return;

    watchRef.current?.remove();
    watchRef.current = null;

    if (demoTimerRef.current) {
      clearInterval(demoTimerRef.current);
      demoTimerRef.current = null;
    }

    if (trackingMode === 'demo') {
      await startDemoTracking();
      return;
    }

    try {
      setLocationError(null);
      setTrackingMode('live');

      const freshLocation = await getFreshLiveLocation();
      const startPoint = toLatLng(freshLocation);

      setCurrentLocation(startPoint);
      setCoordinates([startPoint]);
      setDurationSec(0);
      setDistanceMeters(0);
      setIsTracking(true);
      lastAcceptedCoordRef.current = startPoint;

      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1,
          mayShowUserSettingsDialog: true,
        },
        (location) => {
          const nextPoint: LatLng = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          const horizontalAccuracy = location.coords.accuracy ?? 999;
          if (horizontalAccuracy > 25) return;

          setCurrentLocation(nextPoint);

          const lastPoint = lastAcceptedCoordRef.current;
          if (!lastPoint) {
            lastAcceptedCoordRef.current = nextPoint;
            setCoordinates([nextPoint]);
            return;
          }

          const delta = getDistanceInMeters(lastPoint, nextPoint);

          if (delta < 1.5) return;
          if (delta > 60) return;

          lastAcceptedCoordRef.current = nextPoint;
          setDistanceMeters((prev) => prev + delta);
          setCoordinates((prev) => [...prev, nextPoint]);
        }
      );
    } catch (error) {
      console.warn('Failed to start live tracking:', error);
      setCurrentLocation(null);
      setLocationError(
        'Failed to get a real live location. Switch to demo mode.'
      );
      setIsTracking(false);
    }
  }

  async function stopTracking() {
    watchRef.current?.remove();
    watchRef.current = null;

    if (demoTimerRef.current) {
      clearInterval(demoTimerRef.current);
      demoTimerRef.current = null;
    }

    setIsTracking(false);
  }

  function resetSession() {
    setCoordinates([]);
    setDurationSec(0);
    setDistanceMeters(0);
    setLocationError(null);
    lastAcceptedCoordRef.current = currentLocation;
  }

  return {
    permissionState,
    trackingMode,
    locationError,
    currentLocation,
    coordinates,
    durationSec,
    distanceMeters,
    isTracking,
    demoRoute,
    startTracking,
    stopTracking,
    resetSession,
    retryLocation,
    useDemoLocation,
  };
}

type TrackingContextValue = ReturnType<typeof useTrackingState>;

const TrackingContext = createContext<TrackingContextValue | null>(null);

export function TrackingProvider({ children }: { children: ReactNode }) {
  const value = useTrackingState();
  return (
    <TrackingContext.Provider value={value}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  const context = useContext(TrackingContext);

  if (!context) {
    throw new Error('useTracking must be used inside TrackingProvider');
  }

  return context;
}