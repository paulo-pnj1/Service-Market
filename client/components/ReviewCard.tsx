import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { RatingStars } from "@/components/RatingStars";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
    client?: { name: string };
  };
}

export function ReviewCard({ review }: ReviewCardProps) {
  const { theme } = useTheme();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-AO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundSecondary }]}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <ThemedText type="small" style={{ color: "#fff" }}>
            {review.client?.name?.charAt(0)?.toUpperCase() || "?"}
          </ThemedText>
        </View>
        <View style={styles.headerContent}>
          <ThemedText type="body">{review.client?.name}</ThemedText>
          <View style={styles.ratingRow}>
            <RatingStars rating={review.rating} size={12} />
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {formatDate(review.createdAt)}
            </ThemedText>
          </View>
        </View>
      </View>
      {review.comment && (
        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
          {review.comment}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    flex: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
});
