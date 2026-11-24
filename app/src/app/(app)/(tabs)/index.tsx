import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useWorkoutsList, useWorkoutStreaks, useActiveWorkout } from '@/hooks/useWorkouts';
import { useExercises } from '@/hooks/useExercises';
import { getExerciseImageUrl } from '@/config/constants';
import { WorkoutDetail } from '@/api/workouts.api';

function formatWorkoutDate(dateString: string) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today at ${timeStr}`;
    if (isYesterday) return `Yesterday at ${timeStr}`;
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
  } catch {
    return 'Recently';
  }
}

function formatDuration(seconds?: number) {
  if (!seconds || seconds <= 0) return '0 min';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m`;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const firstName = user?.name ? user.name.split(' ')[0] : 'Athlete';

  const [refreshing, setRefreshing] = useState(false);

  // Queries
  const {
    data: workouts,
    isLoading: isLoadingWorkouts,
    refetch: refetchWorkouts,
  } = useWorkoutsList({ status: 'completed', limit: 20 });

  const { data: streaks, refetch: refetchStreaks } = useWorkoutStreaks();
  const { data: activeWorkout, refetch: refetchActive } = useActiveWorkout();
  const { data: exercisesData } = useExercises({ limit: 1000 });

  // Map of exerciseId -> Exercise object for rapid title & image lookup
  const exercisesMap = useMemo(() => {
    const map = new Map<string, any>();
    if (exercisesData?.data) {
      for (const ex of exercisesData.data) {
        map.set(ex.id, ex);
      }
    }
    return map;
  }, [exercisesData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchWorkouts(), refetchStreaks(), refetchActive()]);
    setRefreshing(false);
  };

  const completedWorkouts = workouts || [];

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
        {/* Top Header: Name and Streak */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{firstName}</Text>
          {streaks && streaks.currentDayStreak > 0 && (
            <View style={styles.streakRow}>
              <Text style={styles.streakNumber}>{streaks.currentDayStreak}</Text>
              <Ionicons name="flame" size={20} color="#F97316" />
            </View>
          )}
        </View>

        {/* Active Workout In-Progress Banner */}
        {activeWorkout && (
          <TouchableOpacity
            style={styles.activeWorkoutBanner}
            onPress={() => router.push('/(app)/active-workout')}
            activeOpacity={0.85}
          >
            <View style={styles.activeBannerLeft}>
              <View style={styles.activeTagRow}>
                <View style={styles.pulseDot} />
                <Text style={styles.activeTagText}>IN PROGRESS</Text>
              </View>
              <Text style={styles.activeWorkoutTitle}>{activeWorkout.title}</Text>
              <Text style={styles.activeWorkoutSub}>
                {activeWorkout.exercises?.length || 0} exercises • Tap to resume session
              </Text>
            </View>
            <View style={styles.resumeBtn}>
              <Ionicons name="play" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}

        {/* Workout History Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Workout History</Text>
            {completedWorkouts.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{completedWorkouts.length}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Workout History Content */}
        {isLoadingWorkouts ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#6366F1" />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : completedWorkouts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="barbell-outline" size={30} color="#64748B" />
            </View>
            <Text style={styles.emptyTitle}>No workouts yet</Text>
            <Text style={styles.emptySubtitle}>
              Finish a routine or quick workout to start building your workout history.
            </Text>
            <TouchableOpacity
              style={styles.startWorkoutCta}
              onPress={() => router.push('/(app)/(tabs)/workout')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.startWorkoutCtaText}>Start a Workout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.historyList}>
            {completedWorkouts.map((workout: WorkoutDetail) => (
              <WorkoutHistoryCard
                key={workout.id}
                workout={workout}
                exercisesMap={exercisesMap}
                onWorkoutPress={(workoutId) =>
                  router.push({
                    pathname: '/(app)/workout-detail',
                    params: { id: workoutId },
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Workout History Card Component
function WorkoutHistoryCard({
  workout,
  exercisesMap,
  onWorkoutPress,
}: {
  workout: WorkoutDetail;
  exercisesMap: Map<string, any>;
  onWorkoutPress: (workoutId: string) => void;
}) {
  const exercises = workout.exercises || [];

  // Check if any PR was scored in this workout
  const prCount = exercises.reduce((acc, ex) => {
    const setPrs = ex.sets?.filter((s) => s.isPr).length || 0;
    return acc + setPrs;
  }, 0);

  return (
    <TouchableOpacity
      style={styles.historyCard}
      onPress={() => onWorkoutPress(workout.id)}
      activeOpacity={0.8}
    >
      {/* Card Header */}
      <View style={styles.cardTopRow}>
        <View style={styles.cardTitleCol}>
          <Text style={styles.cardTitle}>{workout.title || 'Workout'}</Text>
          <Text style={styles.cardDate}>{formatWorkoutDate(workout.completedAt || workout.startedAt)}</Text>
        </View>
        {prCount > 0 && (
          <View style={styles.prBadge}>
            <Ionicons name="trophy" size={12} color="#FACC15" style={{ marginRight: 4 }} />
            <Text style={styles.prBadgeText}>{prCount} PR{prCount > 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Ionicons name="time-outline" size={14} color="#94A3B8" />
          <Text style={styles.metricText}>{formatDuration(workout.durationSeconds)}</Text>
        </View>
        <View style={styles.metricDot} />
        <View style={styles.metricItem}>
          <Ionicons name="barbell-outline" size={14} color="#94A3B8" />
          <Text style={styles.metricText}>
            {workout.totalVolumeKg ? `${Math.round(Number(workout.totalVolumeKg)).toLocaleString()} kg` : '0 kg'}
          </Text>
        </View>
        <View style={styles.metricDot} />
        <View style={styles.metricItem}>
          <Ionicons name="checkbox-outline" size={14} color="#94A3B8" />
          <Text style={styles.metricText}>{workout.totalSetsCompleted || 0} sets</Text>
        </View>
      </View>

      {/* Exercises Summary List */}
      {exercises.length > 0 && (
        <View style={styles.exerciseList}>
          {exercises.map((item) => {
            const exerciseMeta = exercisesMap.get(item.exerciseId);
            const exerciseName = exerciseMeta?.name || item.exerciseId.replace(/-/g, ' ');
            const imageUrl = exerciseMeta ? getExerciseImageUrl(exerciseMeta.images) : null;
            const completedSets = item.sets?.filter((s) => s.isCompleted) || [];
            const hasPr = item.sets?.some((s) => s.isPr);

            // Find best set (heaviest weight)
            let bestWeight = 0;
            let bestReps = 0;
            for (const s of completedSets) {
              const w = Number(s.weight) || 0;
              if (w > bestWeight) {
                bestWeight = w;
                bestReps = s.reps || 0;
              }
            }

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.exerciseRow}
                onPress={() => onWorkoutPress(workout.id)}
                activeOpacity={0.7}
              >
                {/* Exercise Small Circle Image / Icon */}
                <View style={styles.exerciseImageCircle}>
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.exerciseThumb}
                      contentFit="cover"
                      transition={150}
                    />
                  ) : (
                    <Ionicons name="barbell" size={16} color="#64748B" />
                  )}
                </View>

                {/* Name & Sets Details */}
                <View style={styles.exerciseInfo}>
                  <View style={styles.exerciseNameRow}>
                    <Text style={styles.exerciseName} numberOfLines={1}>
                      {exerciseName}
                    </Text>
                    {hasPr && <Text style={styles.exercisePrBadge}>PR</Text>}
                  </View>
                  <Text style={styles.exerciseSetSummary}>
                    {completedSets.length} set{completedSets.length === 1 ? '' : 's'}
                    {bestWeight > 0 ? ` • Best: ${bestWeight} kg × ${bestReps}` : ''}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={14} color="#475569" />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Notes if any */}
      {Boolean(workout.notes) && (
        <View style={styles.notesBox}>
          <Text style={styles.notesText} numberOfLines={2}>
            "{workout.notes}"
          </Text>
        </View>
      )}
    </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#141414',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#262626',
  },
  streakNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  activeWorkoutBanner: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#6366F1',
    marginBottom: 16,
  },
  activeBannerLeft: {
    flex: 1,
  },
  activeTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  activeTagText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  activeWorkoutTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  activeWorkoutSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  resumeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2E2E2E',
  },
  countBadgeText: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#71717A',
    fontSize: 13,
  },
  emptyContainer: {
    backgroundColor: '#121212',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222222',
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  emptyIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#71717A',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 240,
    marginBottom: 18,
  },
  startWorkoutCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  startWorkoutCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  historyList: {
    gap: 14,
  },
  historyCard: {
    backgroundColor: '#121212',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222222',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitleCol: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  cardDate: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 2,
  },
  prBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
  },
  prBadgeText: {
    color: '#FACC15',
    fontSize: 11,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    marginBottom: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#3F3F46',
  },
  metricText: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '500',
  },
  exerciseList: {
    gap: 10,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 10,
  },
  exerciseImageCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#262626',
  },
  exerciseThumb: {
    width: '100%',
    height: '100%',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exerciseName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  exercisePrBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    color: '#FACC15',
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  exerciseSetSummary: {
    color: '#71717A',
    fontSize: 11,
    marginTop: 2,
  },
  notesBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  notesText: {
    color: '#71717A',
    fontSize: 12,
    fontStyle: 'italic',
  },
});

