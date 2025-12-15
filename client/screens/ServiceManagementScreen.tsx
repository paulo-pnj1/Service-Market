import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Pressable,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface Service {
  id: string;
  name: string;
  description?: string;
  price: string;
  duration?: number;
  isActive: boolean;
}

export default function ServiceManagementScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { provider } = useAuth();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["provider-services", provider?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/providers/${provider?.id}/services`);
      return res.json();
    },
    enabled: !!provider?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/providers/${provider?.id}/services`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-services"] });
      closeModal();
      Alert.alert("Sucesso", "Servico criado com sucesso");
    },
    onError: (error: any) => {
      Alert.alert("Erro", error.message || "Falha ao criar servico");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/services/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-services"] });
      closeModal();
      Alert.alert("Sucesso", "Servico atualizado com sucesso");
    },
    onError: (error: any) => {
      Alert.alert("Erro", error.message || "Falha ao atualizar servico");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-services"] });
      Alert.alert("Sucesso", "Servico removido com sucesso");
    },
    onError: (error: any) => {
      Alert.alert("Erro", error.message || "Falha ao remover servico");
    },
  });

  const openModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setName(service.name);
      setDescription(service.description || "");
      setPrice(service.price);
      setDuration(service.duration?.toString() || "");
    } else {
      setEditingService(null);
      setName("");
      setDescription("");
      setPrice("");
      setDuration("");
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingService(null);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Erro", "Nome do servico e obrigatorio");
      return;
    }
    if (!price.trim()) {
      Alert.alert("Erro", "Preco e obrigatorio");
      return;
    }

    const serviceData = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: price.trim(),
      duration: duration ? parseInt(duration) : undefined,
    };

    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data: serviceData });
    } else {
      createMutation.mutate(serviceData);
    }
  };

  const handleDelete = (service: Service) => {
    Alert.alert("Confirmar", `Deseja remover o servico "${service.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: () => deleteMutation.mutate(service.id) },
    ]);
  };

  const renderService = ({ item }: { item: Service }) => (
    <View style={[styles.serviceCard, { backgroundColor: theme.backgroundSecondary }]}>
      <View style={styles.serviceInfo}>
        <ThemedText type="body" style={[styles.serviceName, { fontWeight: "600" }]}>
          {item.name}
        </ThemedText>
        {item.description && (
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {item.description}
          </ThemedText>
        )}
        <View style={styles.serviceDetails}>
          <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>
            {item.price} Kz
          </ThemedText>
          {item.duration && (
            <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.md }}>
              {item.duration} min
            </ThemedText>
          )}
        </View>
      </View>
      <View style={styles.serviceActions}>
        <Pressable style={styles.actionButton} onPress={() => openModal(item)}>
          <Ionicons name="pencil" size={20} color={theme.primary} />
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => handleDelete(item)}>
          <Ionicons name="trash" size={20} color="#E74C3C" />
        </Pressable>
      </View>
    </View>
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={renderService}
        contentContainerStyle={[
          styles.list,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + 100 },
        ]}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={64} color={theme.textSecondary} />
              <ThemedText type="body" style={{ textAlign: "center", marginTop: Spacing.lg, fontWeight: "600" }}>
                Nenhum servico cadastrado
              </ThemedText>
              <ThemedText
                type="small"
                style={{ textAlign: "center", color: theme.textSecondary, marginTop: Spacing.sm }}
              >
                Adicione servicos para que clientes possam encontra-lo
              </ThemedText>
            </View>
          )
        }
      />

      <View style={[styles.fabContainer, { bottom: insets.bottom + Spacing.xl }]}>
        <Pressable style={[styles.fab, { backgroundColor: theme.primary }]} onPress={() => openModal()}>
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">
                {editingService ? "Editar Servico" : "Novo Servico"}
              </ThemedText>
              <Pressable onPress={closeModal}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <ThemedText type="small" style={{ marginBottom: Spacing.xs }}>
                  Nome do Servico *
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                  placeholder="Ex: Limpeza Residencial"
                  placeholderTextColor={theme.textSecondary}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="small" style={{ marginBottom: Spacing.xs }}>
                  Descricao
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { backgroundColor: theme.backgroundSecondary, color: theme.text },
                  ]}
                  placeholder="Descreva o servico"
                  placeholderTextColor={theme.textSecondary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <ThemedText type="small" style={{ marginBottom: Spacing.xs }}>
                    Preco (Kz) *
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                    placeholder="5000"
                    placeholderTextColor={theme.textSecondary}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: Spacing.md }]}>
                  <ThemedText type="small" style={{ marginBottom: Spacing.xs }}>
                    Duracao (min)
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                    placeholder="60"
                    placeholderTextColor={theme.textSecondary}
                    value={duration}
                    onChangeText={setDuration}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Button onPress={handleSave} disabled={isPending} style={styles.saveButton}>
                {isPending ? <ActivityIndicator color="#fff" /> : "Salvar"}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  loader: {
    marginTop: Spacing["3xl"],
  },
  emptyState: {
    alignItems: "center",
    marginTop: Spacing["3xl"],
    paddingHorizontal: Spacing.xl,
  },
  serviceCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    marginBottom: Spacing.xs,
  },
  serviceDetails: {
    flexDirection: "row",
    marginTop: Spacing.sm,
  },
  serviceActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  fabContainer: {
    position: "absolute",
    right: Spacing.xl,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalForm: {
    gap: Spacing.lg,
  },
  inputGroup: {},
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
  },
  saveButton: {
    marginTop: Spacing.lg,
  },
});
