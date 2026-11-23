import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface RestTimerModalProps {
  visible: boolean;
  currentSeconds: number | null;
  onSelect: (seconds: number | null) => void;
  onClose: () => void;
}

const TIMER_PRESETS: Array<{ label: string; value: number | null }> = [
  { label: 'Off', value: null },
  { label: '30 seconds', value: 30 },
  { label: '45 seconds', value: 45 },
  { label: '1 minute (60s)', value: 60 },
  { label: '1m 30s (90s)', value: 90 },
  { label: '2 minutes (120s)', value: 120 },
  { label: '2m 30s (150s)', value: 150 },
  { label: '3 minutes (180s)', value: 180 },
  { label: '4 minutes (240s)', value: 240 },
  { label: '5 minutes (300s)', value: 300 },
];

export const RestTimerModal: React.FC<RestTimerModalProps> = ({
  visible,
  currentSeconds,
  onSelect,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <SafeAreaView style={styles.sheetContainer}>
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>

              <View style={styles.headerRow}>
                <Ionicons name="timer-outline" size={20} color="#818CF8" style={{ marginRight: 8 }} />
                <Text style={styles.sheetTitle}>Exercise Rest Timer</Text>
              </View>

              <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                {TIMER_PRESETS.map((preset) => {
                  const isSelected = (currentSeconds ?? null) === preset.value;
                  return (
                    <TouchableOpacity
                      key={String(preset.value)}
                      style={[styles.presetRow, isSelected && styles.presetRowSelected]}
                      onPress={() => {
                        onSelect(preset.value);
                        onClose();
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.presetText, isSelected && styles.presetTextSelected]}>
                        {preset.label}
                      </Text>
                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={20} color="#6366F1" />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.cancelText}>Done</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#222222',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: '65%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  optionsList: {
    marginBottom: 10,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  presetRowSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  presetText: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '500',
  },
  presetTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cancelBtn: {
    marginTop: 6,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#1E2433',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
