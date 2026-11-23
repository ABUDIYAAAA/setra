import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useActiveWorkout,
  useUpdateWorkoutSet,
  useAddWorkoutSet,
  useDeleteWorkoutSet,
  useRemoveWorkoutExercise,
  useFinishWorkout,
  useDiscardWorkout,
  useAddWorkoutExercise,
} from '@/hooks/useWorkouts';
import { useExercises } from '@/hooks/useExercises';
import { ExerciseThumbnail } from '@/components/ExerciseThumbnail';
import { RestTimerModal } from '@/components/RestTimerModal';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { data: activeWorkout, isLoading, refetch } = useActiveWorkout();

  const updateSetMutation = useUpdateWorkoutSet();
  const addSetMutation = useAddWorkoutSet();
  const deleteSetMutation = useDeleteWorkoutSet();
  const removeExerciseMutation = useRemoveWorkoutExercise();
  const finishWorkoutMutation = useFinishWorkout();
  const discardWorkoutMutation = useDiscardWorkout();
  const addExerciseMutation = useAddWorkoutExercise();

  // Exercise catalog lookup for images & info
  const { data: exerciseCatalog } = useExercises({ limit: 1000 });
  const exerciseMap = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    if (exerciseCatalog?.data) {
      const map = new Map();
      for (const ex of exerciseCatalog.data) {
        map.set(ex.id, ex);
      }
      exerciseMap.current = map;
    }
  }, [exerciseCatalog]);

  // Live Timer State
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!activeWorkout?.startedAt) return;
    const startMs = new Date(activeWorkout.startedAt).getTime();

    const updateTimer = () => {
      const nowMs = Date.now();
      const diffSec = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      setElapsedSeconds(diffSec);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout?.startedAt]);

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Rest Timer State
  const [activeRestSeconds, setActiveRestSeconds] = useState<number | null>(null);
  const [timerModalExerciseId, setTimerModalExerciseId] = useState<string | null>(null);
  const [latestPrBanner, setLatestPrBanner] = useState<string | null>(null);

  useEffect(() => {
    if (activeRestSeconds === null || activeRestSeconds <= 0) return;
    const timer = setInterval(() => {
      setActiveRestSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeRestSeconds]);

  // Local state for set input edits (weight, reps)
  const [localSetValues, setLocalSetValues] = useState<Record<string, { weight: string; reps: string }>>({});

  const getSetInputs = (setId: string, defaultWeight: any, defaultReps: any) => {
    if (localSetValues[setId]) return localSetValues[setId];
    return {
      weight: defaultWeight !== null && defaultWeight !== undefined ? String(defaultWeight) : '',
      reps: defaultReps !== null && defaultReps !== undefined ? String(defaultReps) : '10',
    };
  };

  const handleSetInputChange = (setId: string, field: 'weight' | 'reps', value: string) => {
    setLocalSetValues((prev) => ({
      ...prev,
      [setId]: {
        ...prev[setId],
        [field]: value,
      },
    }));
  };

  const handleToggleComplete = async (setId: string, ex: any, currentSet: any) => {
    if (!activeWorkout) return;
    const inputs = getSetInputs(setId, currentSet.weight, currentSet.reps);
    const weightNum = inputs.weight ? parseFloat(inputs.weight) : null;
    const repsNum = inputs.reps ? parseInt(inputs.reps, 10) : null;
    const willBeCompleted = !currentSet.isCompleted;

    try {
      const res = await updateSetMutation.mutateAsync({
        workoutId: activeWorkout.id,
        setId,
        params: {
          weight: weightNum,
          reps: repsNum,
          isCompleted: willBeCompleted,
        },
      });

      // If PR unlocked, trigger celebration toast
      if (res.newPrs && res.newPrs.length > 0) {
        const prLabels = res.newPrs
          .map((p) => (p === 'max_weight' ? 'Heaviest Weight' : p === 'estimated_1rm' ? 'Best 1RM' : 'Rep PR'))
          .join(' & ');
        setLatestPrBanner(`🏆 NEW PR on ${ex.exerciseId}! ${prLabels}`);
        setTimeout(() => setLatestPrBanner(null), 5000);
      }

      // If set just completed and exercise has a rest timer, trigger it
      if (willBeCompleted && ex.restTimerSeconds && ex.restTimerSeconds > 0) {
        setActiveRestSeconds(ex.restTimerSeconds);
      }
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not update set');
    }
  };

  const handleAddSet = async (exerciseId: string) => {
    if (!activeWorkout) return;
    try {
      await addSetMutation.mutateAsync({
        workoutId: activeWorkout.id,
        exerciseId,
      });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not add set');
    }
  };

  const handleDeleteSet = (setId: string) => {
    if (!activeWorkout) return;
    Alert.alert('Delete Set', 'Are you sure you want to delete this set?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteSetMutation.mutate({ workoutId: activeWorkout.id, setId }),
      },
    ]);
  };

  const handleRemoveExercise = (exerciseId: string, exName: string) => {
    if (!activeWorkout) return;
    Alert.alert('Remove Exercise', `Remove ${exName} from this workout?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          removeExerciseMutation.mutate({
            workoutId: activeWorkout.id,
            exerciseId,
          }),
      },
    ]);
  };

  const handleFinishWorkout = () => {
    if (!activeWorkout) return;
    Alert.alert('Finish Workout?', 'Are you ready to complete and log this workout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        style: 'default',
        onPress: async () => {
          try {
            await finishWorkoutMutation.mutateAsync({
              id: activeWorkout.id,
              params: { durationSeconds: elapsedSeconds },
            });
            Alert.alert('Workout Logged! 🎉', 'Great job! Your workout and stats have been saved.');
            router.replace('/(app)/(tabs)/workout');
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Could not complete workout');
          }
        },
      },
    ]);
  };

  const handleDiscardWorkout = () => {
    if (!activeWorkout) return;
    Alert.alert('Discard Workout?', 'Are you sure you want to discard this workout session? Progress will not be saved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          try {
            await discardWorkoutMutation.mutateAsync(activeWorkout.id);
            router.replace('/(app)/(tabs)/workout');
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Could not discard workout');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerBox]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading workout session...</Text>
      </SafeAreaView>
    );
  }

  if (!activeWorkout) {
    return (
      <SafeAreaView style={[styles.container, styles.centerBox]}>
        <StatusBar barStyle="light-content" />
        <Ionicons name="barbell-outline" size={48} color="#64748B" />
        <Text style={styles.noWorkoutTitle}>No active workout in progress</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace('/(app)/(tabs)/workout')}
          activeOpacity={0.8}
        >
          <Text style={styles.backBtnText}>Go to Workouts</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Bar: Minimize, Timer, Finish Button */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.timerBadge}>
          <Ionicons name="stopwatch-outline" size={15} color="#818CF8" style={{ marginRight: 5 }} />
          <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
        </View>

        <TouchableOpacity
          style={styles.finishBtn}
          onPress={handleFinishWorkout}
          activeOpacity={0.8}
          disabled={finishWorkoutMutation.isPending}
        >
          {finishWorkoutMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.finishBtnText}>Finish</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* PR Celebration Alert Banner */}
      {latestPrBanner && (
        <View style={styles.prBanner}>
          <Ionicons name="trophy" size={16} color="#F59E0B" style={{ marginRight: 6 }} />
          <Text style={styles.prBannerText}>{latestPrBanner}</Text>
        </View>
      )}

      {/* Active Rest Timer Floating / Top Bar */}
      {activeRestSeconds !== null && (
        <View style={styles.restTimerBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="timer" size={18} color="#818CF8" style={{ marginRight: 6 }} />
            <Text style={styles.restTimerBarText}>Rest: {formatTime(activeRestSeconds)}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={styles.restActionBtn}
              onPress={() => setActiveRestSeconds((prev) => (prev || 0) + 30)}
              activeOpacity={0.7}
            >
              <Text style={styles.restActionBtnText}>+30s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.restActionBtn, { backgroundColor: '#334155' }]}
              onPress={() => setActiveRestSeconds(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.restActionBtnText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Workout Title Header */}
        <View style={styles.titleSection}>
          <Text style={styles.workoutTitle}>{activeWorkout.title}</Text>
          <Text style={styles.workoutMeta}>
            Started {new Date(activeWorkout.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
            {activeWorkout.exercises.length} {activeWorkout.exercises.length === 1 ? 'exercise' : 'exercises'}
          </Text>
        </View>

        {/* Exercises List */}
        {activeWorkout.exercises.map((ex, exIndex) => {
          const catalogItem = exerciseMap.current.get(ex.exerciseId);
          const displayName = catalogItem ? catalogItem.name : ex.exerciseId;

          return (
            <View key={ex.id} style={styles.exerciseCard}>
              {/* Exercise Header */}
              <View style={styles.exerciseHeader}>
                <TouchableOpacity
                  style={styles.exerciseTitleClickable}
                  onPress={() => router.push({ pathname: '/exercise-details', params: { id: ex.exerciseId } })}
                  activeOpacity={0.7}
                >
                  <ExerciseThumbnail images={catalogItem?.images} size={42} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.exerciseNameText}>{displayName}</Text>
                    {catalogItem?.bodyPart ? (
                      <Text style={styles.exerciseMetaText}>{catalogItem.bodyPart.toUpperCase()} • {catalogItem.equipment}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>

                {/* Rest Timer chip */}
                <TouchableOpacity
                  style={styles.restChip}
                  onPress={() => setTimerModalExerciseId(ex.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="timer-outline" size={13} color="#818CF8" />
                  <Text style={styles.restChipText}>
                    {ex.restTimerSeconds ? `${ex.restTimerSeconds}s` : 'Off'}
                  </Text>
                </TouchableOpacity>

                {/* Remove Exercise */}
                <TouchableOpacity
                  style={styles.trashBtn}
                  onPress={() => handleRemoveExercise(ex.id, displayName)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={17} color="#EF4444" />
                </TouchableOpacity>
              </View>

              {/* Sets Table Header */}
              <View style={styles.setTableHeader}>
                <Text style={[styles.colHeader, { width: 40, textAlign: 'center' }]}>SET</Text>
                <Text style={[styles.colHeader, { flex: 1, textAlign: 'center' }]}>KG</Text>
                <Text style={[styles.colHeader, { flex: 1, textAlign: 'center' }]}>REPS</Text>
                <Text style={[styles.colHeader, { width: 44, textAlign: 'center' }]}>✓</Text>
              </View>

              {/* Sets Rows */}
              {ex.sets.map((s) => {
                const inputs = getSetInputs(s.id, s.weight, s.reps);

                return (
                  <View
                    key={s.id}
                    style={[styles.setRow, s.isCompleted && styles.setRowCompleted]}
                  >
                    {/* Set Number Badge */}
                    <View style={styles.setNumBox}>
                      <Text style={[styles.setNumText, s.isCompleted && { color: '#34D399' }]}>
                        {s.setNumber}
                      </Text>
                      {s.isPr && (
                        <Ionicons
                          name="trophy"
                          size={10}
                          color="#F59E0B"
                          style={{ position: 'absolute', top: 2, right: 2 }}
                        />
                      )}
                    </View>

                    {/* Weight Input */}
                    <View style={styles.inputCell}>
                      <TextInput
                        style={[styles.numericInput, s.isCompleted && styles.inputCompleted]}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor="#475569"
                        value={inputs.weight}
                        onChangeText={(val) => handleSetInputChange(s.id, 'weight', val)}
                        returnKeyType="done"
                      />
                    </View>

                    {/* Reps Input */}
                    <View style={styles.inputCell}>
                      <TextInput
                        style={[styles.numericInput, s.isCompleted && styles.inputCompleted]}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor="#475569"
                        value={inputs.reps}
                        onChangeText={(val) => handleSetInputChange(s.id, 'reps', val)}
                        returnKeyType="done"
                      />
                    </View>

                    {/* Completed Checkbox Button */}
                    <TouchableOpacity
                      style={[styles.checkBtn, s.isCompleted && styles.checkBtnCompleted]}
                      onPress={() => handleToggleComplete(s.id, ex, s)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={s.isCompleted ? '#FFFFFF' : '#475569'}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}

              {/* Add Set Button */}
              <TouchableOpacity
                style={styles.addSetBtn}
                onPress={() => handleAddSet(ex.id)}
                activeOpacity={0.75}
              >
                <Ionicons name="add" size={16} color="#818CF8" style={{ marginRight: 4 }} />
                <Text style={styles.addSetText}>Add Set</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Add Exercise to Workout Button */}
        <TouchableOpacity
          style={styles.addExerciseBtn}
          onPress={() => router.push('/select-exercises')}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={20} color="#6366F1" style={{ marginRight: 8 }} />
          <Text style={styles.addExerciseBtnText}>Add Exercise</Text>
        </TouchableOpacity>

        {/* Discard Workout Button */}
        <TouchableOpacity
          style={styles.discardBtn}
          onPress={handleDiscardWorkout}
          activeOpacity={0.8}
        >
          <Ionicons name="close-circle-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
          <Text style={styles.discardBtnText}>Discard Workout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Rest Timer Modal */}
      <RestTimerModal
        visible={timerModalExerciseId !== null}
        currentSeconds={null}
        onSelect={(_sec) => setTimerModalExerciseId(null)}
        onClose={() => setTimerModalExerciseId(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerBox: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },
  noWorkoutTitle: {
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 12,
  },
  backBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#161F30',
  },
  iconBtn: {
    padding: 6,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  finishBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  prBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  prBannerText: {
    color: '#FBBF24',
    fontSize: 13,
    fontWeight: '700',
  },
  restTimerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  restTimerBarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  restActionBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  restActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  titleSection: {
    marginBottom: 4,
  },
  workoutTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  workoutMeta: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },
  exerciseCard: {
    backgroundColor: '#121212',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#222222',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseTitleClickable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseNameText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  exerciseMetaText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  restChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    gap: 4,
  },
  restChipText: {
    color: '#818CF8',
    fontSize: 11,
    fontWeight: '600',
  },
  trashBtn: {
    padding: 6,
  },
  setTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#161F30',
    marginBottom: 8,
  },
  colHeader: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  setRowCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
  },
  setNumBox: {
    width: 40,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  setNumText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  inputCell: {
    flex: 1,
    paddingHorizontal: 6,
  },
  numericInput: {
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    borderRadius: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2E2E2E',
  },
  inputCompleted: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  checkBtn: {
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2E2E2E',
    marginLeft: 6,
  },
  checkBtnCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  addSetText: {
    color: '#818CF8',
    fontSize: 13,
    fontWeight: '700',
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6366F1',
    borderStyle: 'dashed',
  },
  addExerciseBtnText: {
    color: '#818CF8',
    fontSize: 15,
    fontWeight: '700',
  },
  discardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  discardBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
});
