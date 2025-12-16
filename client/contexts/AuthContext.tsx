import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  FirebaseUser
} from "@/lib/firebase";
import { usersService, providersService, UserData, ProviderData } from "@/lib/firestore";

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
  hourlyRate?: number;
  city: string;
  whatsapp?: string;
  facebook?: string;
  isVerified?: boolean;
  isOnline?: boolean;
  totalRatings?: number;
  averageRating?: number;
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
  setProvider: (provider: Provider | null) => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await loadUserData(firebaseUser);
      } else {
        setUser(null);
        setProviderState(null);
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (firebaseUser: FirebaseUser) => {
    try {
      const userData = await usersService.get(firebaseUser.uid);
      if (userData) {
        const userObj: User = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          city: userData.city,
          photoUrl: userData.photoUrl,
          role: userData.role,
        };
        setUser(userObj);

        if (userData.role === "provider") {
          const providerData = await providersService.getByUserId(userData.id);
          if (providerData) {
            setProviderState({
              id: providerData.id,
              userId: providerData.userId,
              description: providerData.description,
              hourlyRate: providerData.hourlyRate,
              city: providerData.city,
              whatsapp: providerData.whatsapp,
              facebook: providerData.facebook,
              isVerified: providerData.isVerified,
              isOnline: providerData.isOnline,
              totalRatings: providerData.totalRatings,
              averageRating: providerData.averageRating,
            });
          }
        }

        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ userId: firebaseUser.uid }));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await loadUserData(userCredential.user);
      return { success: true };
    } catch (error: any) {
      let message = "Erro ao fazer login";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        message = "Email ou senha incorretos";
      } else if (error.code === "auth/invalid-email") {
        message = "Email invalido";
      } else if (error.code === "auth/too-many-requests") {
        message = "Muitas tentativas. Tente novamente mais tarde";
      }
      return { success: false, error: message };
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      await updateProfile(userCredential.user, { displayName: data.name });

      await usersService.create(userCredential.user.uid, {
        email: data.email,
        name: data.name,
        phone: data.phone,
        city: data.city,
        role: data.role,
      });

      if (data.role === "provider") {
        await providersService.create({
          userId: userCredential.user.uid,
          city: data.city || "Luanda",
          isVerified: false,
          isOnline: false,
          totalRatings: 0,
          averageRating: 0,
        });
      }

      await loadUserData(userCredential.user);
      return { success: true };
    } catch (error: any) {
      let message = "Erro ao criar conta";
      if (error.code === "auth/email-already-in-use") {
        message = "Este email ja esta em uso";
      } else if (error.code === "auth/weak-password") {
        message = "Senha muito fraca. Use pelo menos 6 caracteres";
      } else if (error.code === "auth/invalid-email") {
        message = "Email invalido";
      }
      return { success: false, error: message };
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: "Email de recuperacao enviado! Verifique sua caixa de entrada." };
    } catch (error: any) {
      let message = "Erro ao solicitar recuperacao de senha";
      if (error.code === "auth/user-not-found") {
        message = "Nenhuma conta encontrada com este email";
      } else if (error.code === "auth/invalid-email") {
        message = "Email invalido";
      }
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setProviderState(null);
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const updateUser = async (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      try {
        const updateData: Record<string, any> = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.city !== undefined) updateData.city = data.city;
        if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;
        if (data.role !== undefined) updateData.role = data.role as "client" | "provider";
        await usersService.update(user.id, updateData);
      } catch (error) {
        console.error("Error updating user:", error);
      }
    }
  };

  const updateProvider = async (data: Partial<Provider>) => {
    if (provider) {
      const updated = { ...provider, ...data };
      setProviderState(updated);
      try {
        await providersService.update(provider.id, data);
      } catch (error) {
        console.error("Error updating provider:", error);
      }
    }
  };

  const setProvider = (newProvider: Provider | null) => {
    setProviderState(newProvider);
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
        setProvider,
        forgotPassword,
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
