import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RoutineActionSheetProps {
  visible: boolean;
  onClose: () => void;
  routineTitle: string;
  onStartWorkout?: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export const RoutineActionSheet: React.FC<RoutineActionSheetProps> = ({
  visible,
  onClose,
  routineTitle,
  onStartWorkout,
  onEdit,
  onDuplicate,
  onDelete,
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
              {/* Drag Handle */}
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>

              {/* Title */}
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {routineTitle}
              </Text>

              {/* Action Buttons */}
              <View style={styles.actionsList}>
                {/* 0. Start Workout (if provided) */}
                {onStartWorkout && (
                  <TouchableOpacity
                    style={[styles.actionRow, styles.startActionRow]}
                    onPress={() => {
                      onClose();
                      onStartWorkout();
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                      <Ionicons name="play" size={18} color="#818CF8" />
                    </View>
                    <Text style={[styles.actionText, { color: '#FFFFFF', fontWeight: '700' }]}>
                      Start Workout
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color="#818CF8" />
                  </TouchableOpacity>
                )}

                {/* 1. Edit Routine */}
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => {
                    onClose();
                    onEdit();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconCircle}>
                    <Ionicons name="create-outline" size={20} color="#818CF8" />
                  </View>
                  <Text style={styles.actionText}>Edit Routine</Text>
                  <Ionicons name="chevron-forward" size={18} color="#475569" />
                </TouchableOpacity>

                {/* 2. Duplicate Routine */}
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => {
                    onClose();
                    onDuplicate();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconCircle}>
                    <Ionicons name="copy-outline" size={20} color="#818CF8" />
                  </View>
                  <Text style={styles.actionText}>Duplicate Routine</Text>
                  <Ionicons name="chevron-forward" size={18} color="#475569" />
                </TouchableOpacity>

                {/* 3. Delete Routine */}
                <TouchableOpacity
                  style={[styles.actionRow, styles.deleteRow]}
                  onPress={() => {
                    onClose();
                    onDelete();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconCircle, styles.deleteIconCircle]}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </View>
                  <Text style={[styles.actionText, styles.deleteText]}>Delete Routine</Text>
                  <Ionicons name="chevron-forward" size={18} color="#7F1D1D" />
                </TouchableOpacity>
              </View>

              {/* Cancel Button */}
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.cancelText}>Cancel</Text>
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
    backgroundColor: '#0F131D',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
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
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  actionsList: {
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  startActionRow: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  deleteRow: {
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  deleteIconCircle: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  deleteText: {
    color: '#EF4444',
  },
  cancelBtn: {
    marginTop: 14,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '700',
  },
});
