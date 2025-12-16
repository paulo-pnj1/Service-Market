import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  addDoc,
  onSnapshot
} from "./firebase";

export interface UserData {
  id: string;
  email: string;
  name: string;
  phone?: string;
  city?: string;
  photoUrl?: string;
  role: "client" | "provider";
  createdAt: Date;
}

export interface ProviderData {
  id: string;
  userId: string;
  description?: string;
  hourlyRate?: number;
  city: string;
  whatsapp?: string;
  facebook?: string;
  isVerified: boolean;
  isOnline: boolean;
  totalRatings: number;
  averageRating: number;
  createdAt: Date;
  categories?: string[];
}

export interface CategoryData {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface ServiceData {
  id: string;
  providerId: string;
  categoryId?: string;
  name: string;
  description?: string;
  price?: number;
  duration?: number;
  photoUrl?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface ReviewData {
  id: string;
  providerId: string;
  clientId: string;
  orderId?: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface ConversationData {
  id: string;
  clientId: string;
  providerId: string;
  lastMessageAt: Date;
  createdAt: Date;
}

export interface MessageData {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

export interface FavoriteData {
  id: string;
  userId: string;
  providerId: string;
  createdAt: Date;
}

export interface ServiceOrderData {
  id: string;
  clientId: string;
  providerId: string;
  serviceId?: string;
  status: string;
  scheduledDate?: Date;
  completedDate?: Date;
  price?: number;
  notes?: string;
  clientNotes?: string;
  providerNotes?: string;
  createdAt: Date;
}

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

export const usersService = {
  async create(userId: string, data: Omit<UserData, "id" | "createdAt">) {
    const userData = { ...data, createdAt: Timestamp.now() };
    await setDoc(doc(db, COLLECTIONS.USERS, userId), userData);
    return { id: userId, ...userData, createdAt: new Date() };
  },
  async get(userId: string): Promise<UserData | null> {
    const docSnap = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return { 
      id: docSnap.id, 
      ...data, 
      createdAt: data.createdAt?.toDate() || new Date() 
    } as UserData;
  },
  async update(userId: string, data: Partial<UserData>) {
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), data);
  },
  async getByEmail(email: string): Promise<UserData | null> {
    const q = query(collection(db, COLLECTIONS.USERS), where("email", "==", email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    return { 
      id: docSnap.id, 
      ...data, 
      createdAt: data.createdAt?.toDate() || new Date() 
    } as UserData;
  },
};

export const providersService = {
  async create(data: Omit<ProviderData, "id" | "createdAt">) {
    const providerData = { ...data, createdAt: Timestamp.now() };
    const docRef = await addDoc(collection(db, COLLECTIONS.PROVIDERS), providerData);
    return { id: docRef.id, ...data, createdAt: new Date() };
  },
  async get(providerId: string): Promise<ProviderData | null> {
    const docSnap = await getDoc(doc(db, COLLECTIONS.PROVIDERS, providerId));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return { 
      id: docSnap.id, 
      ...data, 
      createdAt: data.createdAt?.toDate() || new Date() 
    } as ProviderData;
  },
  async getByUserId(userId: string): Promise<ProviderData | null> {
    const q = query(collection(db, COLLECTIONS.PROVIDERS), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    return { 
      id: docSnap.id, 
      ...data, 
      createdAt: data.createdAt?.toDate() || new Date() 
    } as ProviderData;
  },
  async getAll(filters?: { city?: string; categoryId?: string }): Promise<ProviderData[]> {
    let q = query(collection(db, COLLECTIONS.PROVIDERS), orderBy("averageRating", "desc"));
    if (filters?.city) {
      q = query(collection(db, COLLECTIONS.PROVIDERS), where("city", "==", filters.city), orderBy("averageRating", "desc"));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        ...data, 
        createdAt: data.createdAt?.toDate() || new Date() 
      } as ProviderData;
    });
  },
  async update(providerId: string, data: Partial<ProviderData>) {
    await updateDoc(doc(db, COLLECTIONS.PROVIDERS, providerId), data);
  },
  async search(searchTerm: string): Promise<ProviderData[]> {
    const q = query(collection(db, COLLECTIONS.PROVIDERS));
    const snapshot = await getDocs(q);
    const term = searchTerm.toLowerCase();
    return snapshot.docs
      .map(docSnap => {
        const data = docSnap.data();
        return { 
          id: docSnap.id, 
          ...data, 
          createdAt: data.createdAt?.toDate() || new Date() 
        } as ProviderData;
      })
      .filter(p => p.description?.toLowerCase().includes(term) || p.city.toLowerCase().includes(term));
  },
};

export const categoriesService = {
  async getAll(): Promise<CategoryData[]> {
    const snapshot = await getDocs(collection(db, COLLECTIONS.CATEGORIES));
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as CategoryData));
  },
  async get(categoryId: string): Promise<CategoryData | null> {
    const docSnap = await getDoc(doc(db, COLLECTIONS.CATEGORIES, categoryId));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as CategoryData;
  },
  async create(data: Omit<CategoryData, "id">) {
    const docRef = await addDoc(collection(db, COLLECTIONS.CATEGORIES), data);
    return { id: docRef.id, ...data };
  },
};

export const servicesService = {
  async get(serviceId: string): Promise<ServiceData | null> {
    const docSnap = await getDoc(doc(db, COLLECTIONS.SERVICES, serviceId));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return { 
      id: docSnap.id, 
      ...data, 
      createdAt: data.createdAt?.toDate() || new Date() 
    } as ServiceData;
  },
  async getByProvider(providerId: string): Promise<ServiceData[]> {
    const q = query(collection(db, COLLECTIONS.SERVICES), where("providerId", "==", providerId), where("isActive", "==", true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        ...data, 
        createdAt: data.createdAt?.toDate() || new Date() 
      } as ServiceData;
    });
  },
  async create(data: Omit<ServiceData, "id" | "createdAt">) {
    const serviceData = { ...data, createdAt: Timestamp.now() };
    const docRef = await addDoc(collection(db, COLLECTIONS.SERVICES), serviceData);
    return { id: docRef.id, ...data, createdAt: new Date() };
  },
  async update(serviceId: string, data: Partial<ServiceData>) {
    await updateDoc(doc(db, COLLECTIONS.SERVICES, serviceId), data);
  },
  async delete(serviceId: string) {
    await deleteDoc(doc(db, COLLECTIONS.SERVICES, serviceId));
  },
};

