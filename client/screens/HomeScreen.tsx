// HomeScreen.tsx - Versão corrigida
import React, { useState } from "react";
import { 
  View, 
  StyleSheet, 
  TextInput, 
  FlatList, 
  Pressable, 
  ActivityIndicator,
  ScrollView,
  Dimensions 
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ProviderCard } from "@/components/ProviderCard";
import { CategoryChip } from "@/components/CategoryChip";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import { categoriesService, providersService, servicesService } from "@/lib/query-client";
import { useAuth } from "@/contexts/AuthContext";
import { ServiceData, CategoryData } from "@/lib/firestore";

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

type ProviderWithServices = {
  provider: NonNullable<Awaited<ReturnType<typeof providersService.getAll>>[number]>;
  services: ServiceData[];
};

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesService.getAll,
  });

  const { data: allProviders = [], isLoading: providersLoading } = useQuery({
    queryKey: ["providers"],
    queryFn: () => providersService.getAll(),
  });

  // Destaques: os 6 prestadores com melhor avaliação
  const featuredProviders = [...allProviders]
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 6);

  const servicesQueries = featuredProviders.map((provider) => ({
    queryKey: ["services", provider.id],
    queryFn: () => servicesService.getByProvider(provider.id),
  }));

  const servicesResults = useQueries({ queries: servicesQueries });

  const featuredWithServices: ProviderWithServices[] = featuredProviders.map((provider, index) => ({
    provider,
    services: servicesResults[index]?.data ?? [],
  }));

  const isLoading = categoriesLoading || providersLoading;

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate("Search", { query: searchQuery.trim() });
    }
  };

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    navigation.navigate("Search", { categoryId, categoryName });
  };

  const handleProviderPress = (providerId: string) => {
    navigation.navigate("Provider", { providerId });
  };

  const handleUserPress = () => {
    console.log("Perfil clicado");
  };

  const handleAllCategoriesPress = () => {
    navigation.navigate("Search", {});
  };

  // Cores harmonizadas
  const primaryColor = "#FF6B35"; // Laranja principal
  const secondaryColor = "#2E7D32"; // Verde escuro harmonizado
  const mutedText = "#757575";

  // Componente CategoryChipWrapper para adicionar cor personalizada
  const CategoryChipWrapper = ({ item }: { item: CategoryData }) => {
    return (
      <Pressable
        style={[styles.categoryChipContainer, { backgroundColor: primaryColor }]}
        onPress={() => handleCategoryPress(item.id, item.name)}
      >
        <View style={styles.categoryChipContent}>
          <MaterialCommunityIcons name={item.icon as any} size={24} color="#FFFFFF" />
          <ThemedText 
            type="body" 
            style={[styles.categoryChipText, { color: '#FFFFFF' }]}
            numberOfLines={2}
          >
            {item.name}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  // Renderizador personalizado para categoria
  const renderCategory = ({ item }: { item: CategoryData }) => (
    <CategoryChipWrapper item={item} />
  );

  // Renderizador para destaque
  const renderFeaturedItem = ({ item }: { item: ProviderWithServices }) => (
    <View style={[styles.featuredItemContainer, { borderColor: primaryColor + '30' }]}>
      <ProviderCard
        provider={item.provider}
        services={item.services}
        onPress={() => handleProviderPress(item.provider.id)}
      />
    </View>
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText type="body" style={[styles.loadingText, { color: mutedText }]}>
          Carregando serviços...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
      >
        {/* Header */}
        <View style={[styles.headerContainer, { 
          backgroundColor: primaryColor,
          paddingTop: insets.top,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }]}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.brandContainer}>
                <View style={[styles.logoContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Image
                    source={require("../../assets/images/icon.png")}
                    style={styles.logo}
                    contentFit="contain"
                  />
                </View>
                <ThemedText 
                  type="h2" 
                  style={styles.brandText}
                >
                  ServiçoJá
                </ThemedText>
              </View>
              
              {user && (
                <Pressable 
                  style={[styles.userBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                  onPress={handleUserPress}
                >
                  <MaterialCommunityIcons name="account-circle" size={32} color="#FFFFFF" />
                  <View style={styles.userInfo}>
                    <ThemedText 
                      type="small" 
                      style={styles.welcomeText}
                    >
                      Bem-vindo,
                    </ThemedText>
                    <ThemedText 
                      type="body" 
                      style={styles.userName}
                    >
                      {user.name.split(" ")[0]}
                    </ThemedText>
                  </View>
                </Pressable>
              )}
            </View>

            <View style={styles.searchContainer}>
              <Pressable
                style={styles.searchBar}
                onPress={handleSearch}
              >
                <View style={styles.searchBarContent}>
                  <Feather name="search" size={20} color={mutedText} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="Buscar serviços ou profissionais..."
                    placeholderTextColor={mutedText}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery("")}>
                      <Feather name="x" size={20} color={mutedText} />
                    </Pressable>
                  )}
                </View>
              </Pressable>
              <Pressable 
                style={[styles.searchButton, { backgroundColor: secondaryColor }]}
                onPress={handleSearch}
              >
                <Feather name="arrow-right" size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: primaryColor + '15' }]}>
            <View style={[styles.statIcon, { backgroundColor: primaryColor }]}>
              <MaterialCommunityIcons name="account-group" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.statContent}>
              <ThemedText type="h3" style={[styles.statValue, { color: primaryColor }]}>
                {allProviders.length}+
              </ThemedText>
              <ThemedText type="small" style={[styles.statLabel, { color: mutedText }]}>
                Profissionais
              </ThemedText>
            </View>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: secondaryColor + '15' }]}>
            <View style={[styles.statIcon, { backgroundColor: secondaryColor }]}>
              <MaterialCommunityIcons name="star" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.statContent}>
              <ThemedText type="h3" style={[styles.statValue, { color: secondaryColor }]}>
                {featuredProviders.length}
              </ThemedText>
              <ThemedText type="small" style={[styles.statLabel, { color: mutedText }]}>
                Destaques
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Categorias */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons name="tag-multiple" size={24} color={primaryColor} />
              <ThemedText type="h3" style={styles.sectionTitle}>
                Categorias
              </ThemedText>
            </View>
            <Pressable 
              style={styles.seeAllButton}
              onPress={handleAllCategoriesPress}
            >
              <ThemedText type="small" style={[styles.seeAllText, { color: primaryColor }]}>
                Ver todas
              </ThemedText>
              <Feather name="chevron-right" size={16} color={primaryColor} />
            </Pressable>
          </View>
          
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
            snapToInterval={width * 0.5 + Spacing.md}
            decelerationRate="fast"
          />
        </View>

        {/* Destaques */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons name="crown" size={24} color={secondaryColor} />
              <ThemedText type="h3" style={styles.sectionTitle}>
                Destaques
              </ThemedText>
            </View>
            <ThemedText type="small" style={[styles.sectionSubtitle, { color: mutedText }]}>
              Melhores avaliações
            </ThemedText>
          </View>

          <FlatList
            data={featuredWithServices}
            renderItem={renderFeaturedItem}
            keyExtractor={(item) => item.provider.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
            snapToInterval={width * 0.85 + Spacing.md}
            decelerationRate="fast"
          />
        </View>

        {/* CTA Final */}
        <View style={[styles.ctaContainer, { 
          backgroundColor: primaryColor + '10',
          borderColor: primaryColor + '30',
        }]}>
          <MaterialCommunityIcons name="handshake-outline" size={48} color={primaryColor} />
          <ThemedText type="h4" style={[styles.ctaTitle, { color: primaryColor }]}>
            Precisa de ajuda?
          </ThemedText>
          <ThemedText type="body" style={[styles.ctaText, { color: mutedText }]}>
            Encontre o profissional perfeito para qualquer serviço
          </ThemedText>
          <Pressable 
            style={[styles.ctaButton, { backgroundColor: primaryColor }]}
            onPress={() => navigation.navigate('Search', { query: '' })}
          >
            <ThemedText type="body" style={styles.ctaButtonText}>
              Explorar todos os serviços
            </ThemedText>
            <Feather name="arrow-right" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerContainer: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
  },
  brandText: {
    fontWeight: '800',
    fontSize: 24,
    color: '#FFFFFF',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  userInfo: {
    alignItems: 'flex-start',
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchBar: {
    flex: 1,
    height: 56,
  },
  searchBarContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    height: '100%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  searchButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginTop: -20,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    flex: 0.48,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontWeight: '800',
    fontSize: 24,
  },
  statLabel: {
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontWeight: '500',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontWeight: '600',
  },
  categoriesList: {
    gap: Spacing.md,
    paddingRight: Spacing.lg,
  },
  categoryChipContainer: {
    width: width * 0.45,
    marginRight: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryChipContent: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryChipText: {
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
  featuredList: {
    gap: Spacing.md,
    paddingRight: Spacing.lg,
  },
  featuredItemContainer: {
    width: width * 0.85,
    marginRight: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  ctaContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl * 2,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    borderWidth: 1,
  },
  ctaTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    fontWeight: '700',
  },
  ctaText: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
});