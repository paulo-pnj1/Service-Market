
import React from "react";
import { View, StyleSheet, Pressable, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { RatingStars } from "@/components/RatingStars";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ServiceData } from "@/lib/firestore";

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    gap: Spacing.md,
  },
  cardHorizontal: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  categoriesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    justifyContent: "center",
    marginTop: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  avatar: {
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
  services?: ServiceData[];
  onPress?: () => void;
  style?: ViewStyle;
  horizontal?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ProviderCard({ provider, services = [], onPress, style, horizontal = false }: ProviderCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const categories = Array.isArray(provider.categories)
    ? provider.categories.map((cat) => (typeof cat === "string" ? { name: cat } : cat))
    : [];

  const getName = () => provider.user?.name || "Nome não disponível";

  const renderServices = () => {
    if (!services.length) return null;
    return (
      <View style={{ marginTop: Spacing.sm }}>
        <ThemedText type="small" style={{ marginBottom: Spacing.xs }}>
          Serviços:
        </ThemedText>
        {services.map((service) => (
          <ThemedText
            key={service.id}
            type="small"
            style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}
          >
            - {service.name} - AOA {service.price ?? "N/D"}
          </ThemedText>
        ))}
      </View>
    );
  };

  if (horizontal) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.cardHorizontal,
          { backgroundColor: theme.backgroundSecondary },
          animatedStyle,
          style,
        ]}
      >
        <View
          style={[
            styles.avatar,
            styles.avatarHorizontal,
            { backgroundColor: theme.backgroundTertiary },
          ]}
        >
          <Feather name="user" size={24} color={theme.textSecondary} />
          {provider.isVerified && (
            <View style={[styles.verifiedBadge, { backgroundColor: theme.success }]}>
              <Feather name="check" size={12} color="#fff" />
            </View>
          )}
        </View>
        <View style={styles.content}>
          <ThemedText type="body" style={styles.name} numberOfLines={1}>
            {getName()}
          </ThemedText>
          <View style={styles.ratingRow}>
            <RatingStars rating={Number(provider.averageRating) || 0} size={12} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              ({provider.totalRatings || 0})
            </ThemedText>
          </View>
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={12} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {provider.city}
            </ThemedText>
          </View>
          {renderServices()}
        </View>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        { backgroundColor: theme.backgroundSecondary },
        animatedStyle,
        style,
      ]}
    >
      <View
        style={[
          styles.avatar,
          { backgroundColor: theme.backgroundTertiary },
        ]}
      >
        <Feather name="user" size={32} color={theme.textSecondary} />
        {provider.isVerified && (
          <View style={[styles.verifiedBadge, { backgroundColor: theme.success }]}>
            <Feather name="check" size={12} color="#fff" />
          </View>
        )}
      </View>
      <View style={styles.content}>
        <ThemedText type="h4" style={styles.name} numberOfLines={1}>
          {getName()}
        </ThemedText>
        <View style={styles.ratingRow}>
          <RatingStars rating={Number(provider.averageRating) || 0} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            ({provider.totalRatings || 0})
          </ThemedText>
        </View>
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={14} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {provider.city}
          </ThemedText>
        </View>
        <View style={styles.categoriesRow}>
          {categories.map((cat, index) => (
            <View
              key={index}
              style={[
                styles.chip,
                {
                  backgroundColor: theme.backgroundTertiary,
                  borderColor: theme.border,
                },
              ]}
            >
              <ThemedText type="small" style={{ color: theme.text }}>
                {cat.name}
              </ThemedText>
            </View>
          ))}
        </View>
        {renderServices()}
      </View>
    </AnimatedPressable>
  );
}