export const reviewsService = {
  async getByProvider(providerId: string): Promise<ReviewData[]> {
    const q = query(
      collection(db, COLLECTIONS.REVIEWS), 
      where("providerId", "==", providerId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        ...data, 
        createdAt: data.createdAt?.toDate() || new Date() 
      } as ReviewData;
    });
  },
  async create(data: Omit<ReviewData, "id" | "createdAt">) {
    const reviewData = { ...data, createdAt: Timestamp.now() };
    const docRef = await addDoc(collection(db, COLLECTIONS.REVIEWS), reviewData);
    return { id: docRef.id, ...data, createdAt: new Date() };
  },
};

export const conversationsService = {
  async getByUser(userId: string): Promise<ConversationData[]> {
    const clientQuery = query(collection(db, COLLECTIONS.CONVERSATIONS), where("clientId", "==", userId));
    const clientSnapshot = await getDocs(clientQuery);
    const clientConvos = clientSnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        ...data, 
        lastMessageAt: data.lastMessageAt?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date() 
      } as ConversationData;
    });
    return clientConvos.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  },
  async getOrCreate(clientId: string, providerId: string): Promise<ConversationData> {
    const q = query(
      collection(db, COLLECTIONS.CONVERSATIONS), 
      where("clientId", "==", clientId),
      where("providerId", "==", providerId)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        ...data, 
        lastMessageAt: data.lastMessageAt?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date() 
      } as ConversationData;
    }
    const now = Timestamp.now();
    const conversationData = { clientId, providerId, lastMessageAt: now, createdAt: now };
    const docRef = await addDoc(collection(db, COLLECTIONS.CONVERSATIONS), conversationData);
    return { id: docRef.id, clientId, providerId, lastMessageAt: new Date(), createdAt: new Date() };
  },
  async updateLastMessage(conversationId: string) {
    await updateDoc(doc(db, COLLECTIONS.CONVERSATIONS, conversationId), { lastMessageAt: Timestamp.now() });
  },
};

