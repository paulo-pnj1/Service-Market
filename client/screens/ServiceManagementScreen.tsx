
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
import { Ionicons, Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { servicesService, categoriesService } from "@/lib/query-client";
import { ServiceData } from "@/lib/firestore"; // Import para compatibilidade

export default function ServiceManagementScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { provider } = useAuth();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingService, setEditingService] = useState<Partial<ServiceData>>({});
  const [isEditing, setIsEditing] = useState(false);

  const { data: services = [], isLoading } = useQuery<ServiceData[]>({
    queryKey: ["services", provider?.id],
    queryFn: () => servicesService.getByProvider(provider?.id || ""),
    enabled: !!provider?.id,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<ServiceData, "id" | "createdAt">) =>
      servicesService.create({ ...data, providerId: provider?.id || "" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setShowModal(false);
      setEditingService({});
    },
    onError: (error: any) => Alert.alert("Erro", error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ServiceData> }) =>
      servicesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setShowModal(false);
      setEditingService({});
    },
    onError: (error: any) => Alert.alert("Erro", error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => servicesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (error: any) => Alert.alert("Erro", error.message),
  });

  const handleAddService = () => {
    setIsEditing(false);
    setEditingService({ isActive: true });
    setShowModal(true);
  };

  const handleEditService = (service: ServiceData) => {
    setIsEditing(true);
    setEditingService(service);
    setShowModal(true);
  };

  const handleDeleteService = (id: string) => {
    Alert.alert(
      "Confirmar",
      "Tem certeza que deseja excluir este serviço?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => deleteMutation.mutate(id),
        },
      ]
    );
  };

  const handleSave = () => {
    if (!editingService.name || editingService.price == null || !editingService.categoryId) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios");
      return;
    }

    const data: Partial<ServiceData> = {
      name: editingService.name,
      description: editingService.description,
      price: Number(editingService.price),
      duration: editingService.duration ? Number(editingService.duration) : undefined,
      categoryId: editingService.categoryId,
      isActive: editingService.isActive ?? true,
    };

    if (isEditing && editingService.id) {
      updateMutation.mutate({ id: editingService.id, data });
    } else {
      createMutation.mutate(data as Omit<ServiceData, "id" | "createdAt">);
    }
  };

  const selectedCategory = categories.find((cat) => cat.id === editingService.categoryId);

  const renderService = ({ item }: { item: ServiceData }) => {
    const categoryName = categories.find((cat) => cat.id === item.categoryId)?.name || "Sem categoria";

    return (
      <View style={[styles.serviceCard, { backgroundColor: theme.backgroundSecondary }]}>
        <View style={styles.serviceHeader}>
          <ThemedText type="body" style={{ flex: 1 }}>
            {item.name}
          </ThemedText>
          <View style={styles.serviceActions}>
            <Pressable onPress={() => handleEditService(item)}>
              <Ionicons name="pencil" size={20} color={theme.primary} />
            </Pressable>
            <Pressable onPress={() => handleDeleteService(item.id)} style={{ marginLeft: Spacing.md }}>
              <Ionicons name="trash" size={20} color={theme.error} />
            </Pressable>
          </View>
        </View>
        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
          AOA {item.price ?? "N/D"} • {item.duration ?? "N/D"} min
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
          {categoryName}
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={services}
        renderItem={renderService}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + headerHeight + Spacing.lg },
        ]}
        ListHeaderComponent={
          <Button onPress={handleAddService} style={styles.addButton}>
            Adicionar Serviço
          </Button>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <ThemedText type="body" style={styles.emptyText}>
              Nenhum serviço cadastrado
            </ThemedText>
          )
        }
      />

      {/* Modal de edição/criação */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">
                {isEditing ? "Editar Serviço" : "Novo Serviço"}
              </ThemedText>
              <Pressable onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>
            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <ThemedText type="small" style={{ marginBottom: Spacing.xs }}>
                  Nome do Serviço *
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                  value={editingService.name || ""}
                  onChangeText={(text) => setEditingService((prev) => ({ ...prev, name: text }))}
                  placeholder="Ex: Limpeza Residencial"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.inputGroup}>
                <ThemedText type="small" style={{ marginBottom: Spacing.xs }}>
                  Descrição
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { backgroundColor: theme.backgroundSecondary, color: theme.text },
                  ]}
                  value={editingService.description || ""}
                  onChangeText={(text) => setEditingService((prev) => ({ ...prev, description: text }))}
                  placeholder="Descreva o serviço..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                />
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.md }]}>
                  <ThemedText type="small" style={{ marginBottom: Spacing.xs }}>
                    Preço (AOA) *
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                    value={editingService.price?.toString() || ""}
                    onChangeText={(text) => setEditingService((prev) => ({ ...prev, price: Number(text) || undefined }))}
                    placeholder="0"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <ThemedText type="small" style={{ marginBottom: Spacing.xs }}>
                    Duração (min)
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                    value={editingService.duration?.toString() || ""}
                    onChangeText={(text) => setEditingService((prev) => ({ ...prev, duration: Number(text) || undefined }))}
                    placeholder="60"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <ThemedText type="small" style={{ marginBottom: Spacing.xs }}>
                  Categoria *
                </ThemedText>
                <Pressable
                  style={[
                    styles.input,
                    { backgroundColor: theme.backgroundSecondary, justifyContent: "center" },
                  ]}
                  onPress={() => setShowCategoryModal(true)}
                >
                  <ThemedText style={{ color: editingService.categoryId ? theme.text : theme.textSecondary }}>
                    {selectedCategory?.name || "Selecionar categoria"}
                  </ThemedText>
                </Pressable>
              </View>
              <View style={[styles.inputGroup, { flexDirection: "row", alignItems: "center" }]}>
                <ThemedText type="small" style={{ flex: 1 }}>
                  Ativo
                </ThemedText>
                <Pressable
                  onPress={() =>
                    setEditingService((prev) => ({ ...prev, isActive: !prev.isActive }))
                  }
                >
                  <Ionicons
                    name={editingService.isActive ? "checkbox" : "square-outline"}
                    size={24}
                    color={theme.primary}
                  />
                </Pressable>
              </View>
              <Button
                onPress={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                style={styles.saveButton}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  "Salvar"
                )}
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de seleção de categoria */}
      <Modal visible={showCategoryModal} animationType="slide" transparent onRequestClose={() => setShowCategoryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Selecionar Categoria</ThemedText>
              <Pressable onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.sortOption}
                  onPress={() => {
                    setEditingService((prev) => ({ ...prev, categoryId: item.id }));
                    setShowCategoryModal(false);
                  }}
                >
                  <ThemedText type="body">{item.name}</ThemedText>
                  {editingService.categoryId === item.id && (
                    <Feather name="check" size={20} color={theme.primary} />
                  )}
                </Pressable>
              )}
            />
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
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  addButton: {
    marginBottom: Spacing.xl,
  },
  emptyText: {
    textAlign: "center",
    marginVertical: Spacing.xl,
  },
  serviceCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  serviceHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  serviceActions: {
    flexDirection: "row",
    gap: Spacing.sm,
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
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
});


