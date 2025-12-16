import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { categoriesService } from "@/lib/query-client";

type RouteType = RouteProp<RootStackParamList, "Filter">;

export default function FilterScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteType>();

  const [selectedCategory, setSelectedCategory] = useState(route.params?.categoryId || "");
  const [city, setCity] = useState(route.params?.city || "");
  const [minRating, setMinRating] = useState(route.params?.minRating || 0);
  const [maxPrice, setMaxPrice] = useState(route.params?.maxPrice?.toString() || "");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesService.getAll(),
  });

  const handleApply = () => {
    navigation.goBack();
  };

  const handleClear = () => {
    setSelectedCategory("");
    setCity("");
    setMinRating(0);
    setMaxPrice("");
  };

  const ratingOptions = [0, 3, 3.5, 4, 4.5];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Categoria
          </ThemedText>
          <View style={styles.categoriesGrid}>
            {categories.map((cat: any) => (
              <Pressable
                key={cat.id}
                style={[
                  styles.categoryChip,
                  { borderColor: selectedCategory === cat.id ? theme.primary : theme.border },
                  selectedCategory === cat.id && { backgroundColor: theme.primary + "20" },
                ]}
                onPress={() => setSelectedCategory(selectedCategory === cat.id ? "" : cat.id)}
              >
                <ThemedText
                  type="small"
                  style={{ color: selectedCategory === cat.id ? theme.primary : theme.text }}
                >
                  {cat.name}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Cidade
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
            placeholder="Ex: Luanda"
            placeholderTextColor={theme.textSecondary}
            value={city}
            onChangeText={setCity}
          />
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Avaliacao Minima
          </ThemedText>
          <View style={styles.ratingOptions}>
            {ratingOptions.map((rating) => (
              <Pressable
                key={rating}
                style={[
                  styles.ratingOption,
                  { borderColor: minRating === rating ? theme.primary : theme.border },
                  minRating === rating && { backgroundColor: theme.primary + "20" },
                ]}
                onPress={() => setMinRating(rating)}
              >
                {rating === 0 ? (
                  <ThemedText type="small" style={{ color: minRating === rating ? theme.primary : theme.text }}>
                    Todas
                  </ThemedText>
                ) : (
                  <View style={styles.ratingContent}>
                    <Feather name="star" size={14} color={theme.star} />
                    <ThemedText type="small" style={{ color: minRating === rating ? theme.primary : theme.text }}>
                      {rating}+
                    </ThemedText>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Preco Maximo (AOA/hora)
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
            placeholder="Ex: 5000"
            placeholderTextColor={theme.textSecondary}
            value={maxPrice}
            onChangeText={setMaxPrice}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.buttons}>
          <Pressable style={styles.clearButton} onPress={handleClear}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Limpar
            </ThemedText>
          </Pressable>
          <Button onPress={handleApply} style={styles.applyButton}>
            Aplicar Filtros
          </Button>
        </View>
      </ScrollView>
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
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  ratingOptions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  ratingOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  ratingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  buttons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  clearButton: {
    flex: 1,
    height: Spacing.buttonHeight,
    alignItems: "center",
    justifyContent: "center",
  },
  applyButton: {
    flex: 2,
  },
});
