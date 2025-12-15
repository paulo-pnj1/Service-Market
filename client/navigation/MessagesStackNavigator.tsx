import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ConversationsScreen from "@/screens/ConversationsScreen";
import ChatScreen from "@/screens/ChatScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type MessagesStackParamList = {
  Conversations: undefined;
  Chat: { conversationId: string; providerName: string };
};

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export default function MessagesStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Conversations"
        component={ConversationsScreen}
        options={{ headerTitle: "Mensagens" }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ headerTitle: route.params.providerName })}
      />
    </Stack.Navigator>
  );
}
