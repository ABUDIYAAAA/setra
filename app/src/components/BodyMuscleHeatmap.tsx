import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

export interface MuscleScores {
  [muscleKey: string]: number;
}

interface BodyMuscleHeatmapProps {
  muscleScores?: MuscleScores;
}

// Maps various database muscle names to our canonical groups
function normalizeMuscleScores(scores: MuscleScores = {}): Record<string, number> {
  const norm: Record<string, number> = {
    chest: 0,
    shoulders: 0,
    rear_delts: 0,
    biceps: 0,
    triceps: 0,
    forearms: 0,
    abs: 0,
    lats: 0,
    traps: 0,
    lower_back: 0,
    glutes: 0,
    quads: 0,
    hamstrings: 0,
    calves: 0,
  };

  for (const [key, val] of Object.entries(scores)) {
    const k = key.toLowerCase();
    const count = Number(val) || 0;

    if (k.includes('pectoral') || k.includes('chest')) {
      norm.chest += count;
    } else if (k.includes('posterior_deltoid') || k.includes('rear_delt')) {
      norm.rear_delts += count;
    } else if (k.includes('deltoid') || k.includes('shoulder')) {
      norm.shoulders += count;
    } else if (k.includes('biceps')) {
      norm.biceps += count;
    } else if (k.includes('triceps')) {
      norm.triceps += count;
    } else if (k.includes('forearm')) {
      norm.forearms += count;
    } else if (k.includes('abdom') || k.includes('core') || k.includes('oblique')) {
      norm.abs += count;
    } else if (k.includes('latissimus') || k.includes('lats')) {
      norm.lats += count;
    } else if (k.includes('trapezius') || k.includes('traps') || k.includes('upper_back')) {
      norm.traps += count;
    } else if (k.includes('erector') || k.includes('lower_back')) {
      norm.lower_back += count;
    } else if (k.includes('glute')) {
      norm.glutes += count;
    } else if (k.includes('quad')) {
      norm.quads += count;
    } else if (k.includes('hamstring')) {
      norm.hamstrings += count;
    } else if (k.includes('calv') || k.includes('gastrocnemius') || k.includes('soleus')) {
      norm.calves += count;
    }
  }

  return norm;
}

// Compute color along heat spectrum based on score relative to max
function getHeatColor(score: number, maxScore: number): string {
  if (!score || score <= 0) return '#1A1A1A'; // Inactive neutral dark
  const ratio = Math.min(score / Math.max(maxScore, 1), 1);
  if (ratio <= 0.25) return '#4338CA'; // Low: Deep Indigo
  if (ratio <= 0.5) return '#6366F1';  // Medium: Indigo
  if (ratio <= 0.75) return '#F59E0B'; // High: Amber
  return '#EF4444';                   // Max: Hot Crimson
}

