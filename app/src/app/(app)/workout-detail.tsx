import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useWorkoutDetail } from '@/hooks/useWorkouts';
import { useExercises } from '@/hooks/useExercises';
import { getExerciseImageUrl } from '@/config/constants';

function formatFullDate(dateString?: string | null): string {
  if (!dateString) return 'Completed Session';
  try {
    const d = new Date(dateString);
    return `${d.toLocaleDateString([], {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })} • ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return dateString;
  }
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '0 min';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m`;
}

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const { data: workout, isLoading, isError, refetch } = useWorkoutDetail(id || '');
  const { data: exercisesData } = useExercises({ limit: 1000 });

  const exercisesMap = useMemo(() => {
    const map = new Map<string, any>();
    if (exercisesData?.data) {
      for (const ex of exercisesData.data) {
        map.set(ex.id, ex);
      }
    }
    return map;
  }, [exercisesData]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading workout log...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !workout) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centerBox}>
          <Ionicons name="alert-circle-outline" size={48} color="#F87171" />
          <Text style={styles.errorTitle}>Workout Not Found</Text>
          <Text style={styles.errorSubtitle}>Could not load the details for this session.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const exercises = workout.exercises || [];

  // Count total PRs in workout
  const totalPrs = exercises.reduce((acc, ex) => {
    return acc + (ex.sets?.filter((s) => s.isPr).length || 0);
  }, 0);

  // Muscle tags
  const musclesHit = Object.entries(workout.muscleScores || {})
    .filter(([_, count]) => Number(count) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.topBarTitleCol}>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {workout.title || 'Workout Log'}
          </Text>
          <Text style={styles.topBarSub}>{formatFullDate(workout.completedAt || workout.startedAt)}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Metric Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{formatDuration(workout.durationSeconds)}</Text>
              <Text style={styles.summaryLabel}>Duration</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {workout.totalVolumeKg
                  ? `${Math.round(Number(workout.totalVolumeKg)).toLocaleString()} kg`
                  : '0 kg'}
              </Text>
              <Text style={styles.summaryLabel}>Total Volume</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{workout.totalSetsCompleted || 0}</Text>
              <Text style={styles.summaryLabel}>Sets Completed</Text>
            </View>
          </View>

          {totalPrs > 0 && (
            <View style={styles.prBanner}>
              <Ionicons name="trophy" size={16} color="#FACC15" />
              <Text style={styles.prBannerText}>
                {totalPrs} Personal Record{totalPrs > 1 ? 's' : ''} achieved in this session!
              </Text>
            </View>
          )}
        </View>

        {/* Notes if any */}
        {Boolean(workout.notes) && (
          <View style={styles.notesCard}>
            <Text style={styles.notesHeading}>Workout Notes</Text>
            <Text style={styles.notesText}>{workout.notes}</Text>
          </View>
        )}

        {/* Muscles Targeted */}
        {musclesHit.length > 0 && (
          <View style={styles.musclesSection}>
            <Text style={styles.sectionHeading}>Muscles Targeted</Text>
            <View style={styles.muscleChipsWrap}>
              {musclesHit.map(([muscle, score]) => (
                <View key={muscle} style={styles.muscleChip}>
                  <Text style={styles.muscleChipText}>
                    {muscle.replace(/_/g, ' ')} ({score})
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Exercises Log Breakdown */}
        <View style={styles.exercisesSection}>
          <Text style={styles.sectionHeading}>Exercise Breakdown</Text>

          {exercises.length === 0 ? (
            <View style={styles.emptyExerciseCard}>
              <Text style={styles.emptyExerciseText}>No exercises recorded in this session.</Text>
            </View>
          ) : (
            exercises.map((item, idx) => {
              const meta = exercisesMap.get(item.exerciseId);
              const name = meta?.name || item.exerciseId.replace(/-/g, ' ');
              const imageUrl = meta ? getExerciseImageUrl(meta.images) : null;
              const sets = item.sets || [];

              return (
                <View key={item.id || idx} style={styles.exerciseCard}>
                  {/* Exercise Header */}
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseImageCircle}>
                      {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.exerciseThumb} contentFit="cover" />
                      ) : (
                        <Ionicons name="barbell" size={18} color="#71717A" />
                      )}
                    </View>
                    <View style={styles.exerciseNameCol}>
                      <Text style={styles.exerciseNameText}>{name}</Text>
                      {meta?.bodyPart && (
                        <Text style={styles.exerciseBodyPartText}>
                          {meta.bodyPart} • {meta.category || 'Strength'}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Sets Table Header */}
                  <View style={styles.setsTableHeader}>
                    <Text style={[styles.tableColHeader, { width: 44 }]}>SET</Text>
                    <Text style={[styles.tableColHeader, { flex: 1 }]}>WEIGHT</Text>
                    <Text style={[styles.tableColHeader, { flex: 1 }]}>REPS</Text>
                    <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'right' }]}>1RM</Text>
                  </View>

                  {/* Sets Rows */}
                  {sets.map((s) => {
                    const weightVal = Number(s.weight) || 0;
                    const repsVal = s.reps || 0;
                    const e1rmVal = s.estimated1rmKg ? Math.round(Number(s.estimated1rmKg)) : 0;

                    return (
                      <View key={s.id} style={styles.setRow}>
                        <View style={styles.setNumBox}>
                          <Text style={styles.setNumText}>{s.setNumber}</Text>
                        </View>

                        <Text style={styles.setColText}>{weightVal} kg</Text>
                        <Text style={styles.setColText}>{repsVal} reps</Text>

                        <View style={styles.setRightCol}>
                          {e1rmVal > 0 && <Text style={styles.e1rmText}>{e1rmVal} kg</Text>}
                          {s.isPr && (
                            <View style={styles.setPrBadge}>
                              <Ionicons name="trophy" size={10} color="#FACC15" />
                              <Text style={styles.setPrText}>PR</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#141414',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topBarTitleCol: {
    flex: 1,
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  topBarSub: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    color: '#71717A',
    fontSize: 14,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  errorSubtitle: {
    color: '#71717A',
    fontSize: 13,
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 10,
    backgroundColor: '#6366F1',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  summaryCard: {
    backgroundColor: '#121212',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222222',
  },
  summaryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  summaryLabel: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#222222',
  },
  prBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 14,
    gap: 8,
  },
  prBannerText: {
    color: '#FACC15',
    fontSize: 12,
    fontWeight: '700',
  },
  notesCard: {
    backgroundColor: '#121212',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#222222',
  },
  notesHeading: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  notesText: {
    color: '#E4E4E7',
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  musclesSection: {
    gap: 8,
  },
  sectionHeading: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  muscleChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleChip: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  muscleChipText: {
    color: '#D4D4D8',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  exercisesSection: {
    gap: 12,
  },
  emptyExerciseCard: {
    backgroundColor: '#121212',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222222',
  },
  emptyExerciseText: {
    color: '#71717A',
    fontSize: 13,
  },
  exerciseCard: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#222222',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    gap: 12,
  },
  exerciseImageCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  exerciseThumb: {
    width: '100%',
    height: '100%',
  },
  exerciseNameCol: {
    flex: 1,
  },
  exerciseNameText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  exerciseBodyPartText: {
    color: '#71717A',
    fontSize: 11,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  setsTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginBottom: 8,
  },
  tableColHeader: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  setNumBox: {
    width: 44,
  },
  setNumText: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '700',
  },
  setColText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  setRightCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  e1rmText: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '600',
  },
  setPrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    gap: 3,
  },
  setPrText: {
    color: '#FACC15',
    fontSize: 10,
    fontWeight: '800',
  },
});
