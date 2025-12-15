import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator, Modal, TouchableWithoutFeedback } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
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

type SortOption = "rating" | "price_asc" | "price_desc" | "name";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "rating", label: "Melhor avaliação" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
  { value: "name", label: "Nome A-Z" },
];

const PAGE_SIZE = 10;

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

  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [showSortModal, setShowSortModal] = useState(false);

  const buildQueryString = (page: number) => {
    const params = new URLSearchParams();
    if (query) params.append("search", query);
    if (filters.categoryId) params.append("categoryId", filters.categoryId);
    if (filters.city) params.append("city", filters.city);
    if (filters.minRating) params.append("minRating", filters.minRating.toString());
    if (filters.maxPrice) params.append("maxPrice", filters.maxPrice.toString());
    params.append("sortBy", sortBy);
    params.append("page", page.toString());
    params.append("limit", PAGE_SIZE.toString());
    return params.toString();
  };

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["/api/providers", query, filters, sortBy],
    queryFn: async ({ pageParam = 1 }) => {
      const baseUrl = getApiUrl();
      const qs = buildQueryString(pageParam);
      const url = new URL(`/api/providers?${qs}`, baseUrl);
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      const result = await res.json();
      return Array.isArray(result) ? result : result.data || [];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
  });

  const providers = data?.pages.flat() || [];

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: categoryName || query || "Resultados",
      headerRight: () => (
        <View style={styles.headerButtons}>
          <Pressable onPress={() => setShowSortModal(true)} style={styles.headerButton}>
            <Feather name="bar-chart-2" size={22} color={theme.text} />
          </Pressable>
          <Pressable
            onPress={() =>
              navigation.navigate("Filter", {
                categoryId: filters.categoryId,
                city: filters.city,
                minRating: filters.minRating,
                maxPrice: filters.maxPrice,
              })
            }
            style={styles.headerButton}
          >
            <Feather name="sliders" size={22} color={theme.text} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, categoryName, query, filters, theme]);

  const handleProviderPress = (providerId: string) => {
    navigation.navigate("Provider", { providerId });
  };

  const handleSortSelect = (option: SortOption) => {
    setSortBy(option);
    setShowSortModal(false);
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <ActivityIndicator
        color={theme.primary}
        style={styles.footerLoader}
      />
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.sortBar, { backgroundColor: theme.backgroundSecondary }]}>
        <Pressable style={styles.sortPill} onPress={() => setShowSortModal(true)}>
          <Feather name="bar-chart-2" size={16} color={theme.primary} />
          <ThemedText type="small" style={{ color: theme.primary }}>
            {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
          </ThemedText>
          <Feather name="chevron-down" size={16} color={theme.primary} />
        </Pressable>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {providers.length} resultado{providers.length !== 1 ? "s" : ""}
        </ThemedText>
      </View>

      <FlatList
        data={providers}
        keyExtractor={(item, index) => item.id || `provider-${index}`}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: Spacing.md, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
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

      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSortModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.sortModal, { backgroundColor: theme.backgroundDefault }]}>
                <ThemedText type="h4" style={styles.modalTitle}>
                  Ordenar por
                </ThemedText>
                {SORT_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.sortOption,
                      sortBy === option.value && { backgroundColor: theme.backgroundSecondary },
                    ]}
                    onPress={() => handleSortSelect(option.value)}
                  >
                    <ThemedText
                      type="body"
                      style={sortBy === option.value ? { color: theme.primary } : undefined}
                    >
                      {option.label}
                    </ThemedText>
                    {sortBy === option.value && (
                      <Feather name="check" size={20} color={theme.primary} />
                    )}
                  </Pressable>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  sortBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  sortPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
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
  loader: {
    marginTop: Spacing["3xl"],
  },
  footerLoader: {
    marginVertical: Spacing.lg,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: Spacing["3xl"],
    gap: Spacing.md,
  },
  emptyText: {
    marginTop: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  sortModal: {
    width: "100%",
    maxWidth: 320,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modalTitle: {
    marginBottom: Spacing.md,
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
});
