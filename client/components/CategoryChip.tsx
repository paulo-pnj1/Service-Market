import React from "react";
import { StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface CategoryChipProps {
  name: string;
  icon: string;
  onPress?: () => void;
  selected?: boolean;
  small?: boolean;
}

const iconMap: Record<string, keyof typeof Feather.glyphMap> = {
  tool: "tool",
  home: "home",
  "book-open": "book-open",
  scissors: "scissors",
  monitor: "monitor",
  "hard-hat": "hard-hat",
  sun: "sun",
  truck: "truck",
};

export function CategoryChip({ name, icon, onPress, selected, small }: CategoryChipProps) {
  const { theme } = useTheme();
  const featherIcon = iconMap[icon] || "grid";

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        small && styles.chipSmall,
        {
          backgroundColor: selected ? theme.primary : theme.backgroundSecondary,
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}
    >
      <Feather
        name={featherIcon}
        size={small ? 14 : 16}
        color={selected ? "#fff" : theme.primary}
      />
      <ThemedText
        type={small ? "caption" : "small"}
        style={{ color: selected ? "#fff" : theme.text }}
        numberOfLines={1}
      >
        {name}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipSmall: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
});
