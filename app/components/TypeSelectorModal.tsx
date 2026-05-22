import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Avatar, Modal, Portal, Surface } from "react-native-paper";
import { BorderRadius, Spacing } from "../_lib/theme";
import { FontFamily, Typography } from "../_lib/typography";

interface TypeSelectorModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSelectType: (type: "income" | "expense" | "transfer") => void;
}

const typeConfig = {
  income: { icon: "trending-up", color: "#10b981", label: "Income", description: "Money coming in" },
  expense: { icon: "trending-down", color: "#ef4444", label: "Expense", description: "Money going out" },
  transfer: { icon: "sync", color: "#0ea5e9", label: "Transfer", description: "Move between accounts" },
};

export default function TypeSelectorModal({
  visible,
  onDismiss,
  onSelectType,
}: TypeSelectorModalProps) {
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <Surface style={styles.modal} elevation={8}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, Typography.heading.h3]}>
                Select Transaction Type
              </Text>
              <Text style={[styles.subtitle, Typography.body.sm]}>
                Choose what you want to add
              </Text>
            </View>

            {/* Type Options */}
            <View style={styles.typeOptionsContainer}>
              {Object.entries(typeConfig).map(([key, config]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    onSelectType(key as "income" | "expense" | "transfer");
                    onDismiss();
                  }}
                  activeOpacity={0.7}
                >
                  <Surface style={styles.typeOption} elevation={2}>
                    <Avatar.Icon
                      size={56}
                      icon={config.icon}
                      style={{ backgroundColor: config.color }}
                      color="#fff"
                    />
                    <View style={styles.typeInfo}>
                      <Text style={[styles.typeLabel, Typography.subtitle.md]}>
                        {config.label}
                      </Text>
                      <Text style={[styles.typeDescription, Typography.caption.sm]}>
                        {config.description}
                      </Text>
                    </View>
                  </Surface>
                </TouchableOpacity>
              ))}
            </View>
          </Surface>
        </Modal>
      </Portal>
    );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  modal: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    backgroundColor: "#fff",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    color: "#1e293b",
    fontFamily: FontFamily.primaryBold,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    color: "#64748b",
    fontFamily: FontFamily.primary,
    textAlign: "center",
  },
  typeOptionsContainer: {
    gap: Spacing.md,
  },
  typeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: "#f8fafc",
  },
  typeInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  typeLabel: {
    color: "#1e293b",
    fontFamily: FontFamily.primaryBold,
    marginBottom: Spacing.xs,
  },
  typeDescription: {
    color: "#64748b",
    fontFamily: FontFamily.primary,
  },
});