export function BodyMuscleHeatmap({ muscleScores = {} }: BodyMuscleHeatmapProps) {
  const [viewMode, setViewMode] = useState<'front' | 'back'>('front');

  const normalized = normalizeMuscleScores(muscleScores);
  const maxScore = Math.max(...Object.values(normalized), 1);

  // Group labels for breakdown list
  const muscleLabels: Record<string, string> = {
    chest: 'Chest',
    shoulders: 'Shoulders',
    rear_delts: 'Rear Delts',
    biceps: 'Biceps',
    triceps: 'Triceps',
    forearms: 'Forearms',
    abs: 'Abs & Core',
    lats: 'Lats',
    traps: 'Traps',
    lower_back: 'Lower Back',
    glutes: 'Glutes',
    quads: 'Quadriceps',
    hamstrings: 'Hamstrings',
    calves: 'Calves',
  };

  const topMuscles = Object.entries(normalized)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <View style={styles.container}>
      {/* Header with Front/Back Switcher */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Muscle Heatmap</Text>
          <Text style={styles.subtitle}>Cumulative muscle volume</Text>
        </View>

        <View style={styles.toggleGroup}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'front' && styles.toggleBtnActive]}
            onPress={() => setViewMode('front')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, viewMode === 'front' && styles.toggleTextActive]}>
              Front
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'back' && styles.toggleBtnActive]}
            onPress={() => setViewMode('back')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, viewMode === 'back' && styles.toggleTextActive]}>
              Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Body Model Diagram & Top Breakdown */}
      <View style={styles.contentRow}>
        {/* SVG Anatomical Model */}
        <View style={styles.svgWrapper}>
          <Svg width={170} height={290} viewBox="0 0 200 340">
            {/* Base Body Silhouette / Joint Guidelines */}
            <G stroke="#262626" strokeWidth={1}>
              {/* Head */}
              <Circle cx={100} cy={28} r={18} fill="#141414" stroke="#2A2A2A" strokeWidth={1.5} />
              {/* Neck */}
              <Rect x={94} y={44} width={12} height={12} fill="#141414" rx={2} />
            </G>

            {viewMode === 'front' ? (
              // FRONT ANTERIOR VIEW
              <G stroke="#000000" strokeWidth={1.5}>
                {/* Traps (Anterior) */}
                <Path
                  d="M 82 52 L 94 46 L 94 56 L 82 58 Z"
                  fill={getHeatColor(normalized.traps, maxScore)}
                />
                <Path
                  d="M 118 52 L 106 46 L 106 56 L 118 58 Z"
                  fill={getHeatColor(normalized.traps, maxScore)}
                />

                {/* Shoulders / Front Delts */}
                <Path
                  d="M 64 56 C 58 64 58 74 66 82 C 72 82 76 74 76 64 C 76 58 70 56 64 56 Z"
                  fill={getHeatColor(normalized.shoulders, maxScore)}
                />
                <Path
                  d="M 136 56 C 142 64 142 74 134 82 C 128 82 124 74 124 64 C 124 58 130 56 136 56 Z"
                  fill={getHeatColor(normalized.shoulders, maxScore)}
                />

                {/* Chest (Left & Right Pectorals) */}
                <Path
                  d="M 76 62 C 84 62 98 64 98 84 C 98 90 84 94 76 90 C 72 84 72 70 76 62 Z"
                  fill={getHeatColor(normalized.chest, maxScore)}
                />
                <Path
                  d="M 124 62 C 116 62 102 64 102 84 C 102 90 116 94 124 90 C 128 84 128 70 124 62 Z"
                  fill={getHeatColor(normalized.chest, maxScore)}
                />

                {/* Biceps */}
                <Path
                  d="M 58 84 C 54 94 54 110 60 120 C 66 120 70 110 70 94 C 70 86 64 84 58 84 Z"
                  fill={getHeatColor(normalized.biceps, maxScore)}
                />
                <Path
                  d="M 142 84 C 146 94 146 110 140 120 C 134 120 130 110 130 94 C 130 86 136 84 142 84 Z"
                  fill={getHeatColor(normalized.biceps, maxScore)}
                />

                {/* Forearms */}
                <Path
                  d="M 52 124 C 46 136 46 156 50 174 C 56 174 62 160 64 140 C 64 128 58 124 52 124 Z"
                  fill={getHeatColor(normalized.forearms, maxScore)}
                />
                <Path
                  d="M 148 124 C 154 136 154 156 150 174 C 144 174 138 160 136 140 C 136 128 142 124 148 124 Z"
                  fill={getHeatColor(normalized.forearms, maxScore)}
                />

                {/* Abs / Rectus Abdominis 6-Pack */}
                <Rect
                  x={88}
                  y={96}
                  width={11}
                  height={15}
                  rx={3}
                  fill={getHeatColor(normalized.abs, maxScore)}
                />
                <Rect
                  x={101}
                  y={96}
                  width={11}
                  height={15}
                  rx={3}
                  fill={getHeatColor(normalized.abs, maxScore)}
                />
                <Rect
                  x={88}
                  y={114}
                  width={11}
                  height={15}
                  rx={3}
                  fill={getHeatColor(normalized.abs, maxScore)}
                />
                <Rect
                  x={101}
                  y={114}
                  width={11}
                  height={15}
                  rx={3}
                  fill={getHeatColor(normalized.abs, maxScore)}
                />
                <Rect
                  x={89}
                  y={132}
                  width={10}
                  height={16}
                  rx={3}
                  fill={getHeatColor(normalized.abs, maxScore)}
                />
                <Rect
                  x={101}
                  y={132}
                  width={10}
                  height={16}
                  rx={3}
                  fill={getHeatColor(normalized.abs, maxScore)}
                />

                {/* Quadriceps (Thighs) */}
                <Path
                  d="M 74 156 C 68 174 68 206 76 226 C 84 226 94 216 96 186 C 96 166 86 156 74 156 Z"
                  fill={getHeatColor(normalized.quads, maxScore)}
                />
                <Path
                  d="M 126 156 C 132 174 132 206 124 226 C 116 226 106 216 104 186 C 104 166 114 156 126 156 Z"
                  fill={getHeatColor(normalized.quads, maxScore)}
                />

                {/* Calves / Shins (Anterior) */}
                <Path
                  d="M 76 238 C 72 250 72 280 78 304 C 84 304 88 288 88 266 C 88 248 84 238 76 238 Z"
                  fill={getHeatColor(normalized.calves, maxScore)}
                />
                <Path
                  d="M 124 238 C 128 250 128 280 122 304 C 116 304 112 288 112 266 C 112 248 116 238 124 238 Z"
                  fill={getHeatColor(normalized.calves, maxScore)}
                />
              </G>
            ) : (
              // BACK POSTERIOR VIEW
              <G stroke="#000000" strokeWidth={1.5}>
                {/* Trapezius / Upper Back */}
                <Path
                  d="M 100 48 L 122 60 L 110 88 L 100 96 L 90 88 L 78 60 Z"
                  fill={getHeatColor(normalized.traps, maxScore)}
                />

                {/* Rear Delts */}
                <Path
                  d="M 64 58 C 58 66 58 76 68 84 C 74 84 76 76 76 66 C 76 60 70 58 64 58 Z"
                  fill={getHeatColor(normalized.rear_delts || normalized.shoulders, maxScore)}
                />
                <Path
                  d="M 136 58 C 142 66 142 76 132 84 C 126 84 124 76 124 66 C 124 60 130 58 136 58 Z"
                  fill={getHeatColor(normalized.rear_delts || normalized.shoulders, maxScore)}
                />

                {/* Triceps */}
                <Path
                  d="M 56 86 C 50 96 50 114 58 124 C 64 124 68 112 68 96 C 68 88 62 86 56 86 Z"
                  fill={getHeatColor(normalized.triceps, maxScore)}
                />
                <Path
                  d="M 144 86 C 150 96 150 114 142 124 C 136 124 132 112 132 96 C 132 88 138 86 144 86 Z"
                  fill={getHeatColor(normalized.triceps, maxScore)}
                />

                {/* Latissimus Dorsi (Lats) */}
                <Path
                  d="M 76 86 C 72 100 72 124 86 140 C 92 134 94 116 94 96 C 88 92 82 88 76 86 Z"
                  fill={getHeatColor(normalized.lats, maxScore)}
                />
                <Path
                  d="M 124 86 C 128 100 128 124 114 140 C 108 134 106 116 106 96 C 112 92 118 88 124 86 Z"
                  fill={getHeatColor(normalized.lats, maxScore)}
                />

                {/* Lower Back / Erector Spinae */}
                <Path
                  d="M 92 120 L 108 120 L 106 152 L 94 152 Z"
                  fill={getHeatColor(normalized.lower_back, maxScore)}
                />

                {/* Gluteus Maximus (Glutes) */}
                <Path
                  d="M 74 156 C 72 176 84 196 98 196 C 98 178 96 162 88 156 Z"
                  fill={getHeatColor(normalized.glutes, maxScore)}
                />
                <Path
                  d="M 126 156 C 128 176 116 196 102 196 C 102 178 104 162 112 156 Z"
                  fill={getHeatColor(normalized.glutes, maxScore)}
                />

                {/* Hamstrings */}
                <Path
                  d="M 74 200 C 70 216 72 234 80 240 C 88 240 94 224 96 206 C 96 200 86 198 74 200 Z"
                  fill={getHeatColor(normalized.hamstrings, maxScore)}
                />
                <Path
                  d="M 126 200 C 130 216 128 234 120 240 C 112 240 106 224 104 206 C 104 200 114 198 126 200 Z"
                  fill={getHeatColor(normalized.hamstrings, maxScore)}
                />

                {/* Calves (Gastrocnemius) */}
                <Path
                  d="M 74 246 C 70 258 70 284 78 304 C 84 304 90 286 90 266 C 90 250 82 244 74 246 Z"
                  fill={getHeatColor(normalized.calves, maxScore)}
                />
                <Path
                  d="M 126 246 C 130 258 130 284 122 304 C 116 304 110 286 110 266 C 110 250 118 244 126 246 Z"
                  fill={getHeatColor(normalized.calves, maxScore)}
                />
              </G>
            )}
          </Svg>

          {/* Heat Scale Legend */}
          <View style={styles.legendRow}>
            <Text style={styles.legendText}>Low</Text>
            <View style={styles.legendGradient}>
              <View style={[styles.legendStep, { backgroundColor: '#4338CA' }]} />
              <View style={[styles.legendStep, { backgroundColor: '#6366F1' }]} />
              <View style={[styles.legendStep, { backgroundColor: '#F59E0B' }]} />
              <View style={[styles.legendStep, { backgroundColor: '#EF4444' }]} />
            </View>
            <Text style={styles.legendText}>Intense</Text>
          </View>
        </View>

        {/* Top Targeted Muscles Breakdown */}
        <View style={styles.breakdownCol}>
          <Text style={styles.breakdownHeading}>Top Targets</Text>
          {topMuscles.length === 0 ? (
            <Text style={styles.emptyMuscleText}>Complete workouts to generate heat map data.</Text>
          ) : (
            topMuscles.map(([key, count]) => {
              const label = muscleLabels[key] || key;
              const color = getHeatColor(count, maxScore);
              const percent = Math.round((count / maxScore) * 100);

              return (
                <View key={key} style={styles.muscleBarItem}>
                  <View style={styles.muscleLabelRow}>
                    <Text style={styles.muscleName}>{label}</Text>
                    <Text style={[styles.muscleScore, { color }]}>{count} sets</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${Math.max(percent, 8)}%`, backgroundColor: color },
                      ]}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#222222',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 2,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1C',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#282828',
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 7,
  },
  toggleBtnActive: {
    backgroundColor: '#6366F1',
  },
  toggleText: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 170,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  legendText: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '600',
  },
  legendGradient: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  legendStep: {
    width: 16,
    height: 6,
  },
  breakdownCol: {
    flex: 1,
    paddingLeft: 16,
    gap: 12,
  },
  breakdownHeading: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  emptyMuscleText: {
    color: '#71717A',
    fontSize: 12,
    lineHeight: 18,
  },
  muscleBarItem: {
    gap: 5,
  },
  muscleLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  muscleName: {
    color: '#E4E4E7',
    fontSize: 12,
    fontWeight: '600',
  },
  muscleScore: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#1E1E1E',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
});
