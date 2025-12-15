import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "@/screens/ProfileScreen";
import EditProfileScreen from "@/screens/EditProfileScreen";
import ServiceManagementScreen from "@/screens/ServiceManagementScreen";
import OrderHistoryScreen from "@/screens/OrderHistoryScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  ServiceManagement: undefined;
  OrderHistory: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerTitle: "Perfil" }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerTitle: "Editar Perfil" }}
      />
      <Stack.Screen
        name="ServiceManagement"
        component={ServiceManagementScreen}
        options={{ headerTitle: "Meus Servicos" }}
      />
      <Stack.Screen
        name="OrderHistory"
        component={OrderHistoryScreen}
        options={{ headerTitle: "Historico de Servicos" }}
      />
    </Stack.Navigator>
  );
}