export const messagesService = {
  async getByConversation(conversationId: string): Promise<MessageData[]> {
    const q = query(
      collection(db, COLLECTIONS.MESSAGES), 
      where("conversationId", "==", conversationId),
      orderBy("createdAt", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        ...data, 
        createdAt: data.createdAt?.toDate() || new Date() 
      } as MessageData;
    });
  },
  async create(data: Omit<MessageData, "id" | "createdAt">) {
    const messageData = { ...data, createdAt: Timestamp.now() };
    const docRef = await addDoc(collection(db, COLLECTIONS.MESSAGES), messageData);
    await conversationsService.updateLastMessage(data.conversationId);
    return { id: docRef.id, ...data, createdAt: new Date() };
  },
  async markAsRead(messageId: string) {
    await updateDoc(doc(db, COLLECTIONS.MESSAGES, messageId), { isRead: true });
  },
  subscribeToConversation(conversationId: string, callback: (messages: MessageData[]) => void) {
    const q = query(
      collection(db, COLLECTIONS.MESSAGES), 
      where("conversationId", "==", conversationId),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return { 
          id: docSnap.id, 
          ...data, 
          createdAt: data.createdAt?.toDate() || new Date() 
        } as MessageData;
      });
      callback(messages);
    });
  },
};

export const favoritesService = {
  async getByUser(userId: string): Promise<FavoriteData[]> {
    const q = query(collection(db, COLLECTIONS.FAVORITES), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        ...data, 
        createdAt: data.createdAt?.toDate() || new Date() 
      } as FavoriteData;
    });
  },
  async add(userId: string, providerId: string) {
    const favoriteData = { userId, providerId, createdAt: Timestamp.now() };
    const docRef = await addDoc(collection(db, COLLECTIONS.FAVORITES), favoriteData);
    return { id: docRef.id, userId, providerId, createdAt: new Date() };
  },
  async remove(userId: string, providerId: string) {
    const q = query(
      collection(db, COLLECTIONS.FAVORITES), 
      where("userId", "==", userId),
      where("providerId", "==", providerId)
    );
    const snapshot = await getDocs(q);
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, COLLECTIONS.FAVORITES, docSnap.id));
    }
  },
  async isFavorite(userId: string, providerId: string): Promise<boolean> {
    const q = query(
      collection(db, COLLECTIONS.FAVORITES), 
      where("userId", "==", userId),
      where("providerId", "==", providerId)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  },
};

export const serviceOrdersService = {
  async getByClient(clientId: string): Promise<ServiceOrderData[]> {
    const q = query(
      collection(db, COLLECTIONS.SERVICE_ORDERS), 
      where("clientId", "==", clientId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        ...data, 
        scheduledDate: data.scheduledDate?.toDate(),
        completedDate: data.completedDate?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date() 
      } as ServiceOrderData;
    });
  },
  async getByProvider(providerId: string): Promise<ServiceOrderData[]> {
    const q = query(
      collection(db, COLLECTIONS.SERVICE_ORDERS), 
      where("providerId", "==", providerId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        ...data, 
        scheduledDate: data.scheduledDate?.toDate(),
        completedDate: data.completedDate?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date() 
      } as ServiceOrderData;
    });
  },
  async create(data: Omit<ServiceOrderData, "id" | "createdAt">) {
    const orderData = { ...data, createdAt: Timestamp.now() };
    const docRef = await addDoc(collection(db, COLLECTIONS.SERVICE_ORDERS), orderData);
    return { id: docRef.id, ...data, createdAt: new Date() };
  },
  async updateStatus(orderId: string, status: string) {
    await updateDoc(doc(db, COLLECTIONS.SERVICE_ORDERS, orderId), { status });
  },
};
