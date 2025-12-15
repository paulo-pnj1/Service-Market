import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ProviderCard } from "@/components/ProviderCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";

type RouteType = RouteProp<HomeStackParamList, "Search">;
type NavigationProp = NativeStackNavigationProp<HomeStackParamList & RootStackParamList>;

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { query, categoryId, categoryName } = route.params || {};

  const [filters, setFilters] = useState({
    categoryId,
    city: undefined as string | undefined,
    minRating: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
  });

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (query) params.append("search", query);
    if (filters.categoryId) params.append("categoryId", filters.categoryId);
    if (filters.city) params.append("city", filters.city);
    if (filters.minRating) params.append("minRating", filters.minRating.toString());
    if (filters.maxPrice) params.append("maxPrice", filters.maxPrice.toString());
    return params.toString();
  };

  const { data: providers = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/providers", buildQueryString()],
    queryFn: async () => {
      const baseUrl = getApiUrl();
      const qs = buildQueryString();
      const url = new URL(`/api/providers${qs ? `?${qs}` : ""}`, baseUrl);
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  useEffect(() => {
    navigation.setOptions({
      headerTitle: categoryName || query || "Resultados",
      headerRight: () => (
        <Pressable
          onPress={() =>
            navigation.navigate("Filter", {
              categoryId: filters.categoryId,
              city: filters.city,
              minRating: filters.minRating,
              maxPrice: filters.maxPrice,
            })
          }
          style={styles.filterButton}
        >
          <Feather name="sliders" size={22} color={theme.text} />
        </Pressable>
      ),
    });
  }, [navigation, categoryName, query, filters, theme]);

  const handleProviderPress = (providerId: string) => {
    navigation.navigate("Provider", { providerId });
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={providers}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        renderItem={({ item }) => (
          <ProviderCard
            provider={item}
            onPress={() => handleProviderPress(item.id)}
            style={styles.gridCard}
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={theme.primary} style={styles.loader} />
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="search" size={48} color={theme.textSecondary} />
              <ThemedText type="body" style={[styles.emptyText, { color: theme.textSecondary }]}>
                Nenhum prestador encontrado
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
                Tente ajustar os filtros ou buscar por outro termo
              </ThemedText>
            </View>
          )
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  row: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  gridCard: {
    flex: 1,
    maxWidth: "48%",
  },
  filterButton: {
    padding: Spacing.sm,
  },
  loader: {
    marginTop: Spacing["3xl"],
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: Spacing["3xl"],
    gap: Spacing.md,
  },
  emptyText: {
    marginTop: Spacing.md,
  },
});
