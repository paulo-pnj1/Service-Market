import React, { useEffect } from "react";
import { View, StyleSheet, Pressable, Alert, ScrollView } from "react-native";
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
import { Image } from "expo-image";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { user, provider, logout, isLoading } = useAuth();

  // Alerta para prestadores antigos completarem o perfil
  useEffect(() => {
    if (user?.role === "provider" && !provider && !isLoading) {
      Alert.alert(
        "Complete o seu perfil de prestador",
        "Para acessar todas as funcionalidades (Meus Serviços, estatísticas, etc.), complete o seu perfil agora.",
        [
          { text: "Mais tarde", style: "cancel" },
          { text: "Completar agora", onPress: () => navigation.navigate("EditProfile") },
        ]
      );
    }
  }, [user, provider, isLoading, navigation]);

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Carregando...</ThemedText>
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Você não está logado</ThemedText>
      </ThemedView>
    );
  }

  const avatarPlaceholder = user.name.charAt(0).toUpperCase();

  const photoUrl = user.photoUrl || provider?.photoUrl;

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
      >
        <View style={styles.header}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <ThemedText type="h2" style={{ color: "#fff" }}>
                {avatarPlaceholder}
              </ThemedText>
            </View>
          )}
          <ThemedText type="h3" style={styles.name}>
            {user.name}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {user.email}
          </ThemedText>
          {user.city && (
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={14} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                {user.city}
              </ThemedText>
            </View>
          )}
          {user.role === "provider" && (
            <View style={[styles.badge, { backgroundColor: theme.primary + "20" }]}>
              <ThemedText type="small" style={{ color: theme.primary }}>
                Prestador de Serviços
              </ThemedText>
            </View>
          )}
        </View>

        {provider && (
          <View style={[styles.statsCard, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.statItem}>
              <ThemedText type="h4">{provider.totalRatings || 0}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Avaliações
              </ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <ThemedText type="h4">{provider.averageRating || "0.0"}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Média
              </ThemedText>
            </View>
          </View>
        )}

        <View style={styles.menuSection}>
          <Pressable
            style={[styles.menuItem, { backgroundColor: theme.backgroundSecondary }]}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Feather name="edit-3" size={20} color={theme.text} />
            <ThemedText style={styles.menuItemText}>Editar Perfil</ThemedText>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>

          {user.role === "provider" && provider && (
            <>
              <Pressable
                style={[styles.menuItem, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => navigation.navigate("ServiceManagement")}
              >
                <Feather name="tool" size={20} color={theme.text} />
                <ThemedText style={styles.menuItemText}>Meus Serviços</ThemedText>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </Pressable>

              <Pressable
                style={[styles.menuItem, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => navigation.navigate("OrderHistory")}
              >
                <Feather name="clock" size={20} color={theme.text} />
                <ThemedText style={styles.menuItemText}>Histórico de Serviços</ThemedText>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </Pressable>
            </>
          )}

          <Pressable
            style={[styles.menuItem, { backgroundColor: theme.backgroundSecondary }]}
            onPress={logout}
          >
            <Feather name="log-out" size={20} color={theme.error} />
            <ThemedText style={[styles.menuItemText, { color: theme.error }]}>
              Sair
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: Spacing.lg,
  },
  name: {
    marginBottom: Spacing.xs,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
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
    fontSize: 16,
  },
});