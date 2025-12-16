import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { initializeCollections, checkFirestoreConnection, seedCategories } from "@/lib/seedFirestore";
import { useTheme } from "@/hooks/useTheme";

interface SetupResult {
  collection: string;
  status: string;
}

export default function AdminSetupScreen() {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [results, setResults] = useState<SetupResult[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const handleCheckConnection = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const result = await checkFirestoreConnection();
      setConnectionStatus(result.connected ? "✅ " + result.message : "❌ " + result.message);
    } catch (error: any) {
      setConnectionStatus("❌ Erro: " + error.message);
    }
    setIsLoading(false);
  };

  const handleInitializeCollections = async () => {
    setIsLoading(true);
    setMessage(null);
    setResults([]);
    try {
      const result = await initializeCollections();
      setResults(result.results);
      setMessage(result.success ? "Inicialização concluída!" : "Erro na inicialização");
    } catch (error: any) {
      setMessage("Erro: " + error.message);
    }
    setIsLoading(false);
  };

  const handleSeedCategories = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const result = await seedCategories();
      setMessage(result.success ? "✅ " + result.message : "❌ " + result.message);
    } catch (error: any) {
      setMessage("❌ Erro: " + error.message);
    }
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>
          Configuração do Firebase
        </Text>
        
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Use esta tela para inicializar as coleções do Firestore
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleCheckConnection}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              Testar Conexão
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleSeedCategories}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              Criar Categorias
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleInitializeCollections}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              Inicializar Todas as Coleções
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading && (
          <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
        )}

        {connectionStatus && (
          <View style={[styles.statusBox, { backgroundColor: theme.backgroundSecondary }]}>
            <Text style={[styles.statusText, { color: theme.text }]}>
              {connectionStatus}
            </Text>
          </View>
        )}

        {message && (
          <View style={[styles.statusBox, { backgroundColor: theme.backgroundSecondary }]}>
            <Text style={[styles.statusText, { color: theme.text }]}>
              {message}
            </Text>
          </View>
        )}

        {results.length > 0 && (
          <View style={[styles.resultsContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <Text style={[styles.resultsTitle, { color: theme.text }]}>
              Resultados:
            </Text>
            {results.map((result, index) => (
              <View key={index} style={styles.resultRow}>
                <Text style={[styles.collectionName, { color: theme.primary }]}>
                  {result.collection}
                </Text>
                <Text style={[styles.collectionStatus, { color: theme.textSecondary }]}>
                  {result.status}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={[styles.infoTitle, { color: theme.text }]}>
            Importante:
          </Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            1. Habilite Email/Senha no Firebase Console → Authentication → Sign-in method
          </Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            2. Configure as regras do Firestore para permitir leitura/escrita durante desenvolvimento
          </Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            3. Exemplo de regras para dev:{"\n"}
            {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loader: {
    marginVertical: 20,
  },
  statusBox: {
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  statusText: {
    fontSize: 14,
  },
  resultsContainer: {
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  resultRow: {
    marginBottom: 8,
  },
  collectionName: {
    fontSize: 14,
    fontWeight: "600",
  },
  collectionStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  infoBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "rgba(255, 152, 0, 0.1)",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ff9800",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 18,
  },
});
