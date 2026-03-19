# PathFinder

PathFinder is a React Native app built with Expo for recording walking or movement sessions on a map, saving them locally, and reopening them later from history.

The assignment asked for four core capabilities: live map/location display, route tracking with distance and duration, local persistence, and history/detail screens. It also required Expo, MapTiler, one of React Context/Zustand/Redux for state management, and a modern styling library such as NativeWind or Styled Components. This project implements those requirements with Expo, `react-native-maps`, MapTiler tiles, React Context, AsyncStorage, and NativeWind. 

## What the app does

- Shows the user’s current location on a map.
- Starts and stops a tracking session.
- Draws the recorded path as a polyline while tracking.
- Displays live duration and estimated distance.
- Saves completed activities locally on the device.
- Lists saved activities on a history screen.
- Opens a detail screen for each saved activity and redraws the recorded route.
- Handles missing GPS permission and missing GPS signal.
- Offers a demo mode when a live GPS fix is not available.

## How the app is structured

### Screens

- `src/app/index.tsx` — home screen for live tracking
- `src/app/history.tsx` — list of saved activities
- `src/app/activity/[id].tsx` — detail view for one saved activity

### Main pieces

- `src/hooks/useTracking.tsx` — tracking logic, permissions, live updates, demo route, timing, and distance calculation
- `src/components/TrackingMap.tsx` — map rendering, current marker, and path polyline
- `src/components/StatsCard.tsx` — duration and distance summary
- `src/lib/storage.ts` — save/load activity records with AsyncStorage
- `src/lib/maptiler.ts` — MapTiler tile URL and attribution constants
- `src/lib/distance.ts` — distance calculation between coordinate points
- `src/lib/format.ts` — formatting helpers for time, distance, and date

## Run the project

### Requirements

- Node.js 18+
- npm
- Expo CLI through `npx expo`
- Android emulator, iOS simulator, or a physical device with Expo Go / Expo development build

### Install

```bash
npm install
```

### Start the app

```bash
npx expo start
```

### Open it

From the Expo terminal you can choose:

- `a` for Android
- `i` for iOS
- `w` for web
- or scan the QR code with Expo Go on a real device

## MapTiler setup

The app uses a MapTiler key from `src/lib/maptiler.ts`.

Current location in the codebase:

```ts
export const MAPTILER_KEY = 'YOUR_KEY_HERE';
```

Replace it with your own free MapTiler key before sharing or deploying.

Notes:

- MapTiler tiles are rendered through `UrlTile`.
- The app keeps a native map fallback where MapTiler tiles are not being used.
- Attribution is shown on the map when the tile layer is active.

## How tracking works

### Live mode

When the app starts, it asks for foreground location permission and tries to get a live GPS fix. If that succeeds:

- the user’s current location is shown on the map
- pressing **Start Tracking** begins a live watch
- each accepted location update is appended to the coordinate list
- duration is counted once per second
- distance is accumulated from accepted coordinate-to-coordinate movement

Location updates are filtered so obvious noise is ignored:

- very poor horizontal accuracy is ignored
- tiny jumps are ignored
- unrealistic jumps are ignored

### Demo mode

If the app cannot get a live GPS fix, the user can switch to demo mode.

Demo mode uses a predefined set of waypoints and requests a walking route from OSRM so the simulated path follows streets instead of cutting straight through buildings. If that request fails, the app falls back to the rough demo points.

This makes the app usable during development on an emulator and also covers the “no live GPS” edge case.

## Data model

Each saved activity contains:

- `id`
- `createdAt`
- `durationSec`
- `distanceMeters`
- `coordinates[]`

The records are stored locally with AsyncStorage.

## Criteria from the assignment and how they were fulfilled

The brief asked for:

1. real-time map integration
2. activity tracking
3. persistence
4. history and details
5. Expo as the framework
6. MapTiler as the map provider
7. React Context, Zustand, or Redux for state management
8. NativeWind or Styled Components for styling

