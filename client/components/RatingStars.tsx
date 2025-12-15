import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface RatingStarsProps {
  rating: number;
  size?: number;
  showValue?: boolean;
}

export function RatingStars({ rating, size = 14, showValue = false }: RatingStarsProps) {
  const { theme } = useTheme();
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <View style={styles.container}>
      {[...Array(fullStars)].map((_, i) => (
        <Feather key={`full-${i}`} name="star" size={size} color={theme.star} />
      ))}
      {hasHalf && <Feather name="star" size={size} color={theme.star} style={{ opacity: 0.5 }} />}
      {[...Array(emptyStars)].map((_, i) => (
        <Feather key={`empty-${i}`} name="star" size={size} color={theme.border} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
});
