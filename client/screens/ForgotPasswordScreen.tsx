import React, { useState } from "react";
import { View, StyleSheet, TextInput, Alert, ActivityIndicator, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { forgotPassword, resetPassword } = useAuth();

  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Erro", "Por favor, insira seu email");
      return;
    }

    setIsLoading(true);
    try {
      const result = await forgotPassword(email.trim());
      if (result.success) {
        setMessage(result.message || "Verifique seu email para obter o codigo de recuperacao");
        setStep("reset");
      } else {
        Alert.alert("Erro", result.error || "Erro ao solicitar recuperacao de senha");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!token.trim()) {
      Alert.alert("Erro", "Por favor, insira o codigo de recuperacao");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Erro", "As senhas nao coincidem");
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword(token.trim(), newPassword);
      if (result.success) {
        Alert.alert("Sucesso", "Senha redefinida com sucesso! Faca login com sua nova senha.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert("Erro", result.error || "Erro ao redefinir senha");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>

        <View style={styles.header}>
          <Ionicons name="lock-closed-outline" size={64} color={theme.primary} />
          <ThemedText type="h2" style={styles.title}>
            {step === "email" ? "Recuperar Senha" : "Nova Senha"}
          </ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            {step === "email"
              ? "Insira seu email para receber o codigo de recuperacao"
              : message || "Insira o codigo recebido e sua nova senha"}
          </ThemedText>
        </View>

        {step === "email" ? (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <ThemedText type="small" style={{ marginBottom: Spacing.xs }}>
                Email
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                placeholder="seu@email.com"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Button onPress={handleForgotPassword} disabled={isLoading} style={styles.button}>
              {isLoading ? <ActivityIndicator color="#fff" /> : "Enviar Codigo"}
            </Button>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <ThemedText type="small" style={{ marginBottom: Spacing.xs }}>
                Codigo de Recuperacao
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                placeholder="Codigo recebido por email"
                placeholderTextColor={theme.textSecondary}
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={{ marginBottom: Spacing.xs }}>
                Nova Senha
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                placeholder="Minimo 6 caracteres"
                placeholderTextColor={theme.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={{ marginBottom: Spacing.xs }}>
                Confirmar Senha
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                placeholder="Repita a nova senha"
                placeholderTextColor={theme.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <Button onPress={handleResetPassword} disabled={isLoading} style={styles.button}>
              {isLoading ? <ActivityIndicator color="#fff" /> : "Redefinir Senha"}
            </Button>

            <Pressable style={styles.resendButton} onPress={() => setStep("email")}>
              <ThemedText type="small" style={{ color: theme.primary }}>
                Nao recebeu o codigo? Enviar novamente
              </ThemedText>
            </Pressable>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  backButton: {
    marginBottom: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  title: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {},
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  button: {
    marginTop: Spacing.lg,
  },
  resendButton: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
});
