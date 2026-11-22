import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useExercises } from '../../hooks/useExercises';
import { Exercise } from '../../api/exercises.api';

const EQUIPMENT_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Dumbbell', value: 'dumbbell' },
  { label: 'Barbell', value: 'barbell' },
  { label: 'Cable', value: 'cable' },
  { label: 'Bodyweight', value: 'bodyweight' },
  { label: 'Machine', value: 'machine_pin_selected' },
];

export default function ExercisesScreen() {
  const [search, setSearch] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string | undefined>(undefined);

  // TanStack Query with aggressive caching
  const { data, isLoading, isError, refetch } = useExercises({
    search: search.trim() || undefined,
    equipment: selectedEquipment,
    limit: 50,
  });

  const exercises = data?.data || [];

  const renderExercise = ({ item }: { item: Exercise }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <View style={styles.tagBadge}>
          <Text style={styles.tagBadgeText}>{item.equipment}</Text>
        </View>
      </View>

      <Text style={styles.bodyPartText}>
        Target: <Text style={styles.boldText}>{item.bodyPart.toUpperCase()}</Text> •{' '}
        {item.difficulty}
      </Text>

      {item.instructions && item.instructions.length > 0 && (
        <Text style={styles.instructionPreview} numberOfLines={2}>
          {item.instructions[0]}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search 700+ exercises..."
          placeholderTextColor="#64748B"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Equipment Filter Chips */}
      <View style={styles.chipScroll}>
        {EQUIPMENT_FILTERS.map((chip) => {
          const isSelected = selectedEquipment === chip.value;
          return (
            <TouchableOpacity
              key={chip.label}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => setSelectedEquipment(chip.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Exercise List */}
      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading exercise catalog...</Text>
        </View>
      ) : isError ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>Failed to load exercises</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={renderExercise}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No exercises match your filter</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#131B2E',
    color: '#FFFFFF',
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipScroll: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#131B2E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  chipSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  card: {
    backgroundColor: '#131B2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  exerciseName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  tagBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagBadgeText: {
    color: '#818CF8',
    fontSize: 11,
    fontWeight: '700',
  },
  bodyPartText: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 8,
  },
  boldText: {
    color: '#E2E8F0',
    fontWeight: '700',
  },
  instructionPreview: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    color: '#F87171',
    fontSize: 15,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyBox: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 15,
  },
});