These requirements are implemented as follows: fileciteturn0file0L7-L20

### 1) Real-time map integration

- Built with Expo and `react-native-maps`
- Map screen shows current location when a live fix is available
- Recorded coordinates are drawn as a polyline
- MapTiler tiles are integrated through `UrlTile` and attribution is displayed when used

### 2) Activity tracking

- Home screen contains **Start Tracking** and **Stop & Save** actions
- Tracking records GPS coordinates in real time
- Live stats show elapsed duration and estimated distance

### 3) Persistence

- Completed activities are stored locally with AsyncStorage
- Each saved record includes date, distance, duration, and the full coordinate array

### 4) History and details

- History screen lists every saved activity
- Detail screen redraws the stored route on a static map view

### 5) State management requirement

This project fulfills the state management requirement with **React Context**.

How it is implemented:

- `src/hooks/useTracking.tsx` contains the tracking state and actions
- the same file exposes `TrackingProvider`
- `src/app/_layout.tsx` wraps the app in that provider
- screens access the shared tracking state through `useTracking()`

This matches the assignment requirement to use **React Context, Zustand, or Redux**. fileciteturn0file0L17-L20

### 6) Styling requirement

This project fulfills the styling requirement with **NativeWind**.

How it is implemented:

- screen-level UI uses NativeWind utility classes through `className`
- the styling approach is applied in the main app screens, especially the history and activity detail views, and can also be used on the home screen in the final version
- standard React Native `StyleSheet` is still used in a few shared components where that is simpler or more practical, such as map-related layout

This still satisfies the assignment requirement to use a modern styling library such as **NativeWind** or **Styled Components**. fileciteturn0file0L17-L20

## Edge cases handled

The brief explicitly asks what happens when the user denies location permission. fileciteturn0file0L21-L27

This project handles the main edge cases like this:

- **Permission denied** — the home screen shows a clear message instead of crashing
- **No live GPS fix** — the app offers retry and demo mode
- **Unusable GPS updates** — noisy updates are filtered out
- **Empty save attempt** — the app refuses to save and shows an alert
- **Missing saved activity** — detail screen shows an empty state instead of failing
- **OSRM demo route failure** — the app falls back to rough demo points

## AI use during development

The assignment asks for a short explanation of which AI tools were used and how they helped. fileciteturn0file0L28-L33

AI assistance was used through **ChatGPT** during development.

It helped with:

- shaping the tracking hook
- debugging location permission and GPS fallback logic
- improving the demo route so it follows streets instead of straight lines
- reviewing screen structure and state flow
- cleaning up the history/detail screen styling
- checking that the requested technical criteria were actually satisfied

The final code still required manual testing, manual fixes, and several iterations to keep the app stable.

## Biggest challenge during development

The biggest challenge was making the app behave sensibly when live GPS was unavailable.

A straight list of fake coordinates creates unrealistic paths that cut through buildings. To make demo mode useful, the simulated route had to be turned into a road-following walking route. The second challenge was keeping the UI stable while introducing the required styling approach without breaking working screens.

## Known limitations

- Activities are stored locally only; there is no cloud sync
- Distance is estimated from sampled coordinate points, so it depends on GPS quality
- Background tracking is not implemented
- Demo routing depends on a public OSRM endpoint and should be replaced for production use
- MapTiler key management is currently simple and should be moved out of source code for a production app

## Repository checklist

Before submission, make sure the repository contains:

- working root config for NativeWind if you are submitting the NativeWind version
- your final MapTiler key handling approach
- the latest `README.md`
- a clean `package-lock.json`
- no unnecessary local editor files

## Summary

PathFinder is a small Expo app that records routes, saves them locally, and replays them later. It meets the assignment goals for tracking, persistence, history/detail screens, state management, and styling, while also handling the main location-related failure cases the brief calls out. fileciteturn0file0L21-L33
