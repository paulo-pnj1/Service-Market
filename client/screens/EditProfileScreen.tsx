import React, { useState } from "react";
import { View, StyleSheet, TextInput, Alert, ActivityIndicator, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { usersService, providersService } from "@/lib/query-client";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { user, provider, updateUser, updateProvider } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [city, setCity] = useState(user?.city || "");
  const [whatsapp, setWhatsapp] = useState(provider?.whatsapp || "");
  const [facebook, setFacebook] = useState(provider?.facebook || "");
  const [description, setDescription] = useState(provider?.description || "");
  const [hourlyRate, setHourlyRate] = useState(provider?.hourlyRate?.toString() || "");

  const isProviderRole = user?.role === "provider";

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      await usersService.update(user.id, { name, phone, city });
      const updatedUser = await usersService.get(user.id);

      let updatedProvider = null;

      if (isProviderRole && provider) {
        const providerPayload = {
          whatsapp,
          facebook,
          description,
          hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
          city,
        };

        await providersService.update(provider.id, providerPayload);
        updatedProvider = await providersService.get(provider.id);
      } else if (isProviderRole && !provider) {
        const providerPayload = {
          userId: user.id,
          whatsapp,
          facebook,
          description,
          hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
          city,
          isVerified: false,
          isOnline: true,
          totalRatings: 0,
          averageRating: 0,
        };

        const newProviderId = await providersService.create(providerPayload);
        updatedProvider = await providersService.get(newProviderId);
      }

      return { user: updatedUser, provider: updatedProvider };
    },
    onSuccess: (data) => {
      if (data.user) updateUser(data.user);
      if (data.provider) updateProvider(data.provider);
      Alert.alert("Sucesso", "Perfil atualizado com sucesso");
      navigation.goBack();
    },
    onError: (error: any) => {
      Alert.alert("Erro", error.message || "Falha ao atualizar perfil");
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Erro", "Nome é obrigatório");
      return;
    }
    updateMutation.mutate();
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={styles.form}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Informações Pessoais
          </ThemedText>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Ionicons name="person-outline" size={18} color={theme.textSecondary} />
              <ThemedText type="small" style={{ marginLeft: Spacing.xs }}>
                Nome
              </ThemedText>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              placeholder="Seu nome"
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Ionicons name="call-outline" size={18} color={theme.textSecondary} />
              <ThemedText type="small" style={{ marginLeft: Spacing.xs }}>
                Telefone
              </ThemedText>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              placeholder="Seu telefone"
              placeholderTextColor={theme.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Ionicons name="location-outline" size={18} color={theme.textSecondary} />
              <ThemedText type="small" style={{ marginLeft: Spacing.xs }}>
                Cidade
              </ThemedText>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              placeholder="Sua cidade"
              placeholderTextColor={theme.textSecondary}
              value={city}
              onChangeText={setCity}
            />
          </View>

          {isProviderRole && (
            <>
              <ThemedText type="h3" style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
                Informações do Prestador
              </ThemedText>

              <View style={styles.inputGroup}>
                <View style={styles.inputLabel}>
                  <Ionicons name="document-text-outline" size={18} color={theme.textSecondary} />
                  <ThemedText type="small" style={{ marginLeft: Spacing.xs }}>
                    Descrição
                  </ThemedText>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { backgroundColor: theme.backgroundSecondary, color: theme.text },
                  ]}
                  placeholder="Descreva seus serviços"
                  placeholderTextColor={theme.textSecondary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputLabel}>
                  <Ionicons name="cash-outline" size={18} color={theme.textSecondary} />
                  <ThemedText type="small" style={{ marginLeft: Spacing.xs }}>
                    Valor por Hora (Kz)
                  </ThemedText>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                  placeholder="Ex: 5000"
                  placeholderTextColor={theme.textSecondary}
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  keyboardType="numeric"
                />
              </View>

              <ThemedText type="h3" style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
                Contatos
              </ThemedText>

              <View style={styles.inputGroup}>
                <View style={styles.inputLabel}>
                  <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                  <ThemedText type="small" style={{ marginLeft: Spacing.xs }}>
                    WhatsApp
                  </ThemedText>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                  placeholder="Ex: +244 923 456 789"
                  placeholderTextColor={theme.textSecondary}
                  value={whatsapp}
                  onChangeText={setWhatsapp}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputLabel}>
                  <Ionicons name="logo-facebook" size={18} color="#1877F2" />
                  <ThemedText type="small" style={{ marginLeft: Spacing.xs }}>
                    Facebook
                  </ThemedText>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                  placeholder="Link do perfil ou nome de usuário"
                  placeholderTextColor={theme.textSecondary}
                  value={facebook}
                  onChangeText={setFacebook}
                />
              </View>

              <Pressable
                style={[styles.menuItem, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => navigation.navigate("ServiceManagement" as any)}
              >
                <Ionicons name="briefcase-outline" size={22} color={theme.primary} />
                <ThemedText style={styles.menuItemText}>Gerenciar Serviços</ThemedText>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </Pressable>
            </>
          )}

          <Button onPress={handleSave} disabled={updateMutation.isPending} style={styles.saveButton}>
            {updateMutation.isPending ? <ActivityIndicator color="#fff" /> : "Salvar Alterações"}
          </Button>
        </View>
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
  form: {
    gap: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  inputGroup: {},
  inputLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  menuItemText: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: 16,
  },
  saveButton: {
    marginTop: Spacing.xl,
  },
});
