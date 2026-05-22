import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Avatar, Surface } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "./_lib/_AppContext";
import { BorderRadius, Colors, Spacing } from "./_lib/theme";
import { FontFamily, Typography } from "./_lib/typography";
import LoadingScreen from "./components/LoadingScreen";
import QuickAddModal from "./components/QuickAddModal";

const typeConfig = {
  income: { icon: "trending-up", color: "#10b981", label: "Income", sign: "+" },
  expense: { icon: "trending-down", color: "#ef4444", label: "Expense", sign: "-" },
  transfer: { icon: "sync", color: "#0ea5e9", label: "Transfer", sign: "↔" },
};

export default function HomeScreen() {
  const router = useRouter();
  const { accounts, transactions, loading, totalBalance, currency, refresh } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"income" | "expense" | "transfer">("income");

  const openQuickAdd = (type: "income" | "expense" | "transfer") => {
    setModalType(type);
    setModalVisible(true);
  };

  const navigateToTransactions = () => {
    router.push("/transactions");
  };

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthTx = transactions.filter((t: any) => t.date?.startsWith(thisMonth));
  const monthIncome = monthTx
    .filter((t: any) => t.type === "income")
    .reduce((sum: number, t: any) => sum + t.amount, 0);
  const monthExpense = monthTx
    .filter((t: any) => t.type === "expense")
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }} edges={["top"]}>
      <LinearGradient
        colors={["#7c3aed", "#a855f7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, Typography.heading.h2]}>Home</Text>
          <Text style={[styles.subtitle, Typography.body.md]}>Track your finances</Text>
        </View>

        {/* Balance Card */}
        <Surface style={styles.balanceCard} elevation={3}>
          {/* Top Section with Eye Icon */}
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Avatar.Icon
              size={32}
              icon="eye"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              color="#fff"
            />
          </View>

          {/* Balance Value */}
          <Text style={styles.balanceValue}>
            {currency}{totalBalance.toLocaleString()}
          </Text>

          {/* Income/Expense Indicators */}
          <View style={styles.balanceIndicators}>
            <View style={styles.indicator}>
              <Avatar.Icon
                size={28}
                icon="trending-up"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                color="#fff"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.indicatorLabel}>Income</Text>
                <Text style={[styles.indicatorAmount, { color: "#10b981" }]}>
                  +{currency}{monthIncome.toLocaleString()}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.indicator}>
              <Avatar.Icon
                size={28}
                icon="trending-down"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                color="#fff"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.indicatorLabel}>Expense</Text>
                <Text style={[styles.indicatorAmount, { color: "#ef4444" }]}>
                  -{currency}{monthExpense.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </Surface>

        {/* Quick Action Buttons */}
        <View style={styles.quickActionsContainer}>
          {Object.entries(typeConfig).map(([key, config]) => (
            <TouchableOpacity
              key={key}
              style={[styles.quickActionBtn, { backgroundColor: config.color }]}
              onPress={() => openQuickAdd(key as any)}
              activeOpacity={0.8}
            >
              <Avatar.Icon
                size={36}
                icon={config.icon}
                style={{ backgroundColor: "transparent" }}
                color="#fff"
              />
              <Text style={styles.quickActionLabel}>+ {config.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

         {/* My Accounts Section */}
         <View style={styles.accountsSection}>
           <View style={styles.accountsHeader}>
             <Text style={styles.accountsTitle}>My Accounts</Text>
             <TouchableOpacity onPress={() => router.push("/accounts")}>
               <Text style={styles.manageLink}>Manage ›</Text>
             </TouchableOpacity>
           </View>

          {accounts.length > 0 ? (
            <View style={styles.accountsGrid}>
              {accounts.map((acc: any) => (
                <Surface
                  key={acc.id}
                  style={styles.accountCard}
                  elevation={2}
                >
                  <View style={[styles.accountIconWrapper, { backgroundColor: acc.color }]}>
                    <Avatar.Icon
                      size={40}
                      icon={
                        acc.type === "bank"
                          ? "bank"
                          : acc.type === "wallet"
                          ? "wallet"
                          : "cash"
                      }
                      style={{ backgroundColor: acc.color }}
                      color="#fff"
                    />
                  </View>
                  <View style={styles.accountDetails}>
                    <Text style={styles.accountName}>{acc.name}</Text>
                    <Text style={styles.accountAmount}>
                      {currency}{(acc.balance || 0).toLocaleString()}
                    </Text>
                  </View>
                </Surface>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No accounts yet</Text>
            </View>
          )}
        </View>

         {/* Recent Transactions Section */}
         <View style={styles.transactionsSection}>
           <View style={styles.transactionsHeader}>
             <Text style={styles.transactionsTitle}>Recent Transactions</Text>
             <TouchableOpacity onPress={navigateToTransactions}>
               <Text style={styles.seeAllLink}>See all ›</Text>
             </TouchableOpacity>
           </View>

          {transactions.length > 0 ? (
            transactions.slice(0, 5).map((tx: any) => {
              const cfg = typeConfig[tx.type as keyof typeof typeConfig] || typeConfig.expense;
              return (
                <Surface
                  key={tx.id}
                  style={styles.transactionCard}
                  elevation={2}
                >
                  <View style={styles.transactionContent}>
                    <View style={[styles.txIconWrapper, { backgroundColor: cfg.color + "22" }]}>
                      <Avatar.Icon
                        size={32}
                        icon={cfg.icon}
                        style={{ backgroundColor: cfg.color }}
                        color="#fff"
                      />
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text style={styles.txName}>{tx.category || tx.type}</Text>
                      <Text style={styles.txMeta}>
                        {tx.account_name} · {tx.date}
                      </Text>
                    </View>
                    <Text style={[styles.txAmount, { color: cfg.color }]}>
                      {cfg.sign}{currency}{tx.amount?.toLocaleString()}
                    </Text>
                  </View>
                </Surface>
              );
            })
          ) : (
            <View style={styles.emptyTransactionState}>
              <Text style={styles.emptyTransactionText}>
                No transactions yet. Add your first transaction to get started!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <QuickAddModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        initialType={modalType}
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
  balanceCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.surface,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  balanceLabel: {
    color: Colors.text.primary,
    fontFamily: FontFamily.primarySemiBold,
    ...Typography.caption.md,
  },
  balanceValue: {
    color: Colors.primary,
    fontFamily: FontFamily.primaryBold,
    marginBottom: Spacing.md,
    letterSpacing: -1,
    ...Typography.display.lg,
  },
  balanceIndicators: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  indicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  indicatorLabel: {
    color: Colors.text.primary,
    fontFamily: FontFamily.primarySemiBold,
    ...Typography.caption.sm,
  },
  indicatorAmount: {
    fontFamily: FontFamily.primaryBold,
    marginTop: 4,
    ...Typography.caption.md,
  },
  quickActionsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  quickActionBtn: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: 18,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  quickActionLabel: {
    color: "#fff",
    fontFamily: FontFamily.primarySemiBold,
    ...Typography.caption.sm,
  },
  accountsSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  accountsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  accountsTitle: {
    color: Colors.text.primary,
    fontFamily: FontFamily.primaryBold,
    ...Typography.heading.h3,
  },
  manageLink: {
    color: Colors.primary,
    fontFamily: FontFamily.primarySemiBold,
    ...Typography.caption.md,
  },
  accountsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    justifyContent: "space-between",
  },
  accountCard: {
    width: "48%",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  accountIconWrapper: {
    borderRadius: BorderRadius.md,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontFamily: FontFamily.primarySemiBold,
    color: Colors.text.primary,
    ...Typography.subtitle.sm,
  },
  accountAmount: {
    fontFamily: FontFamily.primaryBold,
    color: Colors.primary,
    marginTop: 2,
    ...Typography.caption.md,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    color: Colors.text.secondary,
    fontFamily: FontFamily.primary,
    ...Typography.body.md,
  },
  transactionsSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  transactionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  transactionsTitle: {
    color: Colors.text.primary,
    fontFamily: FontFamily.primaryBold,
    ...Typography.heading.h3,
  },
  seeAllLink: {
    color: Colors.primary,
    fontFamily: FontFamily.primarySemiBold,
    ...Typography.caption.md,
  },
  transactionCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  transactionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  txIconWrapper: {
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  transactionDetails: {
    flex: 1,
  },
  txName: {
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
  txAmount: {
    fontFamily: FontFamily.primaryBold,
    color: Colors.text.primary,
    ...Typography.subtitle.lg,
  },
  emptyTransactionState: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  emptyTransactionText: {
    color: Colors.text.secondary,
    fontFamily: FontFamily.primary,
    textAlign: "center",
    lineHeight: 20,
    ...Typography.body.sm,
  },
});
