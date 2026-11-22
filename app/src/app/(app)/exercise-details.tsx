import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useExerciseDetail } from '@/hooks/useExercises';
import { getAllExerciseImages, getExerciseImageUrl } from '@/config/constants';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_HEIGHT = Math.round(SCREEN_HEIGHT * 0.30);

type TabType = 'overview' | 'instructions' | 'muscles' | 'tips';

interface TabItem {
  key: TabType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabItem[] = [
  { key: 'overview', label: 'Overview', icon: 'information-circle-outline' },
  { key: 'instructions', label: 'Instructions', icon: 'list-outline' },
  { key: 'muscles', label: 'Muscles', icon: 'body-outline' },
  { key: 'tips', label: 'Tips', icon: 'bulb-outline' },
];

export default function ExerciseDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const { data: exercise, isLoading, isError, refetch } = useExerciseDetail(id || '');

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const images = exercise ? getAllExerciseImages(exercise.images) : [];
  const fallbackSingleUrl = exercise ? getExerciseImageUrl(exercise.images) : null;
  const currentImageUrl = images.length > 0 ? images[selectedImageIndex]?.url : fallbackSingleUrl;

  const renderDifficultyBadge = (difficulty?: string) => {
    if (!difficulty) return null;
    const diff = difficulty.toLowerCase();
    let bg = '#1E293B';
    let text = '#94A3B8';
    if (diff === 'beginner') {
      bg = 'rgba(16, 185, 129, 0.15)';
      text = '#34D399';
    } else if (diff === 'intermediate') {
      bg = 'rgba(245, 158, 11, 0.15)';
      text = '#FBBF24';
    } else if (diff === 'expert' || diff === 'advanced') {
      bg = 'rgba(239, 68, 68, 0.15)';
      text = '#F87171';
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color: text }]}>{difficulty.toUpperCase()}</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerBox]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading exercise details...</Text>
      </View>
    );
  }

  if (isError || !exercise) {
    return (
      <View style={[styles.container, styles.centerBox]}>
        <StatusBar barStyle="light-content" />
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Exercise not found</Text>
        <Text style={styles.errorSubtitle}>Could not load details for ID "{id}"</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} activeOpacity={0.8}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Image Section (30% screen height) */}
      <View style={[styles.imageContainer, { height: IMAGE_HEIGHT }]}>
        {currentImageUrl ? (
          <Image
            source={{ uri: currentImageUrl }}
            style={styles.heroImage}
            contentFit="contain"
            transition={200}
          />
        ) : (
          <View style={styles.noImagePlaceholder}>
            <Ionicons name="barbell-outline" size={64} color="#334155" />
            <Text style={styles.noImageText}>No image preview</Text>
          </View>
        )}

        {/* Floating Back Button */}
        <TouchableOpacity
          style={[styles.floatingBackBtn, { top: Math.max(insets.top + 8, 20) }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Multi-Image Switcher (e.g. Start vs Peak contraction) */}
        {images.length > 1 && (
          <View style={styles.imageSwitcherRow}>
            {images.map((img, idx) => {
              const isSelected = idx === selectedImageIndex;
              return (
                <TouchableOpacity
                  key={img.key}
                  style={[styles.imagePill, isSelected && styles.imagePillActive]}
                  onPress={() => setSelectedImageIndex(idx)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.imagePillText, isSelected && styles.imagePillTextActive]}>
                    {img.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Header Info Banner */}
      <View style={styles.headerInfoBanner}>
        <Text style={styles.exerciseTitle}>{exercise.name}</Text>
        <View style={styles.tagsRow}>
          <View style={[styles.badge, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
            <Text style={[styles.badgeText, { color: '#818CF8' }]}>
              {exercise.bodyPart.toUpperCase()}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#1E293B' }]}>
            <Text style={[styles.badgeText, { color: '#CBD5E1' }]}>{exercise.equipment}</Text>
          </View>
          {renderDifficultyBadge(exercise.difficulty)}
        </View>
      </View>

      {/* Tabbed Menu */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={isActive ? '#818CF8' : '#64748B'}
                style={{ marginBottom: 3 }}
              />
              <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Structured Tab Content */}
      <ScrollView
        style={styles.contentScrollView}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            {/* Description */}
            {exercise.description ? (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="document-text-outline" size={17} color="#818CF8" />
                  <Text style={styles.sectionTitle}>Description</Text>
                </View>
                <Text style={styles.descriptionText}>{exercise.description}</Text>
              </View>
            ) : null}

            {/* Structured Specifications Grid */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="options-outline" size={17} color="#818CF8" />
                <Text style={styles.sectionTitle}>Specifications</Text>
              </View>
              <View style={styles.specGrid}>
                <View style={styles.specCell}>
                  <Text style={styles.specLabel}>Category</Text>
                  <Text style={styles.specValue}>{exercise.category || 'Strength'}</Text>
                </View>
                <View style={styles.specCell}>
                  <Text style={styles.specLabel}>Mechanic</Text>
                  <Text style={styles.specValue}>{exercise.mechanic || 'Compound'}</Text>
                </View>
                <View style={styles.specCell}>
                  <Text style={styles.specLabel}>Force Type</Text>
                  <Text style={styles.specValue}>{exercise.forceType || 'Dynamic'}</Text>
                </View>
                <View style={styles.specCell}>
                  <Text style={styles.specLabel}>Equipment</Text>
                  <Text style={styles.specValue}>{exercise.equipment}</Text>
                </View>
                <View style={styles.specCell}>
                  <Text style={styles.specLabel}>Unilateral</Text>
                  <Text style={styles.specValue}>{exercise.isUnilateral ? 'Yes (Single Side)' : 'No (Bilateral)'}</Text>
                </View>
                <View style={styles.specCell}>
                  <Text style={styles.specLabel}>Weight Type</Text>
                  <Text style={styles.specValue}>{exercise.isBodyweight ? 'Bodyweight' : 'Weighted / External'}</Text>
                </View>
              </View>
            </View>

            {/* Tags */}
            {exercise.tags && exercise.tags.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="pricetags-outline" size={17} color="#818CF8" />
                  <Text style={styles.sectionTitle}>Tags & Goals</Text>
                </View>
                <View style={styles.chipsWrap}>
                  {exercise.tags.map((tag) => (
                    <View key={tag} style={styles.tagChip}>
                      <Text style={styles.tagChipText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* INSTRUCTIONS TAB */}
        {activeTab === 'instructions' && (
          <View style={styles.tabContent}>
            {exercise.instructions && exercise.instructions.length > 0 ? (
              exercise.instructions.map((step, index) => (
                <View key={index} style={styles.stepCard}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.stepTextContainer}>
                    <Text style={styles.stepInstructionText}>{step}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="document-text-outline" size={32} color="#64748B" />
                <Text style={styles.emptyTitle}>No instructions available</Text>
                <Text style={styles.emptySubtitle}>Detailed execution steps for this exercise haven't been added yet.</Text>
              </View>
            )}
          </View>
        )}

        {/* MUSCLES TAB */}
        {activeTab === 'muscles' && (
          <View style={styles.tabContent}>
            {/* Primary Target Muscles */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="flame-outline" size={18} color="#EF4444" />
                <Text style={styles.sectionTitle}>Primary Target Muscles</Text>
              </View>
              {exercise.primaryMuscles && exercise.primaryMuscles.length > 0 ? (
                <View style={styles.chipsWrap}>
                  {exercise.primaryMuscles.map((muscle) => (
                    <View key={muscle} style={[styles.muscleChip, styles.primaryMuscleChip]}>
                      <Ionicons name="ellipse" size={8} color="#EF4444" style={{ marginRight: 6 }} />
                      <Text style={styles.primaryMuscleText}>{muscle.replace(/_/g, ' ').toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyTextSubtle}>No primary muscles specified</Text>
              )}
            </View>

            {/* Secondary Muscles */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#818CF8" />
                <Text style={styles.sectionTitle}>Secondary & Stabilizer Muscles</Text>
              </View>
              {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 ? (
                <View style={styles.chipsWrap}>
                  {exercise.secondaryMuscles.map((muscle) => (
                    <View key={muscle} style={[styles.muscleChip, styles.secondaryMuscleChip]}>
                      <Ionicons name="ellipse-outline" size={8} color="#94A3B8" style={{ marginRight: 6 }} />
                      <Text style={styles.secondaryMuscleText}>{muscle.replace(/_/g, ' ').toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyTextSubtle}>No secondary muscles specified</Text>
              )}
            </View>

            {/* Body part overview */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="body-outline" size={18} color="#34D399" />
                <Text style={styles.sectionTitle}>Main Anatomy Region</Text>
              </View>
              <Text style={styles.anatomySummaryText}>
                Primary body region:{' '}
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
                  {exercise.bodyPart.replace(/_/g, ' ').toUpperCase()}
                </Text>
              </Text>
            </View>
          </View>
        )}

        {/* TIPS TAB */}
        {activeTab === 'tips' && (
          <View style={styles.tabContent}>
            {exercise.tips && exercise.tips.length > 0 ? (
              exercise.tips.map((tip, index) => (
                <View key={index} style={styles.tipCard}>
                  <View style={styles.tipIconBox}>
                    <Ionicons name="bulb-outline" size={20} color="#FBBF24" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="bulb-outline" size={32} color="#64748B" />
                <Text style={styles.emptyTitle}>No coaching tips yet</Text>
                <Text style={styles.emptySubtitle}>General best practice: maintain strict form and full range of motion.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  centerBox: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
  },
  errorTitle: {
    color: '#F87171',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  errorSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  backLink: {
    marginTop: 12,
    padding: 8,
  },
  backLinkText: {
    color: '#818CF8',
    fontSize: 14,
  },
  imageContainer: {
    width: '100%',
    backgroundColor: '#0D111A',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    color: '#475569',
    fontSize: 12,
    marginTop: 8,
  },
  floatingBackBtn: {
    position: 'absolute',
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 10,
  },
  imageSwitcherRow: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  imagePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imagePillActive: {
    backgroundColor: '#6366F1',
  },
  imagePillText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  imagePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerInfoBanner: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#161F30',
  },
  exerciseTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0B0F17',
    borderBottomWidth: 1,
    borderBottomColor: '#161F30',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  tabButtonActive: {},
  tabButtonText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#818CF8',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2.5,
    left: '20%',
    right: '20%',
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
  contentScrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  tabContent: {
    gap: 14,
  },
  sectionCard: {
    backgroundColor: '#0F1522',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '700',
  },
  descriptionText: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 22,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  specCell: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  specLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  specValue: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tagChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  stepCard: {
    backgroundColor: '#0F1522',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 12,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  stepTextContainer: {
    flex: 1,
  },
  stepInstructionText: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 21,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F1522',
    borderRadius: 12,
    padding: 32,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  emptyTitle: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 10,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  muscleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  primaryMuscleChip: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  primaryMuscleText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryMuscleChip: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryMuscleText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyTextSubtle: {
    color: '#64748B',
    fontSize: 13,
    fontStyle: 'italic',
  },
  anatomySummaryText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  tipCard: {
    backgroundColor: '#0F1522',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    gap: 12,
  },
  tipIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 21,
  },
});
