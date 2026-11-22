import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRoutines, useDuplicateRoutine } from '@/hooks/useRoutines';
import { useRoutineDraft } from '@/context/RoutineDraftContext';
import { RoutineSummary } from '@/api/routines.api';

export default function WorkoutScreen() {
  const router = useRouter();
  const { resetDraft } = useRoutineDraft();
  const [search, setSearch] = useState('');
  const { data: routines, isLoading, isError, refetch, isRefetching } = useRoutines();
  const duplicateRoutineMutation = useDuplicateRoutine();

  // Client-side filtering across routine title, description, and exercise names
  const filteredRoutines = useMemo(() => {
    if (!routines) return [];
    if (!search.trim()) return routines;

    const query = search.trim().toLowerCase();
    return routines.filter((r) => {
      const matchTitle = r.title.toLowerCase().includes(query);
      const matchDesc = r.description ? r.description.toLowerCase().includes(query) : false;
      const matchExercise = r.exerciseNames
        ? r.exerciseNames.some((name) => name.toLowerCase().includes(query))
        : false;
      return matchTitle || matchDesc || matchExercise;
    });
  }, [routines, search]);

  const handleNewRoutine = () => {
    resetDraft();
    router.push('/new-routine');
  };

  const handleDuplicate = async (id: string, title: string) => {
    try {
      await duplicateRoutineMutation.mutateAsync(id);
    } catch (err: any) {
      Alert.alert('Error', `Failed to duplicate ${title}`);
    }
  };

  const renderRoutineCard = ({ item }: { item: RoutineSummary }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/new-routine', params: { id: item.id } })}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.actionIconBtn}
          onPress={(e) => {
            e.stopPropagation();
            handleDuplicate(item.id, item.title);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="copy-outline" size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Meta indicators */}
      <View style={styles.metaRow}>
        <View style={styles.metaBadge}>
          <Ionicons name="barbell-outline" size={13} color="#818CF8" style={{ marginRight: 4 }} />
          <Text style={styles.metaBadgeText}>{item.exerciseCount} exercises</Text>
        </View>
        <View style={styles.metaBadge}>
          <Ionicons name="repeat-outline" size={13} color="#818CF8" style={{ marginRight: 4 }} />
          <Text style={styles.metaBadgeText}>{item.totalSetsCount} sets</Text>
        </View>
      </View>

      {/* Exercise preview pills */}
      {item.exerciseNames && item.exerciseNames.length > 0 && (
        <View style={styles.exerciseChipsRow}>
          {item.exerciseNames.slice(0, 3).map((name, idx) => (
            <View key={idx} style={styles.exerciseChip}>
              <Text style={styles.exerciseChipText} numberOfLines={1}>
                {name}
              </Text>
            </View>
          ))}
          {item.exerciseNames.length > 3 ? (
            <View style={styles.exerciseChipMore}>
              <Text style={styles.exerciseChipMoreText}>
                +{item.exerciseNames.length - 3} more
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Start Button */}
      <TouchableOpacity
        style={styles.startBtn}
        onPress={(e) => {
          e.stopPropagation();
          // Action for live workout with this routine
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="play" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={styles.startBtnText}>Start Routine</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* 1. Search Bar at Top */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#64748B" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search routines..."
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

      {/* 2. New Routine Button Below Search Bar */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.newRoutineButton}
          onPress={handleNewRoutine}
          activeOpacity={0.85}
        >
          <View style={styles.newRoutineContent}>
            <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.newRoutineText}>New Routine</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 3. List of User's Routines */}
      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading routines...</Text>
        </View>
      ) : isError ? (
        <View style={styles.centerBox}>
          <Ionicons name="alert-circle-outline" size={36} color="#F87171" style={{ marginBottom: 12 }} />
          <Text style={styles.errorText}>Could not load routines</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()} activeOpacity={0.8}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredRoutines}
          keyExtractor={(item) => item.id}
          renderItem={renderRoutineCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch();
              }}
              tintColor="#6366F1"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons
                name={search ? 'search-outline' : 'barbell-outline'}
                size={36}
                color="#475569"
                style={{ marginBottom: 12 }}
              />
              <Text style={styles.emptyTitle}>
                {search ? 'No matching routines' : 'No routines yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {search
                  ? `No routines found matching "${search}"`
                  : 'Tap "New Routine" above to create your first workout routine.'}
              </Text>
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
    backgroundColor: '#07090E',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  buttonSection: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  newRoutineButton: {
    backgroundColor: '#6366F1',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  newRoutineContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newRoutineText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaBadgeText: {
    fontSize: 11,
    color: '#A5B4FC',
    fontWeight: '600',
  },
  exerciseChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  exerciseChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '48%',
  },
  exerciseChipText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  exerciseChipMore: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  exerciseChipMoreText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    height: 40,
    borderRadius: 12,
    marginTop: 2,
  },
  startBtnText: {
    color: '#A5B4FC',
    fontSize: 13,
    fontWeight: '700',
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
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
