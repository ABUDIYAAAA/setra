import React, { createContext, useContext, useState, useMemo } from 'react';
import { Exercise } from '../api/exercises.api';
import { RoutineDetail } from '../api/routines.api';

export interface DraftSet {
  setNumber: number;
  type: 'warmup' | 'normal' | 'drop' | 'failure';
  weight: number | null;
  weightUnit: 'kg' | 'lbs';
  reps: number | null;
  targetDurationSeconds?: number | null;
}

export interface DraftExercise {
  exerciseId: string;
  name: string;
  bodyPart: string;
  equipment: string;
  notes?: string;
  restTimerSeconds?: number | null;
  sets: DraftSet[];
}

interface RoutineDraftContextType {
  editingRoutineId: string | null;
  title: string;
  setTitle: (title: string) => void;
  exercises: DraftExercise[];
  loadRoutineForEdit: (routine: RoutineDetail) => void;
  addExercisesFromCatalog: (catalogExercises: Exercise[]) => void;
  removeExercise: (index: number) => void;
  addSet: (exerciseIndex: number) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;
  updateSet: (exerciseIndex: number, setIndex: number, updates: Partial<DraftSet>) => void;
  resetDraft: () => void;
  isDirty: boolean;
}

const RoutineDraftContext = createContext<RoutineDraftContextType | undefined>(undefined);

export const RoutineDraftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [exercises, setExercises] = useState<DraftExercise[]>([]);
  const [initialSnapshot, setInitialSnapshot] = useState<string>('');

  const isDirty = useMemo(() => {
    if (editingRoutineId) {
      const current = JSON.stringify({ title, exercises });
      return current !== initialSnapshot;
    }
    return Boolean(title.trim().length > 0 || exercises.length > 0);
  }, [editingRoutineId, title, exercises, initialSnapshot]);

  const loadRoutineForEdit = (routine: RoutineDetail) => {
    setEditingRoutineId(routine.id);
    setTitle(routine.title);
    const mappedExercises: DraftExercise[] = (routine.exercises || []).map((ex) => ({
      exerciseId: ex.exerciseId,
      name: ex.name,
      bodyPart: ex.bodyPart,
      equipment: ex.equipment,
      notes: ex.notes || '',
      restTimerSeconds: ex.restTimerSeconds ?? null,
      sets: ex.sets.map((s, idx) => ({
        setNumber: s.setNumber ?? idx + 1,
        type: s.type || 'normal',
        weight: s.weight ?? null,
        weightUnit: s.weightUnit || 'kg',
        reps: s.reps ?? 10,
        targetDurationSeconds: s.targetDurationSeconds ?? null,
      })),
    }));

    setExercises(mappedExercises);
    setInitialSnapshot(JSON.stringify({ title: routine.title, exercises: mappedExercises }));
  };

  const addExercisesFromCatalog = (catalogExercises: Exercise[]) => {
    setExercises((prev) => {
      // Map new exercises, avoiding duplicate IDs if desired or appending
      const newItems: DraftExercise[] = catalogExercises.map((catalogEx) => ({
        exerciseId: catalogEx.id,
        name: catalogEx.name,
        bodyPart: catalogEx.bodyPart,
        equipment: catalogEx.equipment,
        notes: '',
        restTimerSeconds: null,
        sets: [
          {
            setNumber: 1,
            type: 'normal',
            weight: null,
            weightUnit: 'kg',
            reps: 10,
          },
        ],
      }));
      return [...prev, ...newItems];
    });
  };

  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const addSet = (exerciseIndex: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      const targetExercise = updated[exerciseIndex];
      if (!targetExercise) return prev;

      const lastSet = targetExercise.sets[targetExercise.sets.length - 1];
      const newSetNumber = targetExercise.sets.length + 1;

      targetExercise.sets = [
        ...targetExercise.sets,
        {
          setNumber: newSetNumber,
          type: 'normal',
          weight: lastSet?.weight ?? null,
          weightUnit: lastSet?.weightUnit ?? 'kg',
          reps: lastSet?.reps ?? 10,
        },
      ];

      return updated;
    });
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      const targetExercise = updated[exerciseIndex];
      if (!targetExercise || targetExercise.sets.length <= 1) return prev;

      targetExercise.sets = targetExercise.sets
        .filter((_, i) => i !== setIndex)
        .map((s, idx) => ({ ...s, setNumber: idx + 1 }));

      return updated;
    });
  };

  const updateSet = (exerciseIndex: number, setIndex: number, updates: Partial<DraftSet>) => {
    setExercises((prev) => {
      const updated = [...prev];
      const targetExercise = updated[exerciseIndex];
      if (!targetExercise) return prev;

      targetExercise.sets = targetExercise.sets.map((s, i) =>
        i === setIndex ? { ...s, ...updates } : s
      );

      return updated;
    });
  };

  const resetDraft = () => {
    setEditingRoutineId(null);
    setTitle('');
    setExercises([]);
    setInitialSnapshot('');
  };

  return (
    <RoutineDraftContext.Provider
      value={{
        editingRoutineId,
        title,
        setTitle,
        exercises,
        loadRoutineForEdit,
        addExercisesFromCatalog,
        removeExercise,
        addSet,
        removeSet,
        updateSet,
        resetDraft,
        isDirty,
      }}
    >
      {children}
    </RoutineDraftContext.Provider>
  );
};

export const useRoutineDraft = () => {
  const context = useContext(RoutineDraftContext);
  if (!context) {
    throw new Error('useRoutineDraft must be used within a RoutineDraftProvider');
  }
  return context;
};
