import { 
  users, providers, categories, providerCategories, services, reviews, 
  conversations, messages, favorites, serviceOrders,
  type User, type InsertUser, type Provider, type InsertProvider,
  type Category, type InsertCategory, type Service, type InsertService,
  type Review, type InsertReview, type Conversation, type InsertConversation,
  type Message, type InsertMessage, type Favorite, type InsertFavorite,
  type ServiceOrder, type InsertServiceOrder
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, ilike, gte, lte, sql, ne } from "drizzle-orm";

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;

  getProvider(id: string): Promise<Provider | undefined>;
  getProviderByUserId(userId: string): Promise<Provider | undefined>;
  createProvider(provider: InsertProvider): Promise<Provider>;
  updateProvider(id: string, data: Partial<InsertProvider>): Promise<Provider | undefined>;
  getProviders(filters?: {
    categoryId?: string;
    city?: string;
    minRating?: number;
    maxPrice?: number;
    search?: string;
  }, pagination?: PaginationOptions): Promise<{ providers: (Provider & { user: User; categories: Category[] })[]; total: number; page: number; totalPages: number }>;
  getProviderWithDetails(id: string): Promise<(Provider & { user: User; categories: Category[]; services: Service[]; reviews: (Review & { client: User })[] }) | undefined>;
  updateProviderOnlineStatus(providerId: string, isOnline: boolean): Promise<void>;

  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  addProviderCategory(providerId: string, categoryId: string): Promise<void>;
  removeProviderCategory(providerId: string, categoryId: string): Promise<void>;
  getProviderCategories(providerId: string): Promise<Category[]>;

  getServices(providerId: string): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, data: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string): Promise<void>;

  getReviews(providerId: string): Promise<(Review & { client: User })[]>;
  createReview(review: InsertReview): Promise<Review>;
  canUserReviewProvider(clientId: string, providerId: string): Promise<boolean>;

  getServiceOrders(userId: string, role: 'client' | 'provider'): Promise<(ServiceOrder & { 
    client: User; 
    provider: Provider & { user: User }; 
    service?: Service;
    review?: Review;
  })[]>;
  getServiceOrder(id: string): Promise<ServiceOrder | undefined>;
  createServiceOrder(order: InsertServiceOrder): Promise<ServiceOrder>;
  updateServiceOrder(id: string, data: Partial<InsertServiceOrder>): Promise<ServiceOrder | undefined>;

  getConversations(userId: string): Promise<(Conversation & { 
    client: User; 
    provider: Provider & { user: User };
    lastMessage?: Message;
    unreadCount?: number;
  })[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getOrCreateConversation(clientId: string, providerId: string): Promise<Conversation>;
  
  getMessages(conversationId: string, pagination?: PaginationOptions): Promise<{ messages: (Message & { sender: User })[]; total: number }>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;

  getFavorites(userId: string): Promise<(Favorite & { provider: Provider & { user: User } })[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, providerId: string): Promise<void>;
  isFavorite(userId: string, providerId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetToken, token));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getProvider(id: string): Promise<Provider | undefined> {
    const [provider] = await db.select().from(providers).where(eq(providers.id, id));
    return provider || undefined;
  }

  async getProviderByUserId(userId: string): Promise<Provider | undefined> {
    const [provider] = await db.select().from(providers).where(eq(providers.userId, userId));
    return provider || undefined;
  }

  async createProvider(insertProvider: InsertProvider): Promise<Provider> {
    const [provider] = await db.insert(providers).values(insertProvider).returning();
    return provider;
  }

  async updateProvider(id: string, data: Partial<InsertProvider>): Promise<Provider | undefined> {
    const [provider] = await db.update(providers).set(data).where(eq(providers.id, id)).returning();
    return provider || undefined;
  }

  async updateProviderOnlineStatus(providerId: string, isOnline: boolean): Promise<void> {
    await db.update(providers).set({ 
      isOnline, 
      lastSeenAt: new Date() 
    }).where(eq(providers.id, providerId));
  }

  async getProviders(filters?: {
    categoryId?: string;
    city?: string;
    minRating?: number;
    maxPrice?: number;
    search?: string;
  }, pagination?: PaginationOptions): Promise<{ providers: (Provider & { user: User; categories: Category[] })[]; total: number; page: number; totalPages: number }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const sortBy = pagination?.sortBy || 'rating';
    const sortOrder = pagination?.sortOrder || 'desc';

    let query = db
      .select()
      .from(providers)
      .innerJoin(users, eq(providers.userId, users.id));

    const results = await query;

    const providersWithCategories = await Promise.all(
      results.map(async (row) => {
        const providerCats = await db
          .select()
          .from(providerCategories)
          .innerJoin(categories, eq(providerCategories.categoryId, categories.id))
          .where(eq(providerCategories.providerId, row.providers.id));

        return {
          ...row.providers,
          user: row.users,
          categories: providerCats.map((pc) => pc.categories),
        };
      })
    );

    let filtered = providersWithCategories;

    if (filters?.categoryId) {
      filtered = filtered.filter((p) =>
        p.categories.some((c) => c.id === filters.categoryId)
      );
    }

    if (filters?.city) {
      filtered = filtered.filter((p) =>
        p.city.toLowerCase().includes(filters.city!.toLowerCase())
      );
    }

    if (filters?.minRating) {
      filtered = filtered.filter(
        (p) => parseFloat(p.averageRating || "0") >= filters.minRating!
      );
    }

    if (filters?.maxPrice) {
      filtered = filtered.filter(
        (p) => parseFloat(p.hourlyRate || "0") <= filters.maxPrice!
      );
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.user.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower) ||
          p.categories.some((c) => c.name.toLowerCase().includes(searchLower))
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'rating':
          comparison = parseFloat(b.averageRating || "0") - parseFloat(a.averageRating || "0");
          break;
        case 'price':
          comparison = parseFloat(a.hourlyRate || "0") - parseFloat(b.hourlyRate || "0");
          break;
        case 'name':
          comparison = a.user.name.localeCompare(b.user.name);
          break;
        default:
          comparison = parseFloat(b.averageRating || "0") - parseFloat(a.averageRating || "0");
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    return { providers: paginated, total, page, totalPages };
  }

  async getProviderWithDetails(id: string): Promise<(Provider & { user: User; categories: Category[]; services: Service[]; reviews: (Review & { client: User })[] }) | undefined> {
    const [result] = await db
      .select()
      .from(providers)
      .innerJoin(users, eq(providers.userId, users.id))
      .where(eq(providers.id, id));

    if (!result) return undefined;

    const providerCats = await db
      .select()
      .from(providerCategories)
      .innerJoin(categories, eq(providerCategories.categoryId, categories.id))
      .where(eq(providerCategories.providerId, id));

    const providerServices = await db
      .select()
      .from(services)
      .where(and(eq(services.providerId, id), eq(services.isActive, true)));

    const providerReviews = await db
      .select()
      .from(reviews)
      .innerJoin(users, eq(reviews.clientId, users.id))
      .where(eq(reviews.providerId, id))
      .orderBy(desc(reviews.createdAt));

    return {
      ...result.providers,
      user: result.users,
      categories: providerCats.map((pc) => pc.categories),
      services: providerServices,
      reviews: providerReviews.map((r) => ({ ...r.reviews, client: r.users })),
    };
  }

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(asc(categories.name));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [cat] = await db.insert(categories).values(category).returning();
    return cat;
  }

  async addProviderCategory(providerId: string, categoryId: string): Promise<void> {
    const existing = await db
      .select()
      .from(providerCategories)
      .where(and(eq(providerCategories.providerId, providerId), eq(providerCategories.categoryId, categoryId)));
    
    if (existing.length === 0) {
      await db.insert(providerCategories).values({ providerId, categoryId });
    }
  }

  async removeProviderCategory(providerId: string, categoryId: string): Promise<void> {
    await db
      .delete(providerCategories)
      .where(
        and(
          eq(providerCategories.providerId, providerId),
          eq(providerCategories.categoryId, categoryId)
        )
      );
  }

  async getProviderCategories(providerId: string): Promise<Category[]> {
    const result = await db
      .select()
      .from(providerCategories)
      .innerJoin(categories, eq(providerCategories.categoryId, categories.id))
      .where(eq(providerCategories.providerId, providerId));
    
    return result.map((r) => r.categories);
  }

  async getServices(providerId: string): Promise<Service[]> {
    return db.select().from(services).where(eq(services.providerId, providerId));
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async createService(service: InsertService): Promise<Service> {
    const [svc] = await db.insert(services).values(service).returning();
    return svc;
  }

  async updateService(id: string, data: Partial<InsertService>): Promise<Service | undefined> {
    const [svc] = await db.update(services).set(data).where(eq(services.id, id)).returning();
    return svc || undefined;
  }

  async deleteService(id: string): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  async getReviews(providerId: string): Promise<(Review & { client: User })[]> {
    const result = await db
      .select()
      .from(reviews)
      .innerJoin(users, eq(reviews.clientId, users.id))
      .where(eq(reviews.providerId, providerId))
      .orderBy(desc(reviews.createdAt));

    return result.map((r) => ({ ...r.reviews, client: r.users }));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [rev] = await db.insert(reviews).values(review).returning();
    
    const allReviews = await db
      .select({ rating: reviews.rating })
      .from(reviews)
      .where(eq(reviews.providerId, review.providerId));

    const totalRatings = allReviews.length;
    const averageRating = (
      allReviews.reduce((sum, r) => sum + r.rating, 0) / totalRatings
    ).toFixed(1);

    await db
      .update(providers)
      .set({ totalRatings, averageRating })
      .where(eq(providers.id, review.providerId));

    return rev;
  }

  async canUserReviewProvider(clientId: string, providerId: string): Promise<boolean> {
    const completedOrders = await db
      .select()
      .from(serviceOrders)
      .where(and(
        eq(serviceOrders.clientId, clientId),
        eq(serviceOrders.providerId, providerId),
        eq(serviceOrders.status, 'completed')
      ));

    if (completedOrders.length === 0) return false;

    const existingReviews = await db
      .select()
      .from(reviews)
      .where(and(
        eq(reviews.clientId, clientId),
        eq(reviews.providerId, providerId)
      ));

    return completedOrders.length > existingReviews.length;
  }

  async getServiceOrders(userId: string, role: 'client' | 'provider'): Promise<(ServiceOrder & { 
    client: User; 
    provider: Provider & { user: User }; 
    service?: Service;
    review?: Review;
  })[]> {
    let orders;
    
    if (role === 'client') {
      orders = await db
        .select()
        .from(serviceOrders)
        .where(eq(serviceOrders.clientId, userId))
        .orderBy(desc(serviceOrders.createdAt));
    } else {
      const provider = await this.getProviderByUserId(userId);
      if (!provider) return [];
      
      orders = await db
        .select()
        .from(serviceOrders)
        .where(eq(serviceOrders.providerId, provider.id))
        .orderBy(desc(serviceOrders.createdAt));
    }

    return Promise.all(orders.map(async (order) => {
      const [client] = await db.select().from(users).where(eq(users.id, order.clientId));
      const [providerRow] = await db
        .select()
        .from(providers)
        .innerJoin(users, eq(providers.userId, users.id))
        .where(eq(providers.id, order.providerId));

      let service;
      if (order.serviceId) {
        const [svc] = await db.select().from(services).where(eq(services.id, order.serviceId));
        service = svc;
      }

      const [review] = await db
        .select()
        .from(reviews)
        .where(eq(reviews.orderId, order.id));

      return {
        ...order,
        client,
        provider: { ...providerRow.providers, user: providerRow.users },
        service,
        review,
      };
    }));
  }

  async getServiceOrder(id: string): Promise<ServiceOrder | undefined> {
    const [order] = await db.select().from(serviceOrders).where(eq(serviceOrders.id, id));
    return order || undefined;
  }

  async createServiceOrder(order: InsertServiceOrder): Promise<ServiceOrder> {
    const [ord] = await db.insert(serviceOrders).values(order).returning();
    return ord;
  }

  async updateServiceOrder(id: string, data: Partial<InsertServiceOrder>): Promise<ServiceOrder | undefined> {
    const updateData: any = { ...data, updatedAt: new Date() };
    const [ord] = await db.update(serviceOrders).set(updateData).where(eq(serviceOrders.id, id)).returning();
    return ord || undefined;
  }

  async getConversations(userId: string): Promise<(Conversation & { 
    client: User; 
    provider: Provider & { user: User };
    lastMessage?: Message;
    unreadCount?: number;
  })[]> {
    const userProvider = await this.getProviderByUserId(userId);
    
    let convs;
    if (userProvider) {
      convs = await db
        .select()
        .from(conversations)
        .where(
          or(
            eq(conversations.clientId, userId),
            eq(conversations.providerId, userProvider.id)
          )
        )
        .orderBy(desc(conversations.lastMessageAt));
    } else {
      convs = await db
        .select()
        .from(conversations)
        .where(eq(conversations.clientId, userId))
        .orderBy(desc(conversations.lastMessageAt));
    }

    const result = await Promise.all(
      convs.map(async (conv) => {
        const [client] = await db.select().from(users).where(eq(users.id, conv.clientId));
        const [providerRow] = await db
          .select()
          .from(providers)
          .innerJoin(users, eq(providers.userId, users.id))
          .where(eq(providers.id, conv.providerId));

        const [lastMsg] = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conv.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        const unreadMessages = await db
          .select()
          .from(messages)
          .where(and(
            eq(messages.conversationId, conv.id),
            eq(messages.isRead, false),
            ne(messages.senderId, userId)
          ));

        return {
          ...conv,
          client,
          provider: { ...providerRow.providers, user: providerRow.users },
          lastMessage: lastMsg,
          unreadCount: unreadMessages.length,
        };
      })
    );

    return result;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conv || undefined;
  }

  async getOrCreateConversation(clientId: string, providerId: string): Promise<Conversation> {
    const [existing] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.clientId, clientId),
          eq(conversations.providerId, providerId)
        )
      );

    if (existing) return existing;

    const [conv] = await db
      .insert(conversations)
      .values({ clientId, providerId })
      .returning();

    return conv;
  }

  async getMessages(conversationId: string, pagination?: PaginationOptions): Promise<{ messages: (Message & { sender: User })[]; total: number }> {
    const limit = pagination?.limit || 50;
    const page = pagination?.page || 1;
    const offset = (page - 1) * limit;

    const allMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId));

    const result = await db
      .select()
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      messages: result.map((r) => ({ ...r.messages, sender: r.users })),
      total: allMessages.length,
    };
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [msg] = await db.insert(messages).values(message).returning();

    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, message.conversationId));

    return msg;
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          ne(messages.senderId, userId)
        )
      );
  }

  async getFavorites(userId: string): Promise<(Favorite & { provider: Provider & { user: User } })[]> {
    const favs = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));

    const result = await Promise.all(
      favs.map(async (fav) => {
        const [providerRow] = await db
          .select()
          .from(providers)
          .innerJoin(users, eq(providers.userId, users.id))
          .where(eq(providers.id, fav.providerId));

        return {
          ...fav,
          provider: { ...providerRow.providers, user: providerRow.users },
        };
      })
    );

    return result;
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const [fav] = await db.insert(favorites).values(favorite).returning();
    return fav;
  }

  async removeFavorite(userId: string, providerId: string): Promise<void> {
    await db
      .delete(favorites)
      .where(
        and(eq(favorites.userId, userId), eq(favorites.providerId, providerId))
      );
  }

  async isFavorite(userId: string, providerId: string): Promise<boolean> {
    const [fav] = await db
      .select()
      .from(favorites)
      .where(
        and(eq(favorites.userId, userId), eq(favorites.providerId, providerId))
      );
    return !!fav;
  }
}

export const storage = new DatabaseStorage();
