import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { apiRequest, queryClient } from "@/lib/query-client";

type RouteType = RouteProp<RootStackParamList, "Review">;

export default function ReviewScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const { providerId, providerName } = route.params;
  const { user } = useAuth();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const submitMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/reviews", {
        providerId,
        clientId: user?.id,
        rating,
        comment: comment.trim() || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/providers", providerId] });
      Alert.alert("Sucesso", "Avaliacao enviada com sucesso!");
      navigation.goBack();
    },
    onError: (error: any) => {
      Alert.alert("Erro", error.message || "Falha ao enviar avaliacao");
    },
  });

  const handleSubmit = () => {
    submitMutation.mutate();
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={styles.header}>
          <ThemedText type="h3">Avaliar {providerName}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
            Compartilhe sua experiencia com este prestador
          </ThemedText>
        </View>

        <View style={styles.ratingSection}>
          <ThemedText type="body" style={{ marginBottom: Spacing.md }}>
            Sua avaliacao
          </ThemedText>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star)} style={styles.starButton}>
                <Feather
                  name="star"
                  size={40}
                  color={star <= rating ? theme.star : theme.border}
                  style={{ opacity: star <= rating ? 1 : 0.5 }}
                />
              </Pressable>
            ))}
          </View>
          <ThemedText type="h4" style={{ color: theme.primary, marginTop: Spacing.sm }}>
            {rating === 1
              ? "Ruim"
              : rating === 2
              ? "Regular"
              : rating === 3
              ? "Bom"
              : rating === 4
              ? "Muito Bom"
              : "Excelente"}
          </ThemedText>
        </View>

        <View style={styles.commentSection}>
          <ThemedText type="body" style={{ marginBottom: Spacing.md }}>
            Comentario (opcional)
          </ThemedText>
          <TextInput
            style={[styles.commentInput, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
            placeholder="Conte como foi sua experiencia..."
            placeholderTextColor={theme.textSecondary}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "right", marginTop: Spacing.xs }}>
            {comment.length}/500
          </ThemedText>
        </View>

        <Button onPress={handleSubmit} disabled={submitMutation.isPending} style={styles.submitButton}>
          {submitMutation.isPending ? <ActivityIndicator color="#fff" /> : "Enviar Avaliacao"}
        </Button>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  ratingSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  starsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  starButton: {
    padding: Spacing.xs,
  },
  commentSection: {
    marginBottom: Spacing.xl,
  },
  commentInput: {
    minHeight: 120,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: 16,
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
});
