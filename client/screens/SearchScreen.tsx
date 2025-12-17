
import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator, Modal, TouchableWithoutFeedback } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery, useQueries } from "@tanstack/react-query";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ProviderCard } from "@/components/ProviderCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import { providersService, servicesService } from "@/lib/query-client";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { ServiceData } from "@/lib/firestore";

type NavigationProp = NativeStackNavigationProp<HomeStackParamList & RootStackParamList>;
type RouteType = RouteProp<HomeStackParamList, "Search">;

type ProviderWithServices = {
  provider: NonNullable<Awaited<ReturnType<typeof providersService.getAll>>[number]>;
  services: ServiceData[];
};

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();

  const [sortBy, setSortBy] = useState<"rating" | "price" | "name">("rating");
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);

  const { query, categoryId, categoryName } = route.params || {};

  const { data: allProviders = [], isLoading } = useQuery({
    queryKey: ["providers", query, categoryId],
    queryFn: async () => {
      if (query) return providersService.search(query);
      return providersService.getAll();
    },
  });

  const servicesQueries = allProviders.map((provider) => ({
    queryKey: ["services", provider.id],
    queryFn: () => servicesService.getByProvider(provider.id),
  }));

  const servicesResults = useQueries({ queries: servicesQueries });

  const providersWithServices: ProviderWithServices[] = allProviders.map((provider, index) => ({
    provider,
    services: servicesResults[index]?.data ?? [],
  }));

  const sortedProviders = useCallback(() => {
    return [...providersWithServices].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (Number(b.provider.averageRating) || 0) - (Number(a.provider.averageRating) || 0);
        case "price":
          return (Number(a.provider.hourlyRate) || 0) - (Number(b.provider.hourlyRate) || 0);
        case "name":
          return (a.provider.city || "").localeCompare(b.provider.city || "");
        default:
          return 0;
      }
    });
  }, [providersWithServices, sortBy]);

  const [filteredProviders, setFilteredProviders] = useState<ProviderWithServices[]>([]);

  useEffect(() => {
    setFilteredProviders(sortedProviders());
  }, [sortedProviders]);

  const handleProviderPress = (providerId: string) => {
    navigation.navigate("Provider", { providerId });
  };

  const handleOpenFilters = () => {
    navigation.navigate("Filter", { categoryId });
  };

  const renderProviderRow = ({ item }: { item: ProviderWithServices[] }) => (
    <View style={styles.row}>
      {item.map((entry) => (
        <ProviderCard
          key={entry.provider.id}
          provider={entry.provider}
          services={entry.services}
          style={styles.gridCard}
          onPress={() => handleProviderPress(entry.provider.id)}
        />
      ))}
    </View>
  );

  const chunkArray = <T,>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const providerRows = chunkArray(filteredProviders, 2);

  const getTitle = () => {
    if (categoryName) return categoryName;
    if (query) return `Resultados para "${query}"`;
    return "Todos os Prestadores";
  };

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + headerHeight,
            backgroundColor: theme.backgroundRoot,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <ThemedText type="h3">{getTitle()}</ThemedText>
          <View style={styles.actions}>
            <Pressable
              style={[
                styles.actionButton,
                { backgroundColor: theme.backgroundSecondary },
              ]}
              onPress={() => setIsSortModalVisible(true)}
            >
              <Feather name="sliders" size={20} color={theme.text} />
              <ThemedText type="small" style={{ marginLeft: Spacing.xs }}>
                Ordenar
              </ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.actionButton,
                { backgroundColor: theme.backgroundSecondary },
              ]}
              onPress={handleOpenFilters}
            >
              <Feather name="filter" size={20} color={theme.text} />
              <ThemedText type="small" style={{ marginLeft: Spacing.xs }}>
                Filtros
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={theme.primary} />
      ) : filteredProviders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="search" size={48} color={theme.textSecondary} />
          <ThemedText type="body" style={styles.emptyText}>
            Nenhum prestador encontrado
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
            Tente ajustar sua busca ou filtros
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={providerRows}
          renderItem={renderProviderRow}
          keyExtractor={(item) => item.map((entry) => entry.provider.id).join("-")}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarHeight + Spacing.xl },
          ]}
        />
      )}

      <Modal
        visible={isSortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSortModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsSortModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.sortModal, { backgroundColor: theme.backgroundDefault }]}>
                <ThemedText type="h4" style={styles.modalTitle}>
                  Ordenar por
                </ThemedText>
                {(["rating", "price", "name"] as const).map((option) => (
                  <Pressable
                    key={option}
                    style={[
                      styles.sortOption,
                      sortBy === option && { backgroundColor: theme.backgroundSecondary },
                    ]}
                    onPress={() => {
                      setSortBy(option);
                      setIsSortModalVisible(false);
                    }}
                  >
                    <ThemedText type="body">
                      {option === "rating" ? "Avaliação" : option === "price" ? "Preço" : "Nome"}
                    </ThemedText>
                    {sortBy === option && <Feather name="check" size={20} color={theme.primary} />}
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
  header: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
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
