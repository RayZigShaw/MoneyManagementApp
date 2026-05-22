import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Avatar, Button, Menu, Searchbar, Surface } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "./_lib/_AppContext";
import { BorderRadius, Colors, Spacing } from "./_lib/theme";
import { FontFamily, Typography } from "./_lib/typography";
import { deleteTransaction } from "./_services/_db-service";
import LoadingScreen from "./components/LoadingScreen";
import QuickAddModal from "./components/QuickAddModal";
import TypeSelectorModal from "./components/TypeSelectorModal";

const typeConfig = {
  income: { icon: "cash-plus", color: "#10b981", label: "Income", sign: "+" },
  expense: { icon: "cash-minus", color: "#ef4444", label: "Expense", sign: "-" },
  transfer: { icon: "swap-horizontal", color: "#0ea5e9", label: "Transfer", sign: "↔" },
};

const filters = ["All", "Income", "Expense", "Transfer"];

export default function TransactionsScreen() {
  const { transactions, loading, currency, refresh, accounts } = useApp();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [typeSelectorVisible, setTypeSelectorVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<"income" | "expense" | "transfer">("expense");
  const [modalOpen, setModalOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<string | null>(null);

  const handleTypeSelect = (type: "income" | "expense" | "transfer") => {
    setSelectedType(type);
    setModalOpen(true);
  };

  const filtered = transactions
    .filter((tx: any) => {
      const typeMatch = activeFilter === "All" || tx.type === activeFilter.toLowerCase();
      const searchMatch =
        !search ||
        tx.category?.toLowerCase().includes(search.toLowerCase()) ||
        tx.account_name?.toLowerCase().includes(search.toLowerCase()) ||
        tx.note?.toLowerCase().includes(search.toLowerCase());
      return typeMatch && searchMatch;
    })
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDelete = async (tx: any) => {
    Alert.alert(
      "Delete Transaction",
      `Delete ${tx.category}?`,
      [
        { text: "Cancel", style: "cancel" },
         {
           text: "Delete",
           style: "destructive",
           onPress: async () => {
             try {
               await deleteTransaction(tx.id);
               await refresh();
            } catch (e) {
              Alert.alert("Error", "Failed to delete transaction");
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }} edges={["top"]}>
      <LinearGradient
        colors={["#6366f1", "#8b5cf6", "#6366f1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, Typography.heading.h2]}>Transactions</Text>
          <Text style={[styles.subtitle, Typography.body.md]}>{transactions.length} total</Text>
        </View>

        {/* Search */}
        <Searchbar
          placeholder="Search transactions..."
          onChangeText={setSearch}
          value={search}
          style={styles.search}
        />

        {/* Filters */}
        <View style={styles.filterContainer}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[
                styles.filterBtn,
                activeFilter === f && styles.filterBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === f && styles.filterTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📭</Text>
              <Text style={styles.emptyStateText}>No transactions found</Text>
            </View>
          }
          renderItem={({ item: tx }: { item: any }) => {
            const cfg = typeConfig[tx.type as keyof typeof typeConfig] || typeConfig.expense;
            return (
              <Surface key={tx.id} style={styles.transactionCard} elevation={2}>
                <View style={styles.transactionContent}>
                  <Avatar.Icon
                    size={44}
                    icon={cfg.icon}
                    style={{ backgroundColor: cfg.color }}
                    color="#fff"
                  />

                  <View style={styles.transactionInfo}>
                    <Text style={styles.txCategory} numberOfLines={1}>
                      {tx.category || tx.to_account_name || tx.type}
                    </Text>
                    <Text style={styles.txMeta}>
                      {tx.account_name} · {tx.date}
                    </Text>
                    {tx.note && (
                      <Text style={styles.txNote} numberOfLines={1}>
                        "{tx.note}"
                      </Text>
                    )}
                  </View>

                  <View style={styles.transactionAmount}>
                    <Text style={[styles.txAmount, { color: cfg.color }]}>
                      {cfg.sign}{currency}{tx.amount?.toLocaleString()}
                    </Text>
                    <Text style={styles.txType}>{cfg.label}</Text>
                  </View>

                  <Menu
                    visible={menuAnchor === tx.id}
                    onDismiss={() => setMenuAnchor(null)}
                    anchor={
                      <Button
                        icon="dots-vertical"
                        onPress={() => setMenuAnchor(tx.id)}
                      >
                        {" "}
                      </Button>
                    }
                  >
                    <Menu.Item
                      onPress={() => {
                        handleDelete(tx);
                        setMenuAnchor(null);
                      }}
                      title="Delete"
                      leadingIcon="delete"
                    />
                  </Menu>
                </View>
              </Surface>
            );
          }}
        />
      </View>

      {/* Add Button */}
      <View style={styles.bottomButton}>
        <Button
          mode="contained"
          icon="plus"
          onPress={() => setTypeSelectorVisible(true)}
          style={styles.addButton}
          labelStyle={{ color: "#fff", fontSize: 16, fontWeight: "600" }}
        >
          Add Transaction
        </Button>
      </View>

      {/* Type Selector Modal */}
      <TypeSelectorModal
        visible={typeSelectorVisible}
        onDismiss={() => setTypeSelectorVisible(false)}
        onSelectType={handleTypeSelect}
      />

      {/* Transaction Form Modal */}
      <QuickAddModal
        visible={modalOpen}
        onDismiss={() => {
          setModalOpen(false);
          setTypeSelectorVisible(false);
        }}
        initialType={selectedType}
        accounts={accounts}
        onSuccess={refresh}
      />
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
  search: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  filterBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceVariant,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontFamily: FontFamily.primarySemiBold,
    color: Colors.text.secondary,
    ...Typography.caption.sm,
  },
  filterTextActive: {
    color: "#fff",
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 120,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyStateText: {
    fontFamily: FontFamily.primarySemiBold,
    color: Colors.text.primary,
    ...Typography.heading.h4,
  },
  transactionCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
  },
  transactionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  txCategory: {
    fontFamily: FontFamily.primarySemiBold,
    color: Colors.text.primary,
    ...Typography.subtitle.md,
  },
  txMeta: {
    color: Colors.text.secondary,
    fontFamily: FontFamily.primary,
    marginTop: 2,
    ...Typography.caption.sm,
  },
  txNote: {
    color: Colors.text.secondary,
    fontFamily: FontFamily.primary,
    marginTop: 2,
    fontStyle: "italic",
    ...Typography.caption.sm,
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontFamily: FontFamily.primaryBold,
    color: Colors.text.primary,
    ...Typography.subtitle.lg,
  },
  txType: {
    color: Colors.text.secondary,
    fontFamily: FontFamily.primary,
    marginTop: 2,
    ...Typography.caption.sm,
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
});
