import React from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
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
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user, provider, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Sair",
      "Tem certeza que deseja sair?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", style: "destructive", onPress: logout },
      ]
    );
  };

  const isProvider = user?.role === "provider" && provider;

  const menuItems = [
    { icon: "edit-2", label: "Editar Perfil", onPress: () => navigation.navigate("EditProfile") },
    ...(isProvider
      ? [{ icon: "briefcase", label: "Meus Servicos", onPress: () => navigation.navigate("ServiceManagement") }]
      : [{ icon: "clock", label: "Historico de Servicos", onPress: () => navigation.navigate("OrderHistory") }]),
    { icon: "bell", label: "Notificacoes", onPress: () => {} },
    { icon: "help-circle", label: "Ajuda", onPress: () => {} },
    { icon: "info", label: "Sobre", onPress: () => {} },
  ];

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <ThemedText type="h1" style={{ color: "#fff" }}>
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </ThemedText>
          </View>
          <ThemedText type="h3" style={styles.userName}>
            {user?.name}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {user?.email}
          </ThemedText>
          {user?.city && (
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={14} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {user.city}
              </ThemedText>
            </View>
          )}
          {user?.role === "provider" && (
            <View style={[styles.badge, { backgroundColor: theme.primary + "20" }]}>
              <ThemedText type="small" style={{ color: theme.primary }}>
                Prestador de Servicos
              </ThemedText>
            </View>
          )}
        </View>

        {provider && (
          <View style={[styles.statsCard, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.statItem}>
              <ThemedText type="h3">{provider.averageRating || "0.0"}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Avaliacao
              </ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <ThemedText type="h3">{provider.totalRatings || 0}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Avaliacoes
              </ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <ThemedText type="h3">
                {provider.isVerified ? "Sim" : "Nao"}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Verificado
              </ThemedText>
            </View>
          </View>
        )}

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <Pressable
              key={index}
              style={[styles.menuItem, { backgroundColor: theme.backgroundSecondary }]}
              onPress={item.onPress}
            >
              <Feather name={item.icon as any} size={20} color={theme.text} />
              <ThemedText type="body" style={{ flex: 1 }}>
                {item.label}
              </ThemedText>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          ))}
        </View>

        <Button
          onPress={handleLogout}
          style={[styles.logoutButton, { backgroundColor: theme.error }]}
        >
          Sair
        </Button>
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
  profileHeader: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  logoutButton: {
    marginTop: Spacing.lg,
  },
});
