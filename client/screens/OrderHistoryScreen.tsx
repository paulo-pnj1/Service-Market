
import React from "react";
import { View, StyleSheet, FlatList, ActivityIndicator, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, CompositeNavigationProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { serviceOrdersService, servicesService, providersService, usersService } from "@/lib/query-client";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";
import { ServiceData, ProviderData, UserData } from "@/lib/firestore";

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Order {
  id: string;
  service: { id?: string; name: string; price: number };
  provider: { id: string; userName: string };
  status: string;
  scheduledDate?: Date;
  price?: number;
  createdAt: Date;
}

export default function OrderHistoryScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const isProvider = user?.role === "provider";

  const { data: enrichedOrders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["orderHistory", user?.id, isProvider],
    queryFn: async () => {
      if (!user?.id) return [];

      const rawOrders = isProvider
        ? await serviceOrdersService.getByProvider(user.id)
        : await serviceOrdersService.getByClient(user.id);

      const enriched = await Promise.all(
        rawOrders.map(async (order) => {
          let serviceName = "Serviço não especificado";
          let servicePrice = 0;

          if (order.serviceId) {
            const service = await servicesService.get(order.serviceId);
            if (service) {
              serviceName = service.name;
              servicePrice = service.price ?? 0;
            }
          }

          // Carregar o nome do prestador a partir do documento do usuário vinculado ao provider
          let providerName = "Prestador desconhecido";
          if (order.providerId) {
            const provider = await providersService.get(order.providerId);
            if (provider?.userId) {
              const providerUser = await usersService.get(provider.userId);
              providerName = providerUser?.name || "Prestador desconhecido";
            }
          }

          return {
            id: order.id,
            service: {
              id: order.serviceId,
              name: serviceName,
              price: servicePrice,
            },
            provider: {
              id: order.providerId,
              userName: providerName,
            },
            status: order.status,
            scheduledDate: order.scheduledDate,
            price: order.price || servicePrice,
            createdAt: order.createdAt,
          };
        })
      );

      return enriched.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },
    enabled: !!user?.id,
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "concluído":
        return theme.success;
      case "pending":
      case "pendente":
        return theme.warning;
      case "cancelled":
      case "cancelado":
        return theme.error;
      default:
        return theme.textSecondary;
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={[styles.orderCard, { backgroundColor: theme.backgroundSecondary }]}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <ThemedText type="body" numberOfLines={1}>
            {item.service.name}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {item.provider.userName}
          </ThemedText>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "20" },
          ]}
        >
          <ThemedText type="small" style={{ color: getStatusColor(item.status) }}>
            {item.status}
          </ThemedText>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
            {item.scheduledDate
              ? item.scheduledDate.toLocaleDateString("pt-AO")
              : "Data não definida"}
          </ThemedText>
        </View>
        <ThemedText type="body">
          AOA {item.price ?? item.service.price}
        </ThemedText>
      </View>

      {item.status.toLowerCase() === "completed" && (
        <Pressable
          style={styles.reviewPrompt}
          onPress={() => navigation.navigate("Review", { providerId: item.provider.id, providerName: item.provider.userName })}
        >
          <Ionicons name="star-outline" size={18} color={theme.primary} />
          <ThemedText type="small" style={{ color: theme.primary, marginLeft: Spacing.xs }}>
            Avaliar prestador
          </ThemedText>
        </Pressable>
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={enrichedOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + headerHeight + Spacing.lg },
        ]}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={theme.primary} style={{ marginTop: Spacing.xl }} />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={theme.textSecondary} />
              <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
                Nenhum histórico de serviços
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
    paddingBottom: Spacing.xl,
  },
  emptyState: {
    alignItems: "center",
    marginTop: Spacing["3xl"],
    paddingHorizontal: Spacing.xl,
  },
  orderCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewPrompt: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
});
