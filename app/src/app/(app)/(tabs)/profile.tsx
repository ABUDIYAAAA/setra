import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useWorkoutsList, useWorkoutStreaks } from '@/hooks/useWorkouts';
import { MonthWorkoutHeatmap } from '@/components/MonthWorkoutHeatmap';
import { BodyMuscleHeatmap } from '@/components/BodyMuscleHeatmap';

function formatHoursMinutes(totalSeconds = 0): string {
  if (!totalSeconds || totalSeconds <= 0) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: workouts,
    isLoading: isLoadingWorkouts,
    refetch: refetchWorkouts,
  } = useWorkoutsList({ status: 'completed', limit: 100 });

  const { data: streaks, refetch: refetchStreaks } = useWorkoutStreaks();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchWorkouts(), refetchStreaks()]);
    setRefreshing(false);
  };

  const completedWorkouts = workouts || [];

  // Aggregate muscle scores across all completed workouts
  const aggregatedMuscleScores = useMemo(() => {
    const scores: Record<string, number> = {};
    for (const w of completedWorkouts) {
      if (w.muscleScores) {
        for (const [m, count] of Object.entries(w.muscleScores)) {
          scores[m] = (scores[m] || 0) + Number(count);
        }
      }
    }
    return scores;
  }, [completedWorkouts]);

  // Compute training performance stats
  const stats = useMemo(() => {
    const totalWorkouts = completedWorkouts.length;
    let totalSeconds = 0;
    let totalVolumeKg = 0;
    let totalSets = 0;

    let earliestDate = Date.now();
    let latestDate = 0;

    for (const w of completedWorkouts) {
      totalSeconds += Number(w.durationSeconds || 0);
      totalVolumeKg += Number(w.totalVolumeKg || 0);
      totalSets += Number(w.totalSetsCompleted || 0);

      const time = new Date(w.startedAt).getTime();
      if (time < earliestDate) earliestDate = time;
      if (time > latestDate) latestDate = time;
    }

    // Sessions per week
    let sessionsPerWeek = '0.0';
    if (totalWorkouts > 0) {
      const msDiff = Math.max(Date.now() - earliestDate, 7 * 86400000);
      const weeks = msDiff / (7 * 86400000);
      sessionsPerWeek = (totalWorkouts / Math.max(weeks, 1)).toFixed(1);
    }

    const avgVolumePerSession =
      totalWorkouts > 0 ? Math.round(totalVolumeKg / totalWorkouts) : 0;
    const avgDurationPerSession =
      totalWorkouts > 0 ? Math.round(totalSeconds / totalWorkouts / 60) : 0;

    return {
      totalWorkouts,
      totalTimeFormatted: formatHoursMinutes(totalSeconds),
      totalVolumeFormatted: Math.round(totalVolumeKg).toLocaleString(),
      sessionsPerWeek,
      avgVolumePerSession: avgVolumePerSession.toLocaleString(),
      avgDurationPerSession: `${avgDurationPerSession} min`,
      totalSets,
    };
  }, [completedWorkouts]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile & Analytics</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </Text>
              </View>
            )}

            <View style={styles.profileInfo}>
              <Text style={styles.name}>{user?.name || 'Athlete'}</Text>
              <Text style={styles.email} numberOfLines={1}>
                {user?.email}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.compactLogoutBtn}
              onPress={logout}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={16} color="#F87171" />
              <Text style={styles.compactLogoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 1. Monthly Workout Activity Heatmap */}
        {isLoadingWorkouts ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#6366F1" />
            <Text style={styles.loadingText}>Loading training analytics...</Text>
          </View>
        ) : (
          <MonthWorkoutHeatmap workouts={completedWorkouts} />
        )}

        {/* 2. Training Performance Stats Grid */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionHeading}>Training Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.totalTimeFormatted}</Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.sessionsPerWeek} / wk</Text>
              <Text style={styles.statLabel}>Sessions / Wk</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.totalVolumeFormatted} kg</Text>
              <Text style={styles.statLabel}>Total Weight Moved</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.avgVolumePerSession} kg</Text>
              <Text style={styles.statLabel}>Avg Vol / Session</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.avgDurationPerSession}</Text>
              <Text style={styles.statLabel}>Avg Session Time</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.totalSets}</Text>
              <Text style={styles.statLabel}>Total Sets</Text>
            </View>
          </View>
        </View>

        {/* 3. Human Anatomical Model with Muscle Heatmap */}
        <BodyMuscleHeatmap muscleScores={aggregatedMuscleScores} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },
  header: {
    paddingVertical: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  profileCard: {
    backgroundColor: '#121212',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222222',
    padding: 18,
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#6366F1',
    marginRight: 16,
  },
  avatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#818CF8',
    fontSize: 24,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    color: '#71717A',
    marginBottom: 6,
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  loadingText: {
    color: '#71717A',
    fontSize: 13,
  },
  statsCard: {
    backgroundColor: '#121212',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#222222',
    marginBottom: 20,
  },
  sectionHeading: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    width: '48.2%',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#262626',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  statLabel: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '600',
  },
  compactLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 5,
    marginLeft: 10,
  },
  compactLogoutText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '700',
  },
});
