import dayjs from "dayjs";
import React, { useRef, useState } from "react";
import { Alert, Keyboard, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Button, Menu, Modal, Portal, TextInput } from "react-native-paper";
import { useApp } from "../_lib/_AppContext";
import { Account, createTransaction } from "../_services/_db-service";

interface QuickAddModalProps {
  visible: boolean;
  onDismiss: () => void;
  initialType?: "income" | "expense" | "transfer";
  accounts: Account[];
  onSuccess: () => Promise<void>;
}

const typeConfig = {
  income: { icon: "trending-up", color: "#10b981", label: "Income" },
  expense: { icon: "trending-down", color: "#ef4444", label: "Expense" },
  transfer: { icon: "sync", color: "#0ea5e9", label: "Transfer" },
};

export default function QuickAddModal({
  visible,
  onDismiss,
  initialType = "income",
  accounts,
  onSuccess,
}: QuickAddModalProps) {
  const { settings } = useApp();
  const [type, setType] = useState<"income" | "expense" | "transfer">(initialType);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || "");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [toAccountMenuVisible, setToAccountMenuVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Listen to keyboard height changes
  React.useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Scroll to focused field when keyboard opens
  React.useEffect(() => {
    if (focusedField && keyboardHeight > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [keyboardHeight, focusedField]);

  // Update type when initialType changes (when modal opens with different type)
  React.useEffect(() => {
    setType(initialType);
    setCategory("");
    setCustomCategory("");
  }, [initialType, visible]);

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert("Validation", "Please enter a valid amount.");
      return;
    }

    if (!accountId) {
      Alert.alert("Validation", "Please select an account.");
      return;
    }

    if (type === "transfer" && !toAccountId) {
      Alert.alert("Validation", "Please select a destination account.");
      return;
    }

    if (type === "income" || type === "expense") {
      if (!category) {
        Alert.alert("Validation", `Please select a ${type}.`);
        return;
      }
      if (category === "Other" && !customCategory.trim()) {
        Alert.alert("Validation", "Please enter a custom category.");
        return;
      }
    }

    setLoading(true);
    try {
      const fromAccount = accounts.find((a) => a.id === accountId);
      const toAccount = type === "transfer" ? accounts.find((a) => a.id === toAccountId) : null;

      const finalCategory = category === "Other" ? customCategory : category;

      await createTransaction({
        type,
        amount: parseFloat(amount),
        date,
        category: type === "transfer" ? `→ ${toAccount?.name}` : finalCategory,
        account_id: accountId,
        account_name: fromAccount?.name || "",
        to_account_id: toAccountId || undefined,
        to_account_name: toAccount?.name || undefined,
        note: note || undefined,
      });

      await onSuccess();
      onDismiss();
      setAmount("");
      setCategory("");
      setCustomCategory("");
      setNote("");
      setType(initialType);
    } catch (e) {
      Alert.alert("Error", "Failed to create transaction.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const categories = type === "income" 
    ? (settings?.income_sources || []) 
    : (settings?.expense_categories || []);
  const fromAccount = accounts.find(a => a.id === accountId);
  const toAccount = accounts.find(a => a.id === toAccountId);

  return (
    <Portal>
      <Modal 
        visible={visible} 
        onDismiss={onDismiss} 
        contentContainerStyle={styles.modal}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.content} 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: keyboardHeight + 20 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              Add {typeConfig[type].label}
            </Text>
          </View>

          {/* Amount */}
          <View style={styles.section}>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              label="Enter amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              mode="outlined"
              outlineColor="#e4e4e7"
              activeOutlineColor={Object.values(typeConfig).find(cfg => cfg.label === type.charAt(0).toUpperCase() + type.slice(1))?.color}
              style={[styles.input, { color: "#1a2947", backgroundColor: "#fff" }]}
              placeholderTextColor="#7a869a"
              textColor="#1a2947"
            />
          </View>

          {/* Category */}
          {type !== "transfer" && (
            <View style={styles.section}>
              <Text style={styles.label}>{type === "income" ? "Source" : "Category"}</Text>
              <Menu
                visible={categoryMenuVisible}
                onDismiss={() => setCategoryMenuVisible(false)}
                anchor={
                  <TouchableOpacity
                    onPress={() => setCategoryMenuVisible(true)}
                    style={styles.selectField}
                  >
                    <Text style={[styles.selectFieldText, !category && { color: "#bdc3c7" }]}>
                      {category || "Select..."}
                    </Text>
                  </TouchableOpacity>
                }
              >
                {categories.map((cat) => (
                  <Menu.Item
                    key={cat}
                    onPress={() => {
                      setCategory(cat);
                      setCategoryMenuVisible(false);
                      setCustomCategory("");
                    }}
                    title={cat}
                  />
                ))}
                {!categories.includes("Other") && (
                  <Menu.Item
                    key="other"
                    onPress={() => {
                      setCategory("Other");
                      setCategoryMenuVisible(false);
                      setCustomCategory("");
                    }}
                    title="Other"
                  />
                )}
              </Menu>

              {/* Custom Category Input */}
              {category === "Other" && (
                <TextInput
                  label="Enter custom category"
                  value={customCategory}
                  onChangeText={setCustomCategory}
                  mode="outlined"
                  outlineColor="#e4e4e7"
                  activeOutlineColor="#6366f1"
                  style={[styles.input, { color: "#1a2947", backgroundColor: "#fff", marginTop: 12 }]}
                  placeholderTextColor="#7a869a"
                  textColor="#1a2947"
                />
              )}
            </View>
          )}

          {/* From Account */}
          <View style={styles.section}>
            <Text style={styles.label}>{type === "transfer" ? "From Account" : "Account"}</Text>
            <Menu
              visible={accountMenuVisible}
              onDismiss={() => setAccountMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  onPress={() => setAccountMenuVisible(true)}
                  style={styles.selectField}
                >
                  <Text style={styles.selectFieldText}>
                    {fromAccount?.name || "Select..."}
                  </Text>
                </TouchableOpacity>
              }
            >
              {accounts.map((acc) => (
                <Menu.Item
                  key={acc.id}
                  onPress={() => {
                    setAccountId(acc.id);
                    setAccountMenuVisible(false);
                  }}
                  title={acc.name}
                />
              ))}
            </Menu>
          </View>

          {/* To Account (Transfer) */}
          {type === "transfer" && (
            <View style={styles.section}>
              <Text style={styles.label}>To Account</Text>
              <Menu
                visible={toAccountMenuVisible}
                onDismiss={() => setToAccountMenuVisible(false)}
                anchor={
                  <TouchableOpacity
                    onPress={() => setToAccountMenuVisible(true)}
                    style={styles.selectField}
                  >
                    <Text style={styles.selectFieldText}>
                      {toAccount?.name || "Select..."}
                    </Text>
                  </TouchableOpacity>
                }
              >
                {accounts
                  .filter((a) => a.id !== accountId)
                  .map((acc) => (
                    <Menu.Item
                      key={acc.id}
                      onPress={() => {
                        setToAccountId(acc.id);
                        setToAccountMenuVisible(false);
                      }}
                      title={acc.name}
                    />
                  ))}
              </Menu>
            </View>
          )}

          {/* Date */}
          <View style={styles.section}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              label="YYYY-MM-DD"
              value={date}
              onChangeText={setDate}
              mode="outlined"
              outlineColor="#e4e4e7"
              activeOutlineColor="#6366f1"
              style={[styles.input, { color: "#1a2947", backgroundColor: "#fff" }]}
              placeholderTextColor="#7a869a"
              textColor="#1a2947"
            />
          </View>

          {/* Note */}
          <View style={styles.section}>
            <Text style={styles.label}>Note (Optional)</Text>
            <TextInput
              label="Add a note..."
              value={note}
              onChangeText={setNote}
              onFocus={() => setFocusedField("note")}
              onBlur={() => setFocusedField(null)}
              mode="outlined"
              outlineColor="#e4e4e7"
              activeOutlineColor="#6366f1"
              multiline
              numberOfLines={3}
              style={[styles.input, { color: "#1a2947", backgroundColor: "#fff" }]}
              placeholderTextColor="#7a869a"
              textColor="#1a2947"
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={loading}
              disabled={loading}
              style={[
                styles.saveBtn,
                { flex: 1, marginLeft: 12, backgroundColor: Object.values(typeConfig).find(cfg => cfg.label === type.charAt(0).toUpperCase() + type.slice(1))?.color },
              ]}
              labelStyle={{ color: "#fff", fontWeight: "600" }}
            >
              Save
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 24,
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a2947",
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 12,
  },
  typeBtn: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e4e4e7",
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#7a869a",
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1a2947",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#fff",
    color: "#1a2947",
  },
  selectField: {
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  selectFieldText: {
    fontSize: 14,
    color: "#1a2947",
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 24,
    marginBottom: 12,
    gap: 12,
  },
  saveBtn: {
    borderRadius: 8,
  },
});

