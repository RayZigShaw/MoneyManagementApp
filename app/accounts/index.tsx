import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Avatar, Button, Menu, Modal, Portal, Surface, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../_lib/_AppContext";
import { BorderRadius, Colors, Spacing } from "../_lib/theme";
import { FontFamily, Typography } from "../_lib/typography";
import { createAccount, deleteAccount } from "../_services/_db-service";
import LoadingScreen from "../components/LoadingScreen";

const accountTypes = [
  { label: "Bank", value: "bank", icon: "bank", color: "#6366f1" },
  { label: "Wallet", value: "wallet", icon: "wallet", color: "#8b5cf6" },
  { label: "Cash", value: "cash", icon: "cash", color: "#ec4899" },
];

export default function AccountsScreen() {
  const { accounts, totalBalance, currency, refresh, loading } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ name: "", type: "bank", balance: "", color: "#6366f1" });
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  const [colorMenuVisible, setColorMenuVisible] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const modalScrollRef = useRef<ScrollView>(null);
  const [scrollContentSize, setScrollContentSize] = useState(0);
  const [scrollLayoutHeight, setScrollLayoutHeight] = useState(0);

  const colors = ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#0ea5e9"];

  const handleAddAccount = async () => {
    if (!form.name.trim() || !form.balance.trim() || isNaN(Number(form.balance))) {
      Alert.alert("Validation", "Please enter valid account details.");
      return;
    }

    try {
      console.log('[handleAddAccount] Creating account:', form);
      await createAccount({
        name: form.name,
        type: form.type as any,
        balance: parseFloat(form.balance),
        color: form.color,
      });
      console.log('[handleAddAccount] Account created successfully');
      setForm({ name: "", type: "bank", balance: "", color: "#6366f1" });
      setModalVisible(false);
      await refresh();
      Alert.alert("Success", "Account created successfully!");
    } catch (e: any) {
      console.error('[handleAddAccount] Error:', e);
      const errorMsg = e?.message || String(e) || "Unknown error";
      Alert.alert("Error", `Failed to create account: ${errorMsg}`);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    Alert.alert(
      "Delete Account",
      "Are you sure? This will also delete all transactions for this account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount(id);
              await refresh();
            } catch (e) {
              Alert.alert("Error", "Failed to delete account");
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingScreen />;

  const selectedTypeConfig = accountTypes.find(t => t.value === form.type);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }} edges={["top"]}>
      <LinearGradient
        colors={["#6366f1", "#8b5cf6", "#6366f1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      />

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, Typography.heading.h2]}>Accounts</Text>
          <Text style={[styles.subtitle, Typography.body.md]}>Manage your accounts</Text>
        </View>

        {/* Summary Card */}
        <Surface style={styles.summaryCard} elevation={8}>
          <Text style={[styles.summaryLabel, Typography.caption.md]}>Total Balance</Text>
          <Text style={[styles.summaryValue, Typography.display.lg]}>
            {currency} {totalBalance.toLocaleString()}
          </Text>
          <Text style={[styles.summarySubtext, Typography.caption.md]}>{accounts.length} accounts</Text>
        </Surface>

        {/* Accounts List */}
        {accounts.length === 0 ? (
          <View style={styles.emptyState}>
            <Avatar.Icon size={64} icon="wallet-outline" style={{ backgroundColor: "#e4e4e7" }} color="#7a869a" />
            <Text style={styles.emptyStateText}>No accounts yet</Text>
            <Text style={styles.emptyStateSubtext}>Add your first account to get started</Text>
          </View>
        ) : (
          accounts.map((account: any) => (
            <Surface key={account.id} style={styles.accountCard} elevation={3}>
              <View style={styles.accountCardContent}>
                <View
                  style={[
                    styles.accountIconContainer,
                    { backgroundColor: account.color + "22" },
                  ]}
                >
                  <Avatar.Icon
                    size={44}
                    icon={
                      account.type === "bank"
                        ? "bank"
                        : account.type === "wallet"
                        ? "wallet"
                        : "cash"
                    }
                    style={{ backgroundColor: account.color }}
                    color="#fff"
                  />
                </View>

                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{account.name}</Text>
                  <Text style={styles.accountType}>
                    {accountTypes.find(t => t.value === account.type)?.label}
                  </Text>
                </View>

                <View style={styles.accountBalance}>
                  <Text style={styles.accountBalanceValue}>
                    {currency} {(account.balance || 0).toLocaleString()}
                  </Text>
                </View>

                <Menu
                  visible={menuAnchor === account.id}
                  onDismiss={() => setMenuAnchor(null)}
                  anchor={
                    <Button
                      icon="dots-vertical"
                      onPress={() => setMenuAnchor(account.id)}
                      style={{ marginLeft: "auto" }}
                    >
                      {" "}
                    </Button>
                  }
                >
                  <Menu.Item
                    onPress={() => {
                      handleDeleteAccount(account.id);
                      setMenuAnchor(null);
                    }}
                    title="Delete"
                    leadingIcon="delete"
                  />
                </Menu>
              </View>
            </Surface>
          ))
        )}
      </ScrollView>

      {/* Add Button */}
      <View style={styles.bottomButton}>
        <Button
          mode="contained"
          icon="plus"
          onPress={() => setModalVisible(true)}
          style={styles.addButton}
          labelStyle={{ color: "#fff", fontSize: 16, fontWeight: "600" }}
        >
          Add Account
        </Button>
      </View>

      {/* Add Account Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <ScrollView 
            ref={modalScrollRef}
            style={styles.modalContent} 
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={(contentWidth, contentHeight) => {
              setScrollContentSize(contentHeight);
              modalScrollRef.current?.scrollTo({ y: contentHeight - scrollLayoutHeight + 300, animated: true });
            }}
            onLayout={(event) => {
              setScrollLayoutHeight(event.nativeEvent.layout.height);
            }}
            scrollEventThrottle={16}
          >
            <Text style={styles.modalTitle}>Add New Account</Text>

            {/* Account Name */}
            <Text style={styles.formLabel}>Account Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., My Bank Account"
              value={form.name}
              onChangeText={(name) => setForm({ ...form, name })}
              mode="outlined"
              outlineColor="#e4e4e7"
              activeOutlineColor="#6366f1"
            />

            {/* Account Type */}
            <Text style={styles.formLabel}>Account Type</Text>
            <Menu
              visible={typeMenuVisible}
              onDismiss={() => setTypeMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  onPress={() => setTypeMenuVisible(true)}
                  style={styles.selectButton}
                >
                  <Avatar.Icon
                    size={32}
                    icon={selectedTypeConfig?.icon || "wallet"}
                    style={{ backgroundColor: selectedTypeConfig?.color }}
                    color="#fff"
                  />
                  <Text style={styles.selectButtonText}>
                    {selectedTypeConfig?.label || "Select Type"}
                  </Text>
                </TouchableOpacity>
              }
            >
              {accountTypes.map((type) => (
                <Menu.Item
                  key={type.value}
                  onPress={() => {
                    setForm({ ...form, type: type.value });
                    setTypeMenuVisible(false);
                  }}
                  title={type.label}
                  leadingIcon={type.icon}
                />
              ))}
            </Menu>

            {/* Balance */}
            <Text style={styles.formLabel}>Initial Balance</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={form.balance}
              onChangeText={(balance) => setForm({ ...form, balance })}
              keyboardType="decimal-pad"
              mode="outlined"
              outlineColor="#e4e4e7"
              activeOutlineColor="#6366f1"
            />

            {/* Color */}
            <Text style={styles.formLabel}>Color</Text>
            <View style={styles.colorPicker}>
              {colors.map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setForm({ ...form, color })}
                  style={[
                    styles.colorOption,
                    {
                      backgroundColor: color,
                      borderWidth: form.color === color ? 3 : 0,
                      borderColor: "#fff",
                    },
                  ]}
                />
              ))}
            </View>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleAddAccount}
                style={{ flex: 1, marginLeft: 8 }}
                labelStyle={{ color: "#fff" }}
              >
                Add Account
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradientHeader: {
    height: 120,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    marginBottom: Spacing.md,
    zIndex: 1,
  },
  title: {
    color: Colors.text.primary,
    marginBottom: 4,
    fontFamily: FontFamily.primaryBold,
  },
  subtitle: {
    color: Colors.text.secondary,
    fontFamily: FontFamily.primary,
  },
  summaryCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.xxxl,
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
  },
  summaryLabel: {
    color: Colors.text.secondary,
    fontFamily: FontFamily.primary,
    marginBottom: Spacing.sm,
    ...Typography.caption.md,
  },
  summaryValue: {
    color: Colors.primary,
    fontFamily: FontFamily.primaryBold,
    marginBottom: Spacing.sm,
    ...Typography.display.lg,
  },
  summarySubtext: {
    color: Colors.text.secondary,
    fontFamily: FontFamily.primary,
    ...Typography.caption.md,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyStateText: {
    fontFamily: FontFamily.primarySemiBold,
    color: Colors.text.primary,
    marginTop: Spacing.md,
    ...Typography.heading.h4,
  },
  emptyStateSubtext: {
    color: Colors.text.secondary,
    fontFamily: FontFamily.primary,
    marginTop: Spacing.sm,
    ...Typography.body.sm,
  },
  accountCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  accountCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  accountIconContainer: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontFamily: FontFamily.primarySemiBold,
    color: Colors.text.primary,
    ...Typography.subtitle.lg,
  },
  accountType: {
    color: Colors.text.secondary,
    fontFamily: FontFamily.primary,
    marginTop: 2,
    ...Typography.caption.sm,
  },
  accountBalance: {
    alignItems: "flex-end",
  },
  accountBalanceValue: {
    fontFamily: FontFamily.primaryBold,
    color: Colors.primary,
    ...Typography.subtitle.lg,
  },
  bottomButton: {
    position: "absolute",
    bottom: 20,
    left: Spacing.md,
    right: Spacing.md,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  modal: {
    backgroundColor: Colors.surface,
    margin: Spacing.lg,
    borderRadius: BorderRadius.xxxl,
    padding: Spacing.xl,
  },
  modalContent: {
    maxHeight: "95%",
    flexGrow: 1,
  },
  modalTitle: {
    fontFamily: FontFamily.primaryBold,
    color: Colors.text.primary,
    marginBottom: Spacing.xl,
    ...Typography.heading.h3,
  },
  formLabel: {
    fontFamily: FontFamily.primarySemiBold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    ...Typography.overline,
  },
  input: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surfaceVariant,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  selectButtonText: {
    fontFamily: FontFamily.primarySemiBold,
    color: Colors.text.primary,
    ...Typography.body.md,
  },
  colorPicker: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.full,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
});
