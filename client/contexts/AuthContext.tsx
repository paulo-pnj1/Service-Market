import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
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
  role: "client" | "provider";
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
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: "client" | "provider", city?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  updateProvider: (data: Partial<Provider>) => Promise<void>;
  setProvider: (newProvider: Provider | null) => void;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [provider, setProviderState] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await usersService.getByEmail(firebaseUser.email!);
          if (userDoc) {
            const transformedUser: User = {
              id: userDoc.id,
              email: userDoc.email,
              name: userDoc.name,
              phone: userDoc.phone,
              city: userDoc.city,
              photoUrl: userDoc.photoUrl,
              role: userDoc.role,
            };
            setUser(transformedUser);

            if (userDoc.role === "provider") {
              const providerDoc = await providersService.getByUserId(userDoc.id);
              if (providerDoc) {
                setProviderState(providerDoc as Provider);
              } else {
                setProviderState(null);
              }
            } else {
              setProviderState(null);
            }
          } else {
            setUser(null);
            setProviderState(null);
          }
        } catch (error) {
          console.error("Erro ao carregar dados do usuário:", error);
          setUser(null);
          setProviderState(null);
        }
      } else {
        setUser(null);
        setProviderState(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged vai tratar do resto
  };

  const register = async (email: string, password: string, name: string, role: "client" | "provider", city?: string) => {
    setIsLoading(true);
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });

    // Corrigido: createdAt removido porque está no Omit
    const userData: Omit<UserData, "id" | "createdAt"> = {
      email,
      name,
      role,
      phone: undefined,
      city,
      photoUrl: undefined,
    };

    // Corrigido: usersService.create espera (userId, data)
    await usersService.create(credential.user.uid, userData);

    // onAuthStateChanged vai carregar os dados
  };

  const logout = async () => {
    await signOut(auth);
  };

  const forgotPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUser = async (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      try {
        // Corrigido: Partial<UserData> – role deve ser do tipo correto
        const userDataUpdate: Partial<UserData> = {
          ...data,
          // Garantir que role, se presente, seja do tipo correto
          role: data.role as "client" | "provider" | undefined,
        };
        await usersService.update(user.id, userDataUpdate);
      } catch (error) {
        console.error("Error updating user:", error);
      }
    }
  };

  const updateProvider = useCallback(async (data: Partial<Provider>) => {
    if (provider) {
      const updated = { ...provider, ...data };
      setProviderState(updated);
      try {
        await providersService.update(provider.id, data);
      } catch (error) {
        console.error("Error updating provider:", error);
      }
    }
  }, [provider]);

  const setProvider = useCallback((newProvider: Provider | null) => {
    setProviderState(newProvider);
  }, []);

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