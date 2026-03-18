import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import EmptyState from '@/components/EmptyState';
import {
  formatActivityDate,
  formatDistance,
  formatDuration,
} from '@/lib/format';
import { getActivities } from '@/lib/storage';
import { Activity } from '@/types/activity';

export default function HistoryScreen() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getActivities();
      setActivities(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadActivities();
    }, [loadActivities])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Activity History</Text>
            <Text style={styles.subtitle}>
              {activities.length} saved{' '}
              {activities.length === 1 ? 'activity' : 'activities'}
            </Text>
          </View>

          <Pressable
            style={styles.backButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.backButtonText}>Back Home</Text>
          </Pressable>
        </View>

        {activities.length === 0 ? (
          <EmptyState
            title="No saved activities"
            message="Start a route, tap Stop & Save, and it will appear here."
          />
        ) : (
          <FlatList
            data={activities}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() => router.push(`/activity/${item.id}`)}
              >
                <Text style={styles.cardDate}>
                  {formatActivityDate(item.createdAt)}
                </Text>

                <View style={styles.metricsRow}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Distance</Text>
                    <Text style={styles.metricValue}>
                      {formatDistance(item.distanceMeters)}
                    </Text>
                  </View>

                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Duration</Text>
                    <Text style={styles.metricValue}>
                      {formatDuration(item.durationSec)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.linkText}>Tap to open detail map</Text>
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 16,
    color: '#e5e7eb',
  },
  container: {
    flex: 1,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerRow: {
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    marginTop: 4,
    color: '#9ca3af',
    fontSize: 14,
  },
  backButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#1f2937',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backButtonText: {
    fontWeight: '700',
    color: '#f9fafb',
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#1f2937',
    padding: 16,
  },
  cardDate: {
    marginBottom: 12,
    fontSize: 17,
    fontWeight: '700',
    color: '#f9fafb',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricBox: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#111827',
    padding: 12,
  },
  metricLabel: {
    marginBottom: 4,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#9ca3af',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  linkText: {
    marginTop: 12,
    fontWeight: '600',
    color: '#86efac',
  },
});