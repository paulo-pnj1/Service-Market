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
import { apiRequest } from "@/lib/query-client";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList, "OrderHistory">,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Order {
  id: string;
  status: string;
  scheduledDate?: string;
  completedDate?: string;
  notes?: string;
  totalPrice?: string;
  createdAt: string;
  service: {
    id: string;
    name: string;
    price: string;
  };
  provider: {
    id: string;
    user: {
      name: string;
      photoUrl?: string;
    };
  };
}

const statusColors: Record<string, string> = {
  pending: "#F39C12",
  confirmed: "#3498DB",
  in_progress: "#9B59B6",
  completed: "#27AE60",
  cancelled: "#E74C3C",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  in_progress: "Em Andamento",
  completed: "Concluido",
  cancelled: "Cancelado",
};

export default function OrderHistoryScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/orders");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-AO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const statusColor = statusColors[item.status] || theme.textSecondary;
    const statusLabel = statusLabels[item.status] || item.status;

    return (
      <Pressable
        style={[styles.orderCard, { backgroundColor: theme.backgroundSecondary }]}
        onPress={() => {
          if (item.status === "completed") {
            navigation.getParent()?.getParent()?.navigate("Review", { providerId: item.provider.id, providerName: item.provider.user.name });
          }
        }}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <ThemedText type="body" style={{ fontWeight: "600" }}>{item.service.name}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {item.provider.user.name}
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
            <ThemedText type="small" style={{ color: statusColor, fontWeight: "600" }}>
              {statusLabel}
            </ThemedText>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
              {item.scheduledDate ? formatDate(item.scheduledDate) : formatDate(item.createdAt)}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={16} color={theme.primary} />
            <ThemedText type="small" style={{ color: theme.primary, marginLeft: Spacing.xs, fontWeight: "600" }}>
              {item.totalPrice || item.service.price} Kz
            </ThemedText>
          </View>
        </View>

        {item.notes && (
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
            {item.notes}
          </ThemedText>
        )}

        {item.status === "completed" && (
          <View style={styles.reviewPrompt}>
            <Ionicons name="star-outline" size={16} color={theme.primary} />
            <ThemedText type="small" style={{ color: theme.primary, marginLeft: Spacing.xs }}>
              Toque para avaliar
            </ThemedText>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={[
          styles.list,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color={theme.textSecondary} />
              <ThemedText type="body" style={{ textAlign: "center", marginTop: Spacing.lg, fontWeight: "600" }}>
                Nenhum servico contratado
              </ThemedText>
              <ThemedText
                type="small"
                style={{ textAlign: "center", color: theme.textSecondary, marginTop: Spacing.sm }}
              >
                Quando voce contratar um servico, ele aparecera aqui
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
  list: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  loader: {
    marginTop: Spacing["3xl"],
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
