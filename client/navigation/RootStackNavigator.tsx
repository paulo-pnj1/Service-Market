import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import AuthScreen from "@/screens/AuthScreen";
import FilterScreen from "@/screens/FilterScreen";
import ReviewScreen from "@/screens/ReviewScreen";
import AdminSetupScreen from "@/screens/AdminSetupScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/contexts/AuthContext";
import { ActivityIndicator, View } from "react-native";

export type RootStackParamList = {
  Auth: undefined;
  AdminSetup: undefined;
  Main: undefined;
  Filter: { categoryId?: string; city?: string; minRating?: number; maxPrice?: number };
  Review: { providerId: string; providerName: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!user ? (
        <>
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AdminSetup"
            component={AdminSetupScreen}
            options={{ headerTitle: "Configuração Firebase" }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Filter"
            component={FilterScreen}
            options={{ presentation: "modal", headerTitle: "Filtros" }}
          />
          <Stack.Screen
            name="Review"
            component={ReviewScreen}
            options={{ presentation: "modal", headerTitle: "Avaliar" }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
