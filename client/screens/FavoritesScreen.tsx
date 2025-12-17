
import React from "react";
import { View, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useQuery, useQueries } from "@tanstack/react-query";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ProviderCard } from "@/components/ProviderCard";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing } from "@/constants/theme";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import { favoritesService, providersService, servicesService } from "@/lib/query-client";
import { ServiceData } from "@/lib/firestore"; // Import adicionado

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

type ProviderWithServices = {
  provider: NonNullable<Awaited<ReturnType<typeof providersService.get>>>;
  services: ServiceData[];
};

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const { data: favorites, isLoading: favoritesLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: () => favoritesService.getByUser(user?.id || ""),
    enabled: !!user?.id,
  });

  const providerQueries = favorites?.map((fav) => ({
    queryKey: ["provider", fav.providerId],
    queryFn: () => providersService.get(fav.providerId),
    enabled: !!fav.providerId,
  })) ?? [];

  const providerResults = useQueries({ queries: providerQueries });

  const validProviders = providerResults
    .filter((result) => result.data !== null && result.data !== undefined)
    .map((result) => result.data!);

  const servicesQueries = validProviders.map((provider) => ({
    queryKey: ["services", provider.id],
    queryFn: () => servicesService.getByProvider(provider.id),
  }));

  const servicesResults = useQueries({ queries: servicesQueries });

  const providersWithServices: ProviderWithServices[] = validProviders.map((provider, index) => ({
    provider,
    services: servicesResults[index]?.data ?? [],
  }));

  const isLoading = favoritesLoading || providerResults.some((r) => r.isLoading);

  const handleProviderPress = (providerId: string) => {
    navigation.navigate("Provider", { providerId });
  };

  const renderFavoriteRow = ({ item }: { item: ProviderWithServices[] }) => (
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

  const favoriteRows = chunkArray(providersWithServices, 2);

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={favoriteRows}
        renderItem={renderFavoriteRow}
        keyExtractor={(item) => item.map((entry) => entry.provider.id).join("-")}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: insets.top + headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator style={styles.loader} color={theme.primary} />
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="heart" size={48} color={theme.textSecondary} />
              <ThemedText type="body" style={[styles.emptyText, { color: theme.textSecondary }]}>
                Nenhum favorito ainda
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
                Adicione prestadores aos favoritos para encontra-los facilmente
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
