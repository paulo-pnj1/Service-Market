import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { createHash, randomBytes } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "servicoja-secret-key-change-in-production";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function generateToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString("base64url");
  const signature = createHash("sha256").update(`${header}.${body}.${JWT_SECRET}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): { valid: boolean; payload?: any } {
  try {
    const [header, body, signature] = token.split(".");
    const expectedSignature = createHash("sha256").update(`${header}.${body}.${JWT_SECRET}`).digest("base64url");

    if (signature !== expectedSignature) {
      return { valid: false };
    }
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());

    if (payload.exp && payload.exp < Date.now()) {
      return { valid: false };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token required" });
  }
  const token = authHeader.substring(7);
  const result = verifyToken(token);
  if (!result.valid) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
  (req as any).user = result.payload;
  next();
}

function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const result = verifyToken(token);
    if (result.valid) {
      (req as any).user = result.payload;
    }
  }

  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name, phone, city, role } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ message: "Email, senha e nome são obrigatórios" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres" });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Email inválido" });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Este email já está cadastrado" });
      }
      const user = await storage.createUser({
        email,
        password: hashPassword(password),
        name,
        phone,
        city,
        role: role || "client",
      });

      // CORREÇÃO: Criar automaticamente o perfil de prestador se role for "provider"
      let provider = null;
      if ((role || "client") === "provider") {
        provider = await storage.createProvider({
          userId: user.id,
          city: city || "",
          description: "",
          hourlyRate: null,
          whatsapp: phone || null,
          facebook: null,
          isVerified: false,
          isOnline: false,
        });
      }

      const token = generateToken({ userId: user.id, email: user.email, role: user.role });
      const { password: _, ...userWithoutPassword } = user;

      res.json({ user: userWithoutPassword, provider, token });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== hashPassword(password)) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      // CORREÇÃO: Sempre buscar o provider se o usuário for prestador
      let provider = null;
      if (user.role === "provider") {
        provider = await storage.getProviderByUserId(user.id);
      }

      const token = generateToken({ userId: user.id, email: user.email, role: user.role });
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, provider, token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.json({ message: "Se o email existir, você receberá instruções para redefinir a senha" });
      }
      const resetToken = randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
      await storage.updateUser(user.id, {
        resetToken,
        resetTokenExpiry,
      } as any);
      console.log(`Password reset token for ${email}: ${resetToken}`);

      res.json({
        message: "Se o email existir, você receberá instruções para redefinir a senha",
        resetToken
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ message: "Token e nova senha são obrigatórios" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres" });
      }
      const user = await storage.getUserByResetToken(token);
      if (!user || !user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
        return res.status(400).json({ message: "Token inválido ou expirado" });
      }
      await storage.updateUser(user.id, {
        password: hashPassword(password),
        resetToken: null,
        resetTokenExpiry: null,
      } as any);
      res.json({ message: "Senha redefinida com sucesso" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      const { password: _, resetToken: __, resetTokenExpiry: ___, ...userWithoutSensitive } = user;
      res.json(userWithoutSensitive);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/users/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;

      if (authUser.userId !== req.params.id) {
        return res.status(403).json({ message: "Você só pode editar seu próprio perfil" });
      }
      const { password, resetToken, resetTokenExpiry, ...updateData } = req.body;

      const user = await storage.updateUser(req.params.id, updateData);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      const { password: _, resetToken: __, resetTokenExpiry: ___, ...userWithoutSensitive } = user;
      res.json(userWithoutSensitive);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const cats = await storage.getCategories();
      res.json(cats);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/providers", async (req: Request, res: Response) => {
    try {
      const { categoryId, city, minRating, maxPrice, search, page, limit, sortBy, sortOrder } = req.query;

      const result = await storage.getProviders({
        categoryId: categoryId as string,
        city: city as string,
        minRating: minRating ? parseFloat(minRating as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        search: search as string,
      }, {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      res.json(result);
    } catch (error) {
      console.error("Get providers error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/providers/:id", async (req: Request, res: Response) => {
    try {
      const provider = await storage.getProviderWithDetails(req.params.id);
      if (!provider) {
        return res.status(404).json({ message: "Prest<|reserved_77|>ador não encontrado" });
      }
      res.json(provider);
    } catch (error) {
      console.error("Get provider error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/providers", authMiddleware, async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;

      const existingProvider = await storage.getProviderByUserId(authUser.userId);
      if (existingProvider) {
        return res.status(400).json({ message: "Você já é um prestador cadastrado" });
      }
      const provider = await storage.createProvider({
        ...req.body,
        userId: authUser.userId,
      });

      if (req.body.categoryIds && Array.isArray(req.body.categoryIds)) {
        for (const categoryId of req.body.categoryIds) {
          await storage.addProviderCategory(provider.id, categoryId);
        }
      }

      res.json(provider);
    } catch (error) {
      console.error("Create provider error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/providers/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const existingProvider = await storage.getProvider(req.params.id);

      if (!existingProvider) {
        return res.status(404).json({ message: "Prestador não encontrado" });
      }
      if (existingProvider.userId !== authUser.userId) {
        return res.status(403).json({ message: "Você só pode editar seu próprio perfil de prestador" });
      }
      const { categoryIds, ...updateData } = req.body;

      const provider = await storage.updateProvider(req.params.id, updateData);

      if (categoryIds && Array.isArray(categoryIds)) {
        const currentCategories = await storage.getProviderCategories(req.params.id);
        const currentCategoryIds = currentCategories.map(c => c.id);

        for (const catId of currentCategoryIds) {
          if (!categoryIds.includes(catId)) {
            await storage.removeProviderCategory(req.params.id, catId);
          }
        }

        for (const catId of categoryIds) {
          if (!currentCategoryIds.includes(catId)) {
            await storage.addProviderCategory(req.params.id, catId);
          }
        }
      }

      res.json(provider);
    } catch (error) {
      console.error("Update provider error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/providers/:id/online", authMiddleware, async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const provider = await storage.getProvider(req.params.id);

      if (!provider || provider.userId !== authUser.userId) {
        return res.status(403).json({ message: "Não autorizado" });
      }
      await storage.updateProviderOnlineStatus(req.params.id, req.body.isOnline);
      res.json({ success: true });
    } catch (error) {
      console.error("Update online status error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/providers/:id/services", async (req: Request, res: Response) => {
    try {
      const services = await storage.getServices(req.params.id);
      res.json(services);
    } catch (error) {
      console.error("Get services error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/services", authMiddleware, async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const provider = await storage.getProviderByUserId(authUser.userId);

      if (!provider) {
        return res.status(403).json({ message: "Você precisa ser um prestador para criar serviços" });
      }
      if (!req.body.name) {
        return res.status(400).json({ message: "Nome do serviço é obrigatório" });
      }
      const service = await storage.createService({
        ...req.body,
        providerId: provider.id,
      });
      res.json(service);
    } catch (error) {
      console.error("Create service error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/services/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const existingService = await storage.getService(req.params.id);

      if (!existingService) {
        return res.status(404).json({ message: "Serviço não encontrado" });
      }
      const provider = await storage.getProvider(existingService.providerId);
      if (!provider || provider.userId !== authUser.userId) {
        return res.status(403).json({ message: "Você só pode editar seus próprios serviços" });
      }
      const service = await storage.updateService(req.params.id, req.body);
      res.json(service);
    } catch (error) {
      console.error("Update service error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.delete("/api/services/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const existingService = await storage.getService(req.params.id);

      if (!existingService) {
        return res.status(404).json({ message: "Serviço não encontrado" });
      }
      const provider = await storage.getProvider(existingService.providerId);
      if (!provider || provider.userId !== authUser.userId) {
        return res.status(403).json({ message: "Você só pode excluir seus próprios serviços" });
      }
      await storage.deleteService(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete service error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/providers/:id/reviews", async (req: Request, res: Response) => {
    try {
      const reviews = await storage.getReviews(req.params.id);
      res.json(reviews);
    } catch (error) {
      console.error("Get reviews error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/reviews", authMiddleware, async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const { providerId, rating, comment, orderId } = req.body;
      if (!providerId || !rating) {
        return res.status(400).json({ message: "Prestador e avaliação são obrigatórios" });
      }
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "A avaliação deve ser entre 1 e 5" });
      }
      const canReview = await storage.canUserReviewProvider(authUser.userId, providerId);
      if (!canReview) {
        return res.status(403).json({ message: "Você só pode avaliar após concluir um serviço" });
      }
      const review = await storage.createReview({
        providerId,
        clientId: authUser.userId,
        rating,
        comment,
        orderId,
      });
      res.json(review);
    } catch (error) {
      console.error("Create review error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/orders", authMiddleware, async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const { role } = req.query;

      const orders = await storage.getServiceOrders(
        authUser.userId,
        (role as 'client' | 'provider') || 'client'
      );
      res.json(orders);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/orders", authMiddleware, async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const { providerId, serviceId, scheduledDate, notes } = req.body;
      if (!providerId) {
        return res.status(400).json({ message: "Prestador é obrigatório" });
      }
      let price;
      if (serviceId) {
        const service = await storage.getService(serviceId);
        if (service) {
          price = service.price;
        }
      }
      const order = await storage.createServiceOrder({
        clientId: authUser.userId,
        providerId,
        serviceId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        price,
        clientNotes: notes,
        status: 'pending',
      });
      res.json(order);
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/orders/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const order = await storage.getServiceOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }
      const provider = await storage.getProvider(order.providerId);
      const isClient = order.clientId === authUser.userId;
      const isProvider = provider && provider.userId === authUser.userId;
      if (!isClient && !isProvider) {
        return res.status(403).json({ message: "Não autorizado" });
      }
      const { status, providerNotes, clientNotes } = req.body;
      const updateData: any = {};
      if (status) {
        if (isProvider && ['accepted', 'rejected', 'in_progress', 'completed'].includes(status)) {
          updateData.status = status;
          if (status === 'completed') {
            updateData.completedDate = new Date();
          }
        } else if (isClient && ['cancelled'].includes(status)) {
          updateData.status = status;
        } else {
          return res.status(403).json({ message: "Status inválido" });
        }
      }
      if (providerNotes && isProvider) {
        updateData.providerNotes = providerNotes;
      }
      if (clientNotes && isClient) {
        updateData.clientNotes = clientNotes;
      }
      const updatedOrder = await storage.updateServiceOrder(req.params.id, updateData);
      res.json(updatedOrder);
    } catch (error) {
      console.error("Update order error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/conversations", authMiddleware, async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const convs = await storage.getConversations(authUser.userId);
      res.json(convs);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/conversations", authMiddleware, async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const { providerId } = req.body;

      if (!providerId) {
        return res.status(400).json({ message: "providerId é obrigatório" });
      }

      const conv = await storage.getOrCreateConversation(authUser.userId, providerId);
      res.json(conv);
    } catch (error) {
      console.error("Create conversation error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/conversations/:id/messages", authMiddleware, async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const conv = await storage.getConversation(req.params.id);

      if (!conv) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }
      const provider = await storage.getProvider(conv.providerId);
      const isParticipant = conv.clientId === authUser.userId ||
        (provider && provider.userId === authUser.userId);
      if (!isParticipant) {
        return res.status(403).json({ message: "Não autorizado" });
      }
      const { page, limit } = req.query;
      const result = await storage.getMessages(req.params.id, {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
      });

      res.json(result);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/messages", authMiddleware, async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const { conversationId, content } = req.body;
      if (!conversationId || !content) {
        return res.status(400).json({ message: "conversationId e content são obrigatórios" });
      }
      const conv = await storage.getConversation(conversationId);
      if (!conv) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }
      const provider = await storage.getProvider(conv.providerId);
      const isParticipant = conv.clientId === authUser.userId ||
        (provider && provider.userId === authUser.userId);
      if (!isParticipant) {
        return res.status(403).json({ message: "Não autorizado" });
      }
      const msg = await storage.createMessage({
        conversationId,
        senderId: authUser.userId,
        content,
      });
      res.json(msg);
    } catch (error) {
      console.error("Create message error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/conversations/:id/read", authMiddleware, async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const conv = await storage.getConversation(req.params.id);

      if (!conv) {
        return res.status(404).json({ message: "Conversa não encontrada" });
      }
      await storage.markMessagesAsRead(req.params.id, authUser.userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark read error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/favorites", authMiddleware, async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const favs = await storage.getFavorites(authUser.userId);
      res.json(favs);
    } catch (error) {
      console.error("Get favorites error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/favorites", authMiddleware, async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const { providerId } = req.body;
      if (!providerId) {
        return res.status(400).json({ message: "providerId é obrigatório" });
      }
      const existing = await storage.isFavorite(authUser.userId, providerId);
      if (existing) {
        return res.status(400).json({ message: "Já está nos favoritos" });
      }
      const fav = await storage.addFavorite({
        userId: authUser.userId,
        providerId,
      });
      res.json(fav);
    } catch (error) {
      console.error("Add favorite error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.delete("/api/favorites", authMiddleware, async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const { providerId } = req.body;

      if (!providerId) {
        return res.status(400).json({ message: "providerId é obrigatório" });
      }

      await storage.removeFavorite(authUser.userId, providerId);
      res.json({ success: true });
    } catch (error) {
      console.error("Remove favorite error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/favorites/check", authMiddleware, async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const { providerId } = req.query;

      if (!providerId) {
        return res.status(400).json({ message: "providerId é obrigatório" });
      }

      const isFav = await storage.isFavorite(authUser.userId, providerId as string);
      res.json({ isFavorite: isFav });
    } catch (error) {
      console.error("Check favorite error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}