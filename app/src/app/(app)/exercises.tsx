import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useExercises } from '@/hooks/useExercises';
import { Exercise } from '@/api/exercises.api';
import { ExerciseThumbnail } from '@/components/ExerciseThumbnail';

const EQUIPMENT_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Barbell', value: 'barbell' },
  { label: 'Dumbbell', value: 'dumbbell' },
  { label: 'Cable', value: 'cable' },
  { label: 'Machine', value: 'machine_pin_selected' },
  { label: 'Bodyweight', value: 'bodyweight' },
];

export default function ExercisesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string | undefined>(undefined);

  // TanStack Query with 30-min cache
  const { data, isLoading, isError, refetch } = useExercises({
    search: search.trim() || undefined,
    equipment: selectedEquipment,
    limit: 60,
  });

  const exercises = data?.data || [];

  const renderExercise = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/exercise-details', params: { id: item.id } })}
      activeOpacity={0.75}
    >
      <View style={styles.cardTopRow}>
        <ExerciseThumbnail images={item.images} size={46} />
        <View style={styles.cardMainInfo}>
          <View style={styles.cardHeader}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            <View style={styles.tagBadge}>
              <Text style={styles.tagBadgeText}>{item.equipment}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>{item.bodyPart.toUpperCase()}</Text>
            </View>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{item.category}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{item.difficulty}</Text>
          </View>
        </View>
      </View>

      {item.instructions && item.instructions.length > 0 && (
        <Text style={styles.instructionPreview} numberOfLines={2}>
          {item.instructions[0]}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#64748B" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search 700+ exercises..."
            placeholderTextColor="#64748B"
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
            autoCapitalize="none"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#64748B" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Horizontal Equipment Filter Chips */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScroll}
        >
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
        </ScrollView>
      </View>

      {/* Exercise List */}
      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading library...</Text>
        </View>
      ) : isError ? (
        <View style={styles.centerBox}>
          <Ionicons name="alert-circle-outline" size={36} color="#F87171" style={{ marginBottom: 12 }} />
          <Text style={styles.errorText}>Could not load exercise library</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()} activeOpacity={0.8}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={renderExercise}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="search-outline" size={32} color="#475569" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyText}>No exercises match your search</Text>
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
    backgroundColor: '#000000',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  filterSection: {
    paddingVertical: 6,
  },
  chipScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
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
    paddingTop: 8,
    paddingBottom: 32,
    gap: 10,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardMainInfo: {
    flex: 1,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  tagBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagBadgeText: {
    color: '#818CF8',
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaChipText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metaDot: {
    color: '#475569',
    fontSize: 12,
  },
  metaText: {
    color: '#94A3B8',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  instructionPreview: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    color: '#F87171',
    fontSize: 15,
    marginBottom: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyBox: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
});
