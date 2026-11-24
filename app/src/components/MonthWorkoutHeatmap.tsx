import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutDetail } from '@/api/workouts.api';

interface MonthWorkoutHeatmapProps {
  workouts: WorkoutDetail[];
}

export function MonthWorkoutHeatmap({ workouts }: MonthWorkoutHeatmapProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Format month and year label
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Map of YYYY-MM-DD -> WorkoutDetail[]
  const workoutsByDate = useMemo(() => {
    const map = new Map<string, WorkoutDetail[]>();
    for (const w of workouts) {
      if (!w.startedAt) continue;
      const d = new Date(w.startedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(w);
    }
    return map;
  }, [workouts]);

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDayKey(null);
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDayKey(null);
  };

  // Calendar matrix calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday start: 0=Mon, 1=Tue ... 6=Sun
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;

  // Active workout days count in this displayed month
  const activeDaysInMonth = useMemo(() => {
    let count = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (workoutsByDate.has(key)) {
        count++;
      }
    }
    return count;
  }, [daysInMonth, month, year, workoutsByDate]);

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
  }, []);

  const weekDayHeaders = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Chunk cells into strict 7-day rows to prevent flex-wrap rounding discrepancies
  const weeks = useMemo(() => {
    const cells: Array<{ dayNumber: number | null; key: string | null }> = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ dayNumber: null, key: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dayNumber: d, key });
    }
    // Pad trailing cells to complete the 7-day week
    while (cells.length % 7 !== 0) {
      cells.push({ dayNumber: null, key: null });
    }

    const rows: Array<Array<{ dayNumber: number | null; key: string | null }>> = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  }, [firstDayOfWeek, daysInMonth, year, month]);

  const selectedWorkouts = selectedDayKey ? workoutsByDate.get(selectedDayKey) || [] : [];

  return (
    <View style={styles.container}>
      {/* Month Navigation Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.monthTitle}>
            {monthName} {year}
          </Text>
          <Text style={styles.monthSubtitle}>
            {activeDaysInMonth} active {activeDaysInMonth === 1 ? 'day' : 'days'} this month
          </Text>
        </View>

        <View style={styles.navControls}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={handlePrevMonth}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={handleNextMonth}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekday Labels (M T W T F S S) */}
      <View style={styles.weekdayRow}>
        {weekDayHeaders.map((day, idx) => (
          <View key={idx} style={styles.weekdayCol}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Structured 7-Day Rows Calendar */}
      <View style={styles.calendarBody}>
        {weeks.map((week, weekIdx) => (
          <View key={`week-${weekIdx}`} style={styles.weekRow}>
            {week.map((cell, dayIdx) => {
              if (!cell.dayNumber || !cell.key) {
                return <View key={`empty-${dayIdx}`} style={styles.dayColEmpty} />;
              }

              const hasWorkout = workoutsByDate.has(cell.key);
              const workoutCount = workoutsByDate.get(cell.key)?.length || 0;
              const isToday = cell.key === todayStr;
              const isSelected = cell.key === selectedDayKey;

              return (
                <View key={cell.key} style={styles.dayCol}>
                  <TouchableOpacity
                    style={[
                      styles.dayCell,
                      hasWorkout && styles.dayCellActive,
                      workoutCount > 1 && styles.dayCellMulti,
                      isToday && styles.dayCellToday,
                      isSelected && styles.dayCellSelected,
                    ]}
                    onPress={() => setSelectedDayKey(cell.key === selectedDayKey ? null : cell.key)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayNumberText,
                        hasWorkout && styles.dayNumberActiveText,
                        isToday && styles.dayNumberTodayText,
                      ]}
                    >
                      {cell.dayNumber}
                    </Text>
                    {hasWorkout && <View style={styles.activeDot} />}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#6366F1' }]} />
          <Text style={styles.legendLabel}>Workout</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#1A1A1A' }]} />
          <Text style={styles.legendLabel}>Rest</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { borderColor: '#FACC15', borderWidth: 1 }]} />
          <Text style={styles.legendLabel}>Today</Text>
        </View>
      </View>

      {/* Day Workout Popover Details */}
      {Boolean(selectedDayKey) && (
        <View style={styles.selectedDayBox}>
          <View style={styles.selectedDayHeader}>
            <Text style={styles.selectedDayTitle}>
              {new Date(selectedDayKey! + 'T00:00:00').toLocaleDateString([], {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <Text style={styles.selectedDayCount}>
              {selectedWorkouts.length} {selectedWorkouts.length === 1 ? 'workout' : 'workouts'}
            </Text>
          </View>

          {selectedWorkouts.length === 0 ? (
            <Text style={styles.noWorkoutDayText}>No workout recorded on this day.</Text>
          ) : (
            selectedWorkouts.map((w) => (
              <View key={w.id} style={styles.dayWorkoutItem}>
                <View style={styles.dayWorkoutLeft}>
                  <Text style={styles.dayWorkoutName}>{w.title}</Text>
                  <Text style={styles.dayWorkoutSub}>
                    {Math.floor((w.durationSeconds || 0) / 60)} min •{' '}
                    {w.totalVolumeKg ? `${Math.round(Number(w.totalVolumeKg))} kg` : '0 kg'} •{' '}
                    {w.totalSetsCompleted || 0} sets
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              </View>
            ))
          )}
        </View>
      )}
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
  monthTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  monthSubtitle: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 2,
  },
  navControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2E2E2E',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekdayCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarBody: {
    gap: 8,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayColEmpty: {
    flex: 1,
    height: 38,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#262626',
  },
  dayCellActive: {
    backgroundColor: '#4338CA',
    borderColor: '#6366F1',
  },
  dayCellMulti: {
    backgroundColor: '#6366F1',
    borderColor: '#818CF8',
  },
  dayCellToday: {
    borderColor: '#FACC15',
    borderWidth: 1.5,
  },
  dayCellSelected: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
  dayNumberText: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '600',
  },
  dayNumberActiveText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayNumberTodayText: {
    color: '#FFFFFF',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#A5B4FC',
    position: 'absolute',
    bottom: 3,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendLabel: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '500',
  },
  selectedDayBox: {
    marginTop: 14,
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#262626',
  },
  selectedDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  selectedDayTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  selectedDayCount: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '600',
  },
  noWorkoutDayText: {
    color: '#71717A',
    fontSize: 12,
    fontStyle: 'italic',
  },
  dayWorkoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  dayWorkoutLeft: {
    flex: 1,
  },
  dayWorkoutName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  dayWorkoutSub: {
    color: '#71717A',
    fontSize: 11,
    marginTop: 2,
  },
});
