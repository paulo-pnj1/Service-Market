import React from "react";
import { View, StyleSheet, Pressable, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { RatingStars } from "@/components/RatingStars";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface ProviderCardProps {
  provider: {
    id: string;
    user?: { name: string } | null;
    city: string;
    hourlyRate?: string | number;
    averageRating?: string | number;
    totalRatings?: number;
    isVerified?: boolean;
    categories?: { name: string }[] | string[];
  };
  onPress?: () => void;
  style?: ViewStyle;
  horizontal?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ProviderCard({ provider, onPress, style, horizontal }: ProviderCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const rating = typeof provider.averageRating === "number" 
    ? provider.averageRating 
    : parseFloat(provider.averageRating || "0");
  const price = typeof provider.hourlyRate === "number"
    ? provider.hourlyRate
    : parseFloat(provider.hourlyRate || "0");

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        horizontal && styles.cardHorizontal,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
        style,
      ]}
    >
      <View style={[styles.avatarContainer, horizontal && styles.avatarHorizontal, { backgroundColor: theme.primary }]}>
        <ThemedText type="h3" style={{ color: "#fff" }}>
          {provider.user?.name?.charAt(0)?.toUpperCase() || "P"}
        </ThemedText>
        {provider.isVerified && (
          <View style={[styles.verifiedBadge, { backgroundColor: theme.success }]}>
            <Feather name="check" size={10} color="#fff" />
          </View>
        )}
      </View>
      <View style={styles.content}>
        <ThemedText type="body" numberOfLines={1} style={styles.name}>
          {provider.user?.name || "Prestador"}
        </ThemedText>
        <View style={styles.ratingRow}>
          <RatingStars rating={rating} size={12} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            ({provider.totalRatings || 0})
          </ThemedText>
        </View>
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={12} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }} numberOfLines={1}>
            {provider.city}
          </ThemedText>
        </View>
        <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>
          AOA {price.toLocaleString()}/h
        </ThemedText>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
  },
  cardHorizontal: {
    width: 160,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
    position: "relative",
  },
  avatarHorizontal: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  content: {
    alignItems: "center",
    width: "100%",
  },
  name: {
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
});
