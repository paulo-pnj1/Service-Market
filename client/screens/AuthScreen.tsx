import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState<"client" | "provider">("client");

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Por favor, preencha email e senha");
      return;
    }

    if (!isLogin && !name) {
      Alert.alert("Erro", "Por favor, preencha seu nome");
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        const result = await login(email, password);
        if (!result.success) {
          Alert.alert("Erro", result.error || "Falha no login");
        }
      } else {
        const result = await register({ email, password, name, city, role });
        if (!result.success) {
          Alert.alert("Erro", result.error || "Falha no cadastro");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing.xl },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
          contentFit="contain"
        />
        <ThemedText type="h1" style={styles.title}>
          ServicoJa
        </ThemedText>
        <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
          Encontre os melhores profissionais em Angola
        </ThemedText>
      </View>

      <View style={styles.form}>
        {!isLogin && (
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
            placeholder="Nome completo"
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        )}
        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
          placeholder="Email"
          placeholderTextColor={theme.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
          placeholder="Senha"
          placeholderTextColor={theme.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {!isLogin && (
          <>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              placeholder="Cidade (ex: Luanda)"
              placeholderTextColor={theme.textSecondary}
              value={city}
              onChangeText={setCity}
            />
            <View style={styles.roleContainer}>
              <ThemedText type="small" style={{ marginBottom: Spacing.sm }}>
                Tipo de conta:
              </ThemedText>
              <View style={styles.roleButtons}>
                <Pressable
                  style={[
                    styles.roleButton,
                    { borderColor: role === "client" ? theme.primary : theme.border },
                    role === "client" && { backgroundColor: theme.primary + "20" },
                  ]}
                  onPress={() => setRole("client")}
                >
                  <ThemedText
                    type="small"
                    style={{ color: role === "client" ? theme.primary : theme.text }}
                  >
                    Cliente
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.roleButton,
                    { borderColor: role === "provider" ? theme.primary : theme.border },
                    role === "provider" && { backgroundColor: theme.primary + "20" },
                  ]}
                  onPress={() => setRole("provider")}
                >
                  <ThemedText
                    type="small"
                    style={{ color: role === "provider" ? theme.primary : theme.text }}
                  >
                    Prestador
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </>
        )}

        <Button onPress={handleSubmit} disabled={isLoading} style={styles.submitButton}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : isLogin ? (
            "Entrar"
          ) : (
            "Criar Conta"
          )}
        </Button>

        <Pressable onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {isLogin ? "Nao tem conta? " : "Ja tem conta? "}
            <ThemedText type="small" style={{ color: theme.primary }}>
              {isLogin ? "Cadastre-se" : "Entre"}
            </ThemedText>
          </ThemedText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    flexGrow: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
  },
  form: {
    gap: Spacing.lg,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  roleContainer: {
    marginTop: Spacing.sm,
  },
  roleButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  roleButton: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
  switchButton: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
});
