import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRoutineDraft } from '@/context/RoutineDraftContext';
import { useCreateRoutine, useUpdateRoutine, useRoutineDetail } from '@/hooks/useRoutines';

export default function NewRoutineScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const routineId = params.id;
  const isEditMode = Boolean(routineId);

  const {
    editingRoutineId,
    title,
    setTitle,
    exercises,
    loadRoutineForEdit,
    removeExercise,
    addSet,
    removeSet,
    updateSet,
    resetDraft,
    isDirty,
  } = useRoutineDraft();

  const createRoutineMutation = useCreateRoutine();
  const updateRoutineMutation = useUpdateRoutine();
  const { data: existingRoutine, isLoading: isLoadingExisting } = useRoutineDetail(routineId);

  const [isSaving, setIsSaving] = useState(false);

  // When editing an existing routine, populate the draft
  useEffect(() => {
    if (existingRoutine && editingRoutineId !== existingRoutine.id) {
      loadRoutineForEdit(existingRoutine);
    }
  }, [existingRoutine, editingRoutineId]);

  // Top Right Save is enabled only when non-empty title and at least one exercise
  const canSave = Boolean(title.trim().length > 0 && exercises.length > 0 && !isSaving);

  // Top Left Back Button: confirmation alert if unsaved progress exists
  const handleBack = () => {
    if (isDirty) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes in this routine. Are you sure you want to discard them?',
        [
          { text: 'Continue Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              resetDraft();
              router.back();
            },
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);

    const exercisesPayload = exercises.map((ex, index) => ({
      exerciseId: ex.exerciseId,
      orderIndex: index,
      restTimerSeconds: ex.restTimerSeconds ?? null,
      notes: ex.notes || null,
      sets: ex.sets.map((s) => ({
        setNumber: s.setNumber,
        type: s.type,
        weight: s.weight !== null ? Number(s.weight) : null,
        weightUnit: s.weightUnit || 'kg',
        reps: s.reps !== null ? Number(s.reps) : 10,
      })),
    }));

    try {
      if (isEditMode && routineId) {
        await updateRoutineMutation.mutateAsync({
          id: routineId,
          data: {
            title: title.trim(),
            exercises: exercisesPayload,
          },
        });
      } else {
        await createRoutineMutation.mutateAsync({
          title: title.trim(),
          exercises: exercisesPayload,
        });
      }

      resetDraft();
      router.back();
    } catch (err: any) {
      console.error('Save routine error:', err);
      Alert.alert(
        'Save Failed',
        err?.response?.data?.error?.message || err?.message || 'Could not save routine'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const openExercisePicker = () => {
    router.push('/select-exercises');
  };

  if (isEditMode && isLoadingExisting && !title) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingCenterBox}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading routine...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Header Bar */}
      <View style={styles.header}>
        {/* Top Left Back Button */}
        <TouchableOpacity style={styles.headerIconBtn} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{isEditMode ? 'Edit Routine' : 'New Routine'}</Text>

        {/* Top Right Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, canSave && styles.saveBtnActive]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[styles.saveBtnText, canSave && styles.saveBtnTextActive]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Top Long Text Field with Helper Text */}
        <View style={styles.titleSection}>
          <TextInput
            style={styles.titleInput}
            placeholder="New Title"
            placeholderTextColor="#64748B"
            value={title}
            onChangeText={setTitle}
            returnKeyType="done"
          />
        </View>

        {/* Exercises Section */}
        {exercises.length === 0 ? (
          /* Center Add Exercise Button when 0 exercises */
          <View style={styles.centerContainer}>
            <TouchableOpacity
              style={styles.centerAddButton}
              onPress={openExercisePicker}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={26} color="#818CF8" style={{ marginRight: 8 }} />
              <Text style={styles.centerAddButtonText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* List of exercises, each with sets */
          <View style={styles.exerciseList}>
            {exercises.map((ex, exIndex) => (
              <View key={`${ex.exerciseId}-${exIndex}`} style={styles.exerciseCard}>
                {/* Exercise Card Header */}
                <View style={styles.exerciseCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <View style={styles.exerciseBadgeRow}>
                      <Text style={styles.exerciseBadgeText}>{ex.bodyPart.toUpperCase()}</Text>
                      <Text style={styles.metaDot}>•</Text>
                      <Text style={styles.exerciseEquipment}>{ex.equipment}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.removeExBtn}
                    onPress={() => removeExercise(exIndex)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                {/* Sets Table Header */}
                <View style={styles.setTableHeader}>
                  <Text style={[styles.tableColHeader, { width: 44, textAlign: 'center' }]}>SET</Text>
                  <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'center' }]}>KG</Text>
                  <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'center' }]}>REPS</Text>
                  <View style={{ width: 36 }} />
                </View>

                {/* Set Rows */}
                {ex.sets.map((set, sIndex) => (
                  <View key={sIndex} style={styles.setRow}>
                    <View style={styles.setNumberBadge}>
                      <Text style={styles.setNumberText}>{set.setNumber}</Text>
                    </View>

                    {/* Weight Input */}
                    <TextInput
                      style={styles.setInput}
                      placeholder="—"
                      placeholderTextColor="#475569"
                      keyboardType="numeric"
                      value={set.weight !== null && set.weight !== undefined ? String(set.weight) : ''}
                      onChangeText={(val) => {
                        const numeric = val.trim() === '' ? null : parseFloat(val);
                        updateSet(exIndex, sIndex, { weight: isNaN(numeric as number) ? null : numeric });
                      }}
                    />

                    {/* Reps Input */}
                    <TextInput
                      style={styles.setInput}
                      placeholder="10"
                      placeholderTextColor="#475569"
                      keyboardType="numeric"
                      value={set.reps !== null && set.reps !== undefined ? String(set.reps) : ''}
                      onChangeText={(val) => {
                        const numeric = val.trim() === '' ? null : parseInt(val, 10);
                        updateSet(exIndex, sIndex, { reps: isNaN(numeric as number) ? null : numeric });
                      }}
                    />

                    {/* Delete Set Button */}
                    <TouchableOpacity
                      style={styles.deleteSetBtn}
                      onPress={() => removeSet(exIndex, sIndex)}
                      disabled={ex.sets.length <= 1}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="close"
                        size={16}
                        color={ex.sets.length <= 1 ? '#334155' : '#94A3B8'}
                      />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Add Set Button */}
                <TouchableOpacity
                  style={styles.addSetBtn}
                  onPress={() => addSet(exIndex)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={16} color="#818CF8" style={{ marginRight: 4 }} />
                  <Text style={styles.addSetText}>Add Set</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* "+ Add Exercise" Button at the bottom of all exercises */}
            <TouchableOpacity
              style={styles.bottomAddExerciseButton}
              onPress={openExercisePicker}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={20} color="#818CF8" style={{ marginRight: 6 }} />
              <Text style={styles.bottomAddExerciseText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  saveBtnActive: {
    backgroundColor: '#6366F1',
  },
  saveBtnText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '700',
  },
  saveBtnTextActive: {
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  titleSection: {
    marginBottom: 20,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    letterSpacing: -0.3,
  },
  centerContainer: {
    flex: 1,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCenterBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  centerAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  centerAddButtonText: {
    color: '#818CF8',
    fontSize: 16,
    fontWeight: '700',
  },
  exerciseList: {
    gap: 16,
  },
  exerciseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 16,
    gap: 12,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exerciseBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  exerciseBadgeText: {
    fontSize: 11,
    color: '#A5B4FC',
    fontWeight: '700',
  },
  metaDot: {
    color: '#475569',
    fontSize: 12,
  },
  exerciseEquipment: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'capitalize',
  },
  removeExBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 10,
  },
  tableColHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  setNumberBadge: {
    width: 44,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumberText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  setInput: {
    flex: 1,
    height: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  deleteSetBtn: {
    width: 36,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 10,
    height: 36,
    marginTop: 4,
  },
  addSetText: {
    color: '#818CF8',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomAddExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    height: 48,
    borderRadius: 14,
    marginTop: 8,
  },
  bottomAddExerciseText: {
    color: '#818CF8',
    fontSize: 15,
    fontWeight: '700',
  },
});
