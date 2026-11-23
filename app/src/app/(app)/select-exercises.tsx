import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useExercises } from '@/hooks/useExercises';
import { useRoutineDraft } from '@/context/RoutineDraftContext';
import { Exercise } from '@/api/exercises.api';
import { ExerciseThumbnail } from '@/components/ExerciseThumbnail';

export default function SelectExercisesScreen() {
  const router = useRouter();
  const { addExercisesFromCatalog } = useRoutineDraft();

  const [search, setSearch] = useState('');
  const [selectedMap, setSelectedMap] = useState<Map<string, Exercise>>(new Map());

  // Fetch full exercise catalog
  const { data, isLoading } = useExercises({
    search: search.trim() || undefined,
    limit: 100,
  });

  const exercises = data?.data || [];

  const toggleSelect = (exercise: Exercise) => {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (next.has(exercise.id)) {
        next.delete(exercise.id);
      } else {
        next.set(exercise.id, exercise);
      }
      return next;
    });
  };

  const handleConfirmAdd = () => {
    const selectedExercises = Array.from(selectedMap.values());
    if (selectedExercises.length > 0) {
      addExercisesFromCatalog(selectedExercises);
    }
    router.back();
  };

  const selectedCount = selectedMap.size;

  const renderItem = ({ item }: { item: Exercise }) => {
    const isSelected = selectedMap.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.itemCard, isSelected && styles.itemCardSelected]}
        onPress={() => toggleSelect(item)}
        activeOpacity={0.7}
      >
        <ExerciseThumbnail images={item.images} size={42} />

        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaBadge}>{item.bodyPart.toUpperCase()}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{item.equipment}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.infoBtn}
          onPress={(e) => {
            e.stopPropagation();
            router.push({ pathname: '/exercise-details', params: { id: item.id } });
          }}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <Ionicons name="information-circle-outline" size={22} color="#818CF8" />
        </TouchableOpacity>

        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected ? (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Select Exercises</Text>

        <TouchableOpacity
          style={[styles.confirmHeaderBtn, selectedCount === 0 && styles.confirmHeaderBtnDisabled]}
          onPress={handleConfirmAdd}
          disabled={selectedCount === 0}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.confirmHeaderText,
              selectedCount === 0 && styles.confirmHeaderTextDisabled,
            ]}
          >
            Add ({selectedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
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
        </View>
      </View>

      {/* Exercise List */}
      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading exercises...</Text>
        </View>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No exercises found matching "{search}"</Text>
            </View>
          }
        />
      )}

      {/* Floating Bottom Bar when items are selected */}
      {selectedCount > 0 ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.bottomBtn}
            onPress={handleConfirmAdd}
            activeOpacity={0.85}
          >
            <Text style={styles.bottomBtnText}>
              Add {selectedCount} {selectedCount === 1 ? 'Exercise' : 'Exercises'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  confirmHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  confirmHeaderBtnDisabled: {
    backgroundColor: 'transparent',
  },
  confirmHeaderText: {
    color: '#818CF8',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmHeaderTextDisabled: {
    color: '#475569',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 90,
    gap: 8,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
  },
  itemCardSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaBadge: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '700',
  },
  metaDot: {
    color: '#475569',
    fontSize: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'capitalize',
  },
  infoBtn: {
    padding: 6,
    marginRight: 6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
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
  emptyBox: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  bottomBtn: {
    backgroundColor: '#6366F1',
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  bottomBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
