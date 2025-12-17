
import React, { useEffect } from "react";
import { View, StyleSheet, Pressable, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user, provider, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      "Confirmar",
      "Tem certeza que deseja sair?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: "Auth" as never }],
            });
          },
        },
      ]
    );
  };

  const isProvider = user?.role === "provider";

  const getBadgeColor = () => {
    return isProvider ? theme.primary : theme.secondary;
  };

  const getBadgeText = () => {
    return isProvider ? "Prestador" : "Cliente";
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={theme.primary} style={{ flex: 1 }} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
      >
        <View style={styles.userInfo}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.backgroundTertiary },
            ]}
          >
            <Feather name="user" size={48} color={theme.textSecondary} />
          </View>
          <ThemedText type="h3" style={styles.userName}>
            {user?.name}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {user?.email}
          </ThemedText>
          <View
            style={[
              styles.badge,
              { backgroundColor: getBadgeColor() },
            ]}
          >
            <ThemedText type="small" style={{ color: "#fff" }}>
              {getBadgeText()}
            </ThemedText>
          </View>
          {user?.city && (
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={16} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {user.city}
              </ThemedText>
            </View>
          )}
        </View>

        {isProvider && provider && (
          <View
            style={[
              styles.statsCard,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <View style={styles.statItem}>
              <ThemedText type="h3">{provider.averageRating?.toFixed(1) || "0.0"}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Avaliação
              </ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <ThemedText type="h3">{provider.totalRatings || 0}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Avaliações
              </ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <ThemedText type="h3">0</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Serviços
              </ThemedText>
            </View>
          </View>
        )}

        <View style={styles.menuSection}>
          <Pressable
            style={[
              styles.menuItem,
              { backgroundColor: theme.backgroundSecondary },
            ]}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Feather name="edit" size={24} color={theme.text} />
            <ThemedText style={styles.menuItemText}>Editar Perfil</ThemedText>
            <Feather name="chevron-right" size={24} color={theme.textSecondary} />
          </Pressable>

          {isProvider && (
            <Pressable
              style={[
                styles.menuItem,
                { backgroundColor: theme.backgroundSecondary },
              ]}
              onPress={() => navigation.navigate("ServiceManagement")}
            >
              <Feather name="tool" size={24} color={theme.text} />
              <ThemedText style={styles.menuItemText}>Gerenciar Serviços</ThemedText>
              <Feather name="chevron-right" size={24} color={theme.textSecondary} />
            </Pressable>
          )}

          <Pressable
            style={[
              styles.menuItem,
              { backgroundColor: theme.backgroundSecondary },
            ]}
            onPress={() => navigation.navigate("OrderHistory")}
          >
            <Feather name="clock" size={24} color={theme.text} />
            <ThemedText style={styles.menuItemText}>Histórico de Serviços</ThemedText>
            <Feather name="chevron-right" size={24} color={theme.textSecondary} />
          </Pressable>
        </View>

        <Pressable
          style={[
            styles.menuItem,
            { backgroundColor: theme.backgroundSecondary },
          ]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={24} color={theme.error} />
          <ThemedText style={[styles.menuItemText, { color: theme.error }]}>
            Sair
          </ThemedText>
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  userInfo: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  userName: {
    marginBottom: Spacing.xs,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  statsCard: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: "100%",
  },
  menuSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  menuItemText: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: 16,
  },
});
