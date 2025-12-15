import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, ScrollView, Alert, ActivityIndicator, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { login, register, forgotPassword, resetPassword } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState<"client" | "provider">("client");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotStep, setForgotStep] = useState<"email" | "reset">("email");
  const [forgotLoading, setForgotLoading] = useState(false);

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

        {isLogin && (
          <Pressable onPress={() => setShowForgotPassword(true)} style={styles.forgotButton}>
            <ThemedText type="small" style={{ color: theme.primary }}>
              Esqueceu sua senha?
            </ThemedText>
          </Pressable>
        )}

        <Pressable onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {isLogin ? "Nao tem conta? " : "Ja tem conta? "}
            <ThemedText type="small" style={{ color: theme.primary }}>
              {isLogin ? "Cadastre-se" : "Entre"}
            </ThemedText>
          </ThemedText>
        </Pressable>
      </View>

      <Modal visible={showForgotPassword} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">
                {forgotStep === "email" ? "Recuperar Senha" : "Nova Senha"}
              </ThemedText>
              <Pressable onPress={() => { setShowForgotPassword(false); setForgotStep("email"); }}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            {forgotStep === "email" ? (
              <View style={styles.modalForm}>
                <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
                  Insira seu email para receber o codigo de recuperacao
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text }]}
                  placeholder="seu@email.com"
                  placeholderTextColor={theme.textSecondary}
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Button
                  onPress={async () => {
                    if (!forgotEmail.trim()) {
                      Alert.alert("Erro", "Por favor, insira seu email");
                      return;
                    }
                    setForgotLoading(true);
                    const result = await forgotPassword(forgotEmail.trim());
                    setForgotLoading(false);
                    if (result.success) {
                      Alert.alert("Sucesso", result.message || "Codigo enviado para seu email");
                      setForgotStep("reset");
                    } else {
                      Alert.alert("Erro", result.error || "Erro ao solicitar recuperacao");
                    }
                  }}
                  disabled={forgotLoading}
                  style={{ marginTop: Spacing.lg }}
                >
                  {forgotLoading ? <ActivityIndicator color="#fff" /> : "Enviar Codigo"}
                </Button>
              </View>
            ) : (
              <View style={styles.modalForm}>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text }]}
                  placeholder="Codigo de recuperacao"
                  placeholderTextColor={theme.textSecondary}
                  value={resetToken}
                  onChangeText={setResetToken}
                  autoCapitalize="none"
                />
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text, marginTop: Spacing.md }]}
                  placeholder="Nova senha (min. 6 caracteres)"
                  placeholderTextColor={theme.textSecondary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text, marginTop: Spacing.md }]}
                  placeholder="Confirmar senha"
                  placeholderTextColor={theme.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
                <Button
                  onPress={async () => {
                    if (!resetToken.trim()) {
                      Alert.alert("Erro", "Por favor, insira o codigo");
                      return;
                    }
                    if (!newPassword || newPassword.length < 6) {
                      Alert.alert("Erro", "Senha deve ter pelo menos 6 caracteres");
                      return;
                    }
                    if (newPassword !== confirmPassword) {
                      Alert.alert("Erro", "Senhas nao coincidem");
                      return;
                    }
                    setForgotLoading(true);
                    const result = await resetPassword(resetToken.trim(), newPassword);
                    setForgotLoading(false);
                    if (result.success) {
                      Alert.alert("Sucesso", "Senha redefinida! Faca login.");
                      setShowForgotPassword(false);
                      setForgotStep("email");
                      setForgotEmail("");
                      setResetToken("");
                      setNewPassword("");
                      setConfirmPassword("");
                    } else {
                      Alert.alert("Erro", result.error || "Erro ao redefinir senha");
                    }
                  }}
                  disabled={forgotLoading}
                  style={{ marginTop: Spacing.lg }}
                >
                  {forgotLoading ? <ActivityIndicator color="#fff" /> : "Redefinir Senha"}
                </Button>
                <Pressable onPress={() => setForgotStep("email")} style={{ alignItems: "center", marginTop: Spacing.md }}>
                  <ThemedText type="small" style={{ color: theme.primary }}>
                    Enviar novo codigo
                  </ThemedText>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  forgotButton: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  switchButton: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalForm: {},
});
