import React from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { RatingStars } from "@/components/RatingStars";
import { ReviewCard } from "@/components/ReviewCard";
import { CategoryChip } from "@/components/CategoryChip";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { MessagesStackParamList } from "@/navigation/MessagesStackNavigator";
import { 
  queryClient, 
  providersService, 
  usersService, 
  servicesService, 
  reviewsService,
  favoritesService,
  conversationsService,
  categoriesService
} from "@/lib/query-client";

type RouteType = RouteProp<HomeStackParamList, "Provider">;
type NavigationProp = NativeStackNavigationProp<HomeStackParamList & RootStackParamList & MessagesStackParamList>;

export default function ProviderScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { providerId } = route.params;
  const { user } = useAuth();

  const { data: provider, isLoading } = useQuery({
    queryKey: ["provider", providerId],
    queryFn: async () => {
      const providerData = await providersService.get(providerId);
      if (!providerData) return null;
      
      const userData = await usersService.get(providerData.userId);
      const services = await servicesService.getByProvider(providerId);
      const reviews = await reviewsService.getByProvider(providerId);
      const allCategories = await categoriesService.getAll();
      const providerCategories = allCategories.filter(c => 
        providerData.categories?.includes(c.id)
      );
      
      const reviewsWithClients = await Promise.all(
        reviews.map(async (review) => {
          const client = await usersService.get(review.clientId);
          return { ...review, client };
        })
      );
      
      return {
        ...providerData,
        user: userData,
        services,
        reviews: reviewsWithClients,
        categories: providerCategories,
      };
    },
  });

  const { data: favoriteData } = useQuery({
    queryKey: ["favorites/check", user?.id, providerId],
    queryFn: async () => {
      if (!user) return { isFavorite: false };
      const isFavorite = await favoritesService.isFavorite(user.id, providerId);
      return { isFavorite };
    },
    enabled: !!user,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (favoriteData?.isFavorite) {
        await favoritesService.remove(user.id, providerId);
      } else {
        await favoritesService.add(user.id, providerId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["favorites/check", user?.id, providerId] });
    },
  });

  const handleChat = async () => {
    if (!user) return;
    try {
      const conv = await conversationsService.getOrCreate(user.id, providerId);
      navigation.navigate("MessagesTab" as any, {
        screen: "Chat",
        params: { conversationId: conv.id, providerName: provider?.user?.name || "Chat" },
      });
    } catch (error) {
      Alert.alert("Erro", "Nao foi possivel iniciar a conversa");
    }
  };

  const handleReview = () => {
    navigation.navigate("Review", { providerId, providerName: provider?.user?.name || "" });
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  if (!provider) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText>Prestador nao encontrado</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.coverContainer, { backgroundColor: theme.primary }]}>
          <Pressable
            style={[styles.backButton, { top: insets.top + Spacing.sm }]}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#fff" />
          </Pressable>
          <Pressable
            style={[styles.favoriteButton, { top: insets.top + Spacing.sm }]}
            onPress={() => toggleFavoriteMutation.mutate()}
          >
            <Feather
              name={favoriteData?.isFavorite ? "heart" : "heart"}
              size={24}
              color={favoriteData?.isFavorite ? "#E63946" : "#fff"}
            />
          </Pressable>
          {provider.isVerified && (
            <View style={[styles.verifiedBadge, { backgroundColor: theme.success }]}>
              <Feather name="check" size={14} color="#fff" />
              <ThemedText type="small" style={{ color: "#fff" }}>
                Verificado
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.profileSection}>
          <View style={[styles.avatarContainer, { borderColor: theme.backgroundDefault }]}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <ThemedText type="h2" style={{ color: "#fff" }}>
                {provider.user?.name?.charAt(0)?.toUpperCase() || "P"}
              </ThemedText>
            </View>
          </View>
          <ThemedText type="h2" style={styles.providerName}>
            {provider.user?.name}
          </ThemedText>
          <View style={styles.ratingRow}>
            <RatingStars rating={provider.averageRating || 0} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              ({provider.totalRatings || 0} avaliacoes)
            </ThemedText>
          </View>
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={16} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {provider.city}
            </ThemedText>
          </View>
          <ThemedText type="h4" style={{ color: theme.primary }}>
            AOA {(provider.hourlyRate || 0).toLocaleString()}/h
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Categorias
          </ThemedText>
          <View style={styles.categoriesRow}>
            {provider.categories?.map((cat: any) => (
              <CategoryChip key={cat.id} name={cat.name} icon={cat.icon} small />
            ))}
          </View>
        </View>

        {provider.description && (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Sobre
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {provider.description}
            </ThemedText>
          </View>
        )}

        {provider.services?.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Servicos
            </ThemedText>
            {provider.services.map((service: any) => (
              <View
                key={service.id}
                style={[styles.serviceCard, { backgroundColor: theme.backgroundSecondary }]}
              >
                <ThemedText type="body">{service.name}</ThemedText>
                {service.description && (
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {service.description}
                  </ThemedText>
                )}
                {service.price && (
                  <ThemedText type="small" style={{ color: theme.primary, marginTop: Spacing.xs }}>
                    AOA {service.price.toLocaleString()}
                  </ThemedText>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <ThemedText type="h4">Avaliacoes</ThemedText>
            <Pressable onPress={handleReview}>
              <ThemedText type="small" style={{ color: theme.primary }}>
                Avaliar
              </ThemedText>
            </Pressable>
          </View>
          {provider.reviews?.length > 0 ? (
            provider.reviews.slice(0, 5).map((review: any) => (
              <ReviewCard key={review.id} review={review} />
            ))
          ) : (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Nenhuma avaliacao ainda
            </ThemedText>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.backgroundDefault, paddingBottom: insets.bottom + Spacing.md }, Shadows.medium]}>
        <Button onPress={handleChat} style={[styles.footerButton, { backgroundColor: theme.secondary }]}>
          Conversar
        </Button>
        <Button onPress={handleReview} style={styles.footerButton}>
          Solicitar Orcamento
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  coverContainer: {
    height: 180,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteButton: {
    position: "absolute",
    right: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: Spacing.lg,
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  profileSection: {
    alignItems: "center",
    marginTop: -50,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    borderWidth: 4,
    borderRadius: 60,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  providerName: {
    marginBottom: Spacing.xs,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  categoriesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  serviceCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  footerButton: {
    flex: 1,
  },
});
