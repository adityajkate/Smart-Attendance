import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // We use custom headers in each screen
        tabBarStyle: {
          backgroundColor: '#0F172A', // Deep Slate (Matches App Background)
          borderTopWidth: 1,
          borderTopColor: '#1E293B',
          height: Platform.OS === 'android' ? 60 : 85,
          paddingBottom: Platform.OS === 'android' ? 10 : 30,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#6366F1', // Indigo (Neon pop)
        tabBarInactiveTintColor: '#64748B', // Muted Slate
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      {/* 1. DASHBOARD */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={24} color={color} />
          ),
        }}
      />

      {/* 2. CALENDAR */}
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-month" size={24} color={color} />
          ),
        }}
      />

      {/* 3. SUBJECTS */}
      <Tabs.Screen
        name="subjects"
        options={{
          title: 'Subjects',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="notebook" size={24} color={color} />
          ),
        }}
      />

      {/* 4. MANUAL (NEW) */}
      <Tabs.Screen
        name="manual"
        options={{
          title: 'Guide',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="book-open-page-variant" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}