import { Activity } from '@/types/activity';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVITIES_KEY = '@pathfinder/activities';

export async function getActivities(): Promise<Activity[]> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVITIES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Activity[];
  } catch (error) {
    console.error('Failed to load activities:', error);
    return [];
  }
}

export async function saveActivity(activity: Activity): Promise<void> {
  try {
    const existing = await getActivities();
    const updated = [activity, ...existing];
    await AsyncStorage.setItem(ACTIVITIES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save activity:', error);
    throw error;
  }
}

export async function getActivityById(id: string): Promise<Activity | null> {
  try {
    const activities = await getActivities();
    return activities.find((item) => item.id === id) ?? null;
  } catch (error) {
    console.error('Failed to load activity by id:', error);
    return null;
  }
}