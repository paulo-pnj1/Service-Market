import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDocs,
  Timestamp 
} from "./firebase";

const COLLECTIONS = {
  USERS: "users",
  PROVIDERS: "providers",
  CATEGORIES: "categories",
  SERVICES: "services",
  REVIEWS: "reviews",
  CONVERSATIONS: "conversations",
  MESSAGES: "messages",
  FAVORITES: "favorites",
  SERVICE_ORDERS: "service_orders",
};

const initialCategories = [
  { id: "cat_1", name: "Limpeza", icon: "🧹", description: "Serviços de limpeza residencial e comercial" },
  { id: "cat_2", name: "Eletricista", icon: "⚡", description: "Instalações e reparos elétricos" },
  { id: "cat_3", name: "Encanador", icon: "🔧", description: "Serviços de encanamento e hidráulica" },
  { id: "cat_4", name: "Pintor", icon: "🎨", description: "Pintura residencial e comercial" },
  { id: "cat_5", name: "Carpinteiro", icon: "🪚", description: "Móveis e estruturas de madeira" },
  { id: "cat_6", name: "Mecânico", icon: "🚗", description: "Reparos e manutenção de veículos" },
  { id: "cat_7", name: "Jardineiro", icon: "🌱", description: "Cuidados com jardins e paisagismo" },
  { id: "cat_8", name: "Cozinheiro", icon: "👨‍🍳", description: "Serviços de culinária e eventos" },
  { id: "cat_9", name: "Técnico de Informática", icon: "💻", description: "Reparos e suporte técnico" },
  { id: "cat_10", name: "Pedreiro", icon: "🧱", description: "Construção e reformas" },
];

export async function seedCategories(): Promise<{ success: boolean; message: string; created: number }> {
  try {
    const categoriesRef = collection(db, COLLECTIONS.CATEGORIES);
    const snapshot = await getDocs(categoriesRef);
    
    if (!snapshot.empty) {
      return { 
        success: true, 
        message: `Categorias já existem (${snapshot.size} encontradas)`, 
        created: 0 
      };
    }

    let created = 0;
    for (const category of initialCategories) {
      await setDoc(doc(db, COLLECTIONS.CATEGORIES, category.id), {
        name: category.name,
        icon: category.icon,
        description: category.description,
      });
      created++;
    }

    return { 
      success: true, 
      message: `${created} categorias criadas com sucesso`, 
      created 
    };
  } catch (error: any) {
    console.error("Erro ao criar categorias:", error);
    return { 
      success: false, 
      message: `Erro: ${error.message || "Falha ao criar categorias"}`, 
      created: 0 
    };
  }
}

export async function initializeCollections(): Promise<{ 
  success: boolean; 
  results: { collection: string; status: string }[] 
}> {
  const results: { collection: string; status: string }[] = [];

  try {
    const categoriesResult = await seedCategories();
    results.push({ 
      collection: "categories", 
      status: categoriesResult.message 
    });

    const collectionsToCheck = [
      COLLECTIONS.USERS,
      COLLECTIONS.PROVIDERS,
      COLLECTIONS.SERVICES,
      COLLECTIONS.REVIEWS,
      COLLECTIONS.CONVERSATIONS,
      COLLECTIONS.MESSAGES,
      COLLECTIONS.FAVORITES,
      COLLECTIONS.SERVICE_ORDERS,
    ];

    for (const collName of collectionsToCheck) {
      try {
        const collRef = collection(db, collName);
        const snapshot = await getDocs(collRef);
        results.push({ 
          collection: collName, 
          status: `Pronta (${snapshot.size} documentos)` 
        });
      } catch (error: any) {
        results.push({ 
          collection: collName, 
          status: `Erro: ${error.message}` 
        });
      }
    }

    return { success: true, results };
  } catch (error: any) {
    console.error("Erro ao inicializar coleções:", error);
    return { 
      success: false, 
      results: [{ collection: "all", status: `Erro geral: ${error.message}` }] 
    };
  }
}

export async function checkFirestoreConnection(): Promise<{ 
  connected: boolean; 
  message: string 
}> {
  try {
    const testRef = collection(db, COLLECTIONS.CATEGORIES);
    await getDocs(testRef);
    return { connected: true, message: "Conexão com Firestore OK" };
  } catch (error: any) {
    console.error("Erro de conexão Firestore:", error);
    return { 
      connected: false, 
      message: `Erro de conexão: ${error.message}` 
    };
  }
}
