import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name, phone, city, role } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ message: "Email, password and name are required" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const user = await storage.createUser({
        email,
        password: hashPassword(password),
        name,
        phone,
        city,
        role: role || "client",
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== hashPassword(password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const provider = await storage.getProviderByUserId(user.id);
      const { password: _, ...userWithoutPassword } = user;

      res.json({ user: userWithoutPassword, provider });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const cats = await storage.getCategories();
      res.json(cats);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/providers", async (req: Request, res: Response) => {
    try {
      const { categoryId, city, minRating, maxPrice, search } = req.query;
      const providers = await storage.getProviders({
        categoryId: categoryId as string,
        city: city as string,
        minRating: minRating ? parseFloat(minRating as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        search: search as string,
      });
      res.json(providers);
    } catch (error) {
      console.error("Get providers error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/providers/:id", async (req: Request, res: Response) => {
    try {
      const provider = await storage.getProviderWithDetails(req.params.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      res.json(provider);
    } catch (error) {
      console.error("Get provider error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/providers", async (req: Request, res: Response) => {
    try {
      const provider = await storage.createProvider(req.body);
      
      if (req.body.categoryIds && Array.isArray(req.body.categoryIds)) {
        for (const categoryId of req.body.categoryIds) {
          await storage.addProviderCategory(provider.id, categoryId);
        }
      }
      
      res.json(provider);
    } catch (error) {
      console.error("Create provider error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/providers/:id", async (req: Request, res: Response) => {
    try {
      const provider = await storage.updateProvider(req.params.id, req.body);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      res.json(provider);
    } catch (error) {
      console.error("Update provider error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/providers/:id/services", async (req: Request, res: Response) => {
    try {
      const services = await storage.getServices(req.params.id);
      res.json(services);
    } catch (error) {
      console.error("Get services error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/services", async (req: Request, res: Response) => {
    try {
      const service = await storage.createService(req.body);
      res.json(service);
    } catch (error) {
      console.error("Create service error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/services/:id", async (req: Request, res: Response) => {
    try {
      const service = await storage.updateService(req.params.id, req.body);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Update service error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/services/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteService(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete service error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/providers/:id/reviews", async (req: Request, res: Response) => {
    try {
      const reviews = await storage.getReviews(req.params.id);
      res.json(reviews);
    } catch (error) {
      console.error("Get reviews error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/reviews", async (req: Request, res: Response) => {
    try {
      const review = await storage.createReview(req.body);
      res.json(review);
    } catch (error) {
      console.error("Create review error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      const convs = await storage.getConversations(userId as string);
      res.json(convs);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { clientId, providerId } = req.body;
      if (!clientId || !providerId) {
        return res.status(400).json({ message: "clientId and providerId are required" });
      }
      const conv = await storage.getOrCreateConversation(clientId, providerId);
      res.json(conv);
    } catch (error) {
      console.error("Create conversation error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const msgs = await storage.getMessages(req.params.id);
      res.json(msgs);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/messages", async (req: Request, res: Response) => {
    try {
      const msg = await storage.createMessage(req.body);
      res.json(msg);
    } catch (error) {
      console.error("Create message error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/conversations/:id/read", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      await storage.markMessagesAsRead(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark read error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/favorites", async (req: Request, res: Response) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      const favs = await storage.getFavorites(userId as string);
      res.json(favs);
    } catch (error) {
      console.error("Get favorites error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/favorites", async (req: Request, res: Response) => {
    try {
      const fav = await storage.addFavorite(req.body);
      res.json(fav);
    } catch (error) {
      console.error("Add favorite error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/favorites", async (req: Request, res: Response) => {
    try {
      const { userId, providerId } = req.body;
      if (!userId || !providerId) {
        return res.status(400).json({ message: "userId and providerId are required" });
      }
      await storage.removeFavorite(userId, providerId);
      res.json({ success: true });
    } catch (error) {
      console.error("Remove favorite error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/favorites/check", async (req: Request, res: Response) => {
    try {
      const { userId, providerId } = req.query;
      if (!userId || !providerId) {
        return res.status(400).json({ message: "userId and providerId are required" });
      }
      const isFav = await storage.isFavorite(userId as string, providerId as string);
      res.json({ isFavorite: isFav });
    } catch (error) {
      console.error("Check favorite error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
