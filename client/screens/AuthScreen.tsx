import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, ScrollView, Alert, ActivityIndicator, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type AuthMode = "login" | "register" | "phone";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { login, register, forgotPassword } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState<"client" | "provider">("client");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Por favor, preencha email e senha");
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        Alert.alert("Erro", result.error || "Falha no login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailRegister = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Por favor, preencha email e senha");
      return;
    }
    if (!name) {
      Alert.alert("Erro", "Por favor, preencha seu nome");
      return;
    }

    setIsLoading(true);
    try {
      const result = await register({ email, password, name, phone, city, role });
      if (!result.success) {
        Alert.alert("Erro", result.error || "Falha no cadastro");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (authMode === "login") {
      handleEmailLogin();
    } else if (authMode === "register") {
      handleEmailRegister();
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      Alert.alert("Erro", "Por favor, insira seu email");
      return;
    }
    setForgotLoading(true);
    const result = await forgotPassword(forgotEmail.trim());
    setForgotLoading(false);
    if (result.success) {
      Alert.alert("Sucesso", result.message || "Email de recuperacao enviado!");
      setShowForgotPassword(false);
      setForgotEmail("");
    } else {
      Alert.alert("Erro", result.error || "Erro ao solicitar recuperacao");
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

      <View style={styles.authModeContainer}>
        <Pressable
          style={[
            styles.authModeButton,
            authMode === "login" && { backgroundColor: theme.primary + "20", borderColor: theme.primary },
          ]}
          onPress={() => setAuthMode("login")}
        >
          <Ionicons 
            name="mail" 
            size={20} 
            color={authMode === "login" ? theme.primary : theme.textSecondary} 
          />
          <ThemedText 
            type="small" 
            style={{ color: authMode === "login" ? theme.primary : theme.textSecondary, marginLeft: Spacing.xs }}
          >
            Email
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.authModeButton,
            authMode === "phone" && { backgroundColor: theme.primary + "20", borderColor: theme.primary },
          ]}
          onPress={() => {
            Alert.alert(
              "Em breve", 
              "Autenticacao por telefone sera disponibilizada em breve. Por enquanto, use email."
            );
          }}
        >
          <Ionicons 
            name="call" 
            size={20} 
            color={authMode === "phone" ? theme.primary : theme.textSecondary} 
          />
          <ThemedText 
            type="small" 
            style={{ color: authMode === "phone" ? theme.primary : theme.textSecondary, marginLeft: Spacing.xs }}
          >
            Telefone
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.form}>
        {authMode === "register" && (
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

        {authMode === "register" && (
          <>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              placeholder="Telefone (opcional)"
              placeholderTextColor={theme.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
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
          ) : authMode === "login" ? (
            "Entrar"
          ) : (
            "Criar Conta"
          )}
        </Button>

        {authMode === "login" && (
          <Pressable onPress={() => setShowForgotPassword(true)} style={styles.forgotButton}>
            <ThemedText type="small" style={{ color: theme.primary }}>
              Esqueceu sua senha?
            </ThemedText>
          </Pressable>
        )}

        <Pressable 
          onPress={() => setAuthMode(authMode === "login" ? "register" : "login")} 
          style={styles.switchButton}
        >
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {authMode === "login" ? "Nao tem conta? " : "Ja tem conta? "}
            <ThemedText type="small" style={{ color: theme.primary }}>
              {authMode === "login" ? "Cadastre-se" : "Entre"}
            </ThemedText>
          </ThemedText>
        </Pressable>

        <Pressable 
          onPress={() => navigation.navigate("AdminSetup")} 
          style={styles.adminButton}
        >
          <Ionicons name="settings-outline" size={16} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs, fontSize: 12 }}>
            Configuração Firebase
          </ThemedText>
        </Pressable>
      </View>

      <Modal visible={showForgotPassword} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Recuperar Senha</ThemedText>
              <Pressable onPress={() => setShowForgotPassword(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.modalForm}>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
                Insira seu email para receber o link de recuperacao
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
                onPress={handleForgotPassword}
                disabled={forgotLoading}
                style={{ marginTop: Spacing.lg }}
              >
                {forgotLoading ? <ActivityIndicator color="#fff" /> : "Enviar Link"}
              </Button>
            </View>
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
    marginBottom: Spacing.xl,
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
  authModeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  authModeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "transparent",
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
  adminButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    marginTop: Spacing.xl,
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
