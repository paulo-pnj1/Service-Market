import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "@/lib/query-client";

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  city?: string;
  photoUrl?: string;
  role: string;
}

interface Provider {
  id: string;
  userId: string;
  description?: string;
  hourlyRate?: string;
  city: string;
  isVerified?: boolean;
  totalRatings?: number;
  averageRating?: string;
}

interface AuthContextType {
  user: User | null;
  provider: Provider | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  updateProvider: (data: Partial<Provider>) => void;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  city?: string;
  role: "client" | "provider";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "@servicoja_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const { user, provider } = JSON.parse(stored);
        setUser(user);
        setProvider(provider);
      }
    } catch (error) {
      console.error("Error loading auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAuth = async (user: User | null, provider: Provider | null) => {
    try {
      if (user) {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, provider }));
      } else {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Error saving auth:", error);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await response.json();
      
      setUser(data.user);
      setProvider(data.provider || null);
      await saveAuth(data.user, data.provider || null);
      
      return { success: true };
    } catch (error: any) {
      const message = error.message || "Erro ao fazer login";
      return { success: false, error: message };
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiRequest("POST", "/api/auth/register", data);
      const result = await response.json();
      
      setUser(result.user);
      await saveAuth(result.user, null);
      
      return { success: true };
    } catch (error: any) {
      const message = error.message || "Erro ao criar conta";
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    setUser(null);
    setProvider(null);
    await saveAuth(null, null);
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      saveAuth(updated, provider);
    }
  };

  const updateProvider = (data: Partial<Provider>) => {
    if (provider) {
      const updated = { ...provider, ...data };
      setProvider(updated);
      saveAuth(user, updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        provider,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        updateProvider,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
