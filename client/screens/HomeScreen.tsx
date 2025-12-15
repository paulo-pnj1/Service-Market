import React, { useState } from "react";
import { View, StyleSheet, TextInput, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ProviderCard } from "@/components/ProviderCard";
import { CategoryChip } from "@/components/CategoryChip";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: providers = [], isLoading: providersLoading } = useQuery<any[]>({
    queryKey: ["/api/providers"],
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate("Search", { query: searchQuery.trim() });
    }
  };

  const handleCategoryPress = (category: any) => {
    navigation.navigate("Search", { categoryId: category.id, categoryName: category.name });
  };

  const handleProviderPress = (providerId: string) => {
    navigation.navigate("Provider", { providerId });
  };

  const featuredProviders = providers.slice(0, 6);

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={providers}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View style={styles.logoRow}>
                <Image
                  source={require("../../assets/images/icon.png")}
                  style={styles.logoSmall}
                  contentFit="contain"
                />
                <ThemedText type="h3">ServicoJa</ThemedText>
              </View>
            </View>

            <View style={[styles.searchBar, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="search" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Buscar servicos..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Feather name="x" size={20} color={theme.textSecondary} />
                </Pressable>
              ) : null}
            </View>

            <ThemedText type="h4" style={styles.sectionTitle}>
              Categorias
            </ThemedText>
            {categoriesLoading ? (
              <ActivityIndicator color={theme.primary} style={styles.loader} />
            ) : (
              <FlatList
                data={categories}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item: any) => item.id}
                contentContainerStyle={styles.categoriesContainer}
                renderItem={({ item }) => (
                  <CategoryChip
                    name={item.name}
                    icon={item.icon}
                    onPress={() => handleCategoryPress(item)}
                  />
                )}
              />
            )}

            <ThemedText type="h4" style={styles.sectionTitle}>
              Prestadores em Destaque
            </ThemedText>
            {providersLoading ? (
              <ActivityIndicator color={theme.primary} style={styles.loader} />
            ) : featuredProviders.length === 0 ? (
              <ThemedText type="small" style={[styles.emptyText, { color: theme.textSecondary }]}>
                Nenhum prestador encontrado
              </ThemedText>
            ) : (
              <FlatList
                data={featuredProviders}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item: any) => item.id}
                contentContainerStyle={styles.featuredContainer}
                renderItem={({ item }) => (
                  <ProviderCard
                    provider={item}
                    onPress={() => handleProviderPress(item.id)}
                    horizontal
                  />
                )}
              />
            )}

            <ThemedText type="h4" style={styles.sectionTitle}>
              Todos os Prestadores
            </ThemedText>
          </>
        }
        renderItem={({ item }) => (
          <ProviderCard
            provider={item}
            onPress={() => handleProviderPress(item.id)}
            style={styles.gridCard}
          />
        )}
        ListEmptyComponent={
          providersLoading ? null : (
            <ThemedText type="small" style={[styles.emptyText, { color: theme.textSecondary }]}>
              Nenhum prestador encontrado
            </ThemedText>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  logoSmall: {
    width: 32,
    height: 32,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  categoriesContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  featuredContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
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
    marginVertical: Spacing.xl,
  },
  emptyText: {
    textAlign: "center",
    marginVertical: Spacing.xl,
  },
});
