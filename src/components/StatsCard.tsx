import { StyleSheet, Text, View } from 'react-native';

import { formatDistance, formatDuration } from '@/lib/format';

type Props = {
  durationSec: number;
  distanceMeters: number;
};

export default function StatsCard({ durationSec, distanceMeters }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Live Activity</Text>
      <Text style={styles.value}>Duration: {formatDuration(durationSec)}</Text>
      <Text style={styles.value}>Distance: {formatDistance(distanceMeters)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    top: 18,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 18,
    padding: 16,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  value: {
    color: '#cbd5e1',
    fontSize: 15,
    marginTop: 4,
  },
});