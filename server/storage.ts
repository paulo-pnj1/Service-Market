import { 
  users, providers, categories, providerCategories, services, reviews, 
  conversations, messages, favorites,
  type User, type InsertUser, type Provider, type InsertProvider,
  type Category, type InsertCategory, type Service, type InsertService,
  type Review, type InsertReview, type Conversation, type InsertConversation,
  type Message, type InsertMessage, type Favorite, type InsertFavorite
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, ilike, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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
  }): Promise<(Provider & { user: User; categories: Category[] })[]>;
  getProviderWithDetails(id: string): Promise<(Provider & { user: User; categories: Category[]; services: Service[]; reviews: (Review & { client: User })[] }) | undefined>;

  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  addProviderCategory(providerId: string, categoryId: string): Promise<void>;
  removeProviderCategory(providerId: string, categoryId: string): Promise<void>;

  getServices(providerId: string): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, data: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string): Promise<void>;

  getReviews(providerId: string): Promise<(Review & { client: User })[]>;
  createReview(review: InsertReview): Promise<Review>;

  getConversations(userId: string): Promise<(Conversation & { 
    client: User; 
    provider: Provider & { user: User };
    lastMessage?: Message;
  })[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getOrCreateConversation(clientId: string, providerId: string): Promise<Conversation>;
  
  getMessages(conversationId: string): Promise<(Message & { sender: User })[]>;
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

  async getProviders(filters?: {
    categoryId?: string;
    city?: string;
    minRating?: number;
    maxPrice?: number;
    search?: string;
  }): Promise<(Provider & { user: User; categories: Category[] })[]> {
    let query = db
      .select()
      .from(providers)
      .innerJoin(users, eq(providers.userId, users.id))
      .orderBy(desc(providers.averageRating));

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

    return filtered;
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
      .where(eq(services.providerId, id));

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
    await db.insert(providerCategories).values({ providerId, categoryId });
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

  async getServices(providerId: string): Promise<Service[]> {
    return db.select().from(services).where(eq(services.providerId, providerId));
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

  async getConversations(userId: string): Promise<(Conversation & { 
    client: User; 
    provider: Provider & { user: User };
    lastMessage?: Message;
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

        return {
          ...conv,
          client,
          provider: { ...providerRow.providers, user: providerRow.users },
          lastMessage: lastMsg,
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

  async getMessages(conversationId: string): Promise<(Message & { sender: User })[]> {
    const result = await db
      .select()
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    return result.map((r) => ({ ...r.messages, sender: r.users }));
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
          sql`${messages.senderId} != ${userId}`
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
