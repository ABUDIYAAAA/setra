import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getExerciseImageUrl } from '@/config/constants';

interface ExerciseThumbnailProps {
  images?: any;
  size?: number;
}

export const ExerciseThumbnail: React.FC<ExerciseThumbnailProps> = ({ images, size = 42 }) => {
  const imageUrl = getExerciseImageUrl(images);
  const [hasError, setHasError] = useState(false);

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {imageUrl && !hasError ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }}
          resizeMode="cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <Ionicons name="barbell-outline" size={Math.round(size * 0.45)} color="#818CF8" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
