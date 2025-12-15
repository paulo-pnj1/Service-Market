import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_DOMAIN 
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` 
  : "";

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
  whatsapp?: string;
  facebook?: string;
  isVerified?: boolean;
  isOnline?: boolean;
  totalRatings?: number;
  averageRating?: string;
}

interface AuthContextType {
  user: User | null;
  provider: Provider | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  updateProvider: (data: Partial<Provider>) => void;
  setProvider: (provider: Provider | null) => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; error?: string }>;
  apiRequest: (method: string, endpoint: string, body?: any) => Promise<Response>;
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
  const [provider, setProviderState] = useState<Provider | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const { user, provider, token } = JSON.parse(stored);
        setUser(user);
        setProviderState(provider);
        setToken(token);
      }
    } catch (error) {
      console.error("Error loading auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAuth = async (user: User | null, provider: Provider | null, token: string | null) => {
    try {
      if (user && token) {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, provider, token }));
      } else {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Error saving auth:", error);
    }
  };

  const apiRequest = async (method: string, endpoint: string, body?: any): Promise<Response> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Erro desconhecido" }));
      throw new Error(error.message || `Erro ${response.status}`);
    }

    return response;
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.message || "Erro ao fazer login" };
      }
      
      setUser(data.user);
      setProviderState(data.provider || null);
      setToken(data.token);
      await saveAuth(data.user, data.provider || null, data.token);
      
      return { success: true };
    } catch (error: any) {
      const message = error.message || "Erro ao fazer login";
      return { success: false, error: message };
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.message || "Erro ao criar conta" };
      }
      
      setUser(result.user);
      setToken(result.token);
      await saveAuth(result.user, null, result.token);
      
      return { success: true };
    } catch (error: any) {
      const message = error.message || "Erro ao criar conta";
      return { success: false, error: message };
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.message };
      }
      
      return { success: true, message: result.message };
    } catch (error: any) {
      return { success: false, error: error.message || "Erro ao solicitar redefinição de senha" };
    }
  };

  const resetPassword = async (resetToken: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password }),
        credentials: "include",
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.message };
      }
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Erro ao redefinir senha" };
    }
  };

  const logout = async () => {
    setUser(null);
    setProviderState(null);
    setToken(null);
    await saveAuth(null, null, null);
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      saveAuth(updated, provider, token);
    }
  };

  const updateProvider = (data: Partial<Provider>) => {
    if (provider) {
      const updated = { ...provider, ...data };
      setProviderState(updated);
      saveAuth(user, updated, token);
    }
  };

  const setProvider = (newProvider: Provider | null) => {
    setProviderState(newProvider);
    saveAuth(user, newProvider, token);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        provider,
        token,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        updateProvider,
        setProvider,
        forgotPassword,
        resetPassword,
        apiRequest,
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
