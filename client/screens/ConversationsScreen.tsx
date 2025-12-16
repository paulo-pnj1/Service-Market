import React from "react";
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { MessagesStackParamList } from "@/navigation/MessagesStackNavigator";
import { conversationsService, providersService, usersService } from "@/lib/query-client";

type NavigationProp = NativeStackNavigationProp<MessagesStackParamList>;

export default function ConversationsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const convs = await conversationsService.getByUser(user.id);
      const convsWithDetails = await Promise.all(
        convs.map(async (conv) => {
          const provider = await providersService.get(conv.providerId);
          const providerUser = provider ? await usersService.get(provider.userId) : null;
          const client = await usersService.get(conv.clientId);
          return {
            ...conv,
            provider: provider ? { ...provider, user: providerUser } : null,
            client,
          };
        })
      );
      return convsWithDetails;
    },
    enabled: !!user,
  });

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Ontem";
    } else if (days < 7) {
      return `${days} dias`;
    } else {
      return date.toLocaleDateString("pt-AO", { day: "2-digit", month: "2-digit" });
    }
  };

  const handleConversationPress = (conv: any) => {
    const providerName = conv.provider?.user?.name || "Chat";
    navigation.navigate("Chat", { conversationId: conv.id, providerName });
  };

  const renderConversation = ({ item }: { item: any }) => {
    const otherName = user?.role === "provider" ? item.client?.name : item.provider?.user?.name;
    const time = item.lastMessageAt ? formatTime(item.lastMessageAt) : "";

    return (
      <Pressable
        style={[styles.conversationItem, { backgroundColor: theme.backgroundDefault }]}
        onPress={() => handleConversationPress(item)}
      >
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <ThemedText type="body" style={{ color: "#fff" }}>
            {otherName?.charAt(0)?.toUpperCase() || "?"}
          </ThemedText>
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <ThemedText type="body" numberOfLines={1} style={{ flex: 1 }}>
              {otherName}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {time}
            </ThemedText>
          </View>
          <ThemedText type="small" numberOfLines={1} style={{ color: theme.textSecondary }}>
            Toque para ver a conversa
          </ThemedText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        renderItem={renderConversation}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={theme.primary} style={styles.loader} />
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="message-circle" size={48} color={theme.textSecondary} />
              <ThemedText type="body" style={[styles.emptyText, { color: theme.textSecondary }]}>
                Sem mensagens ainda
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
                Inicie uma conversa com um prestador
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
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
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
