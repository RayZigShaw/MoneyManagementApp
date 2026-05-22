import dayjs from "dayjs";
import { LinearGradient as Gradient, LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Avatar, Menu, Surface } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "./_lib/_AppContext";
import { BorderRadius, Colors, Spacing } from "./_lib/theme";
import { FontFamily, Typography } from "./_lib/typography";
import { Account, CategorySummary, getAccountSummary, getCategoryReport, getMonthlyReport, MonthlyReport } from "./_services/_db-service";
import LoadingScreen from "./components/LoadingScreen";

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const { currency, loading: appLoading } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [monthlyData, setMonthlyData] = useState<MonthlyReport | null>(null);
  const [prevMonthData, setPrevMonthData] = useState<MonthlyReport | null>(null);
  const [categoryExpense, setCategoryExpense] = useState<CategorySummary[]>([]);
  const [fiveMonthsData, setFiveMonthsData] = useState<MonthlyReport[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthMenuVisible, setMonthMenuVisible] = useState(false);

  useEffect(() => {
    loadReportData();
  }, [selectedMonth]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const year = selectedMonth.year();
      const month = selectedMonth.month() + 1;
      const prevMonth = selectedMonth.subtract(1, 'month');
      const prevYear = prevMonth.year();
      const prevMonthNum = prevMonth.month() + 1;

      // Load current month, previous month, and category data
      const [monthly, prevMonthly, categories, accountsSummary] = await Promise.all([
        getMonthlyReport(year, month),
        getMonthlyReport(prevYear, prevMonthNum),
        getCategoryReport('expense', year, month),
        getAccountSummary(),
      ]);

      setMonthlyData(monthly);
      setPrevMonthData(prevMonthly);
      setCategoryExpense(categories.slice(0, 3)); // Top 3 categories
      setAccounts(accountsSummary as any);

      // Load last 5 months for trend
      const fiveMonths: MonthlyReport[] = [];
      for (let i = 4; i >= 0; i--) {
        const m = selectedMonth.subtract(i, 'month');
        const report = await getMonthlyReport(m.year(), m.month() + 1);
        fiveMonths.push(report);
      }
      setFiveMonthsData(fiveMonths);
    } catch (e) {
      console.error('Error loading reports:', e);
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => setSelectedMonth(selectedMonth.add(1, 'month'));
  const prevMonth = () => setSelectedMonth(selectedMonth.subtract(1, 'month'));

  if (appLoading || loading) return <LoadingScreen />;

  const maxExpenseAmount = Math.max(...categoryExpense.map(c => c.amount), 1);
  const categoryColors = ['#f97316', '#3b82f6', '#a855f7'];

  // Calculate account total balance
  const totalAccountBalance = (accounts as any).reduce((sum: number, acc: any) => sum + acc.balance, 0);
  const accountDistribution = (accounts as any).map((acc: any) => ({
    ...acc,
    percentage: totalAccountBalance > 0 ? (acc.balance / totalAccountBalance) * 100 : 0,
  }));

  // Calculate trend data for chart
  const maxTrendAmount = Math.max(...fiveMonthsData.map(m => Math.max(m.income, m.expense)), 1);
  const chartHeight = 150;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={["top"]}>
      <LinearGradient
        colors={["#6366f1", "#8b5cf6", "#6366f1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, Typography.heading.h2]}>Reports</Text>
        </View>

        {/* Month Selector */}
        <Surface style={styles.monthSelector} elevation={2}>
          <TouchableOpacity onPress={prevMonth} style={styles.monthButton}>
            <Avatar.Icon size={32} icon="chevron-left" style={{ backgroundColor: Colors.surfaceVariant }} color={Colors.primary} />
          </TouchableOpacity>
          <Menu visible={monthMenuVisible} onDismiss={() => setMonthMenuVisible(false)} anchor={
            <TouchableOpacity onPress={() => setMonthMenuVisible(true)} style={styles.monthDisplay}>
              <Text style={[Typography.subtitle.md, { fontFamily: FontFamily.primarySemiBold, color: Colors.text.primary }]}>
                {selectedMonth.format('MMMM YYYY')}
              </Text>
            </TouchableOpacity>
          }>
            {Array.from({ length: 12 }).map((_, i) => {
              const month = dayjs().month(i);
              return (
                <Menu.Item key={i} title={month.format('MMMM')} onPress={() => {
                  setSelectedMonth(dayjs().month(i));
                  setMonthMenuVisible(false);
                }} />
              );
            })}
          </Menu>
          <TouchableOpacity onPress={nextMonth} style={styles.monthButton}>
            <Avatar.Icon size={32} icon="chevron-right" style={{ backgroundColor: Colors.surfaceVariant }} color={Colors.primary} />
          </TouchableOpacity>
        </Surface>

        {/* Main Summary Cards */}
        {monthlyData && (
          <View style={styles.summaryGrid}>
            <Surface style={styles.summaryCardAlt} elevation={1}>
              <View style={styles.summaryCardContent}>
                <Text style={[styles.summaryCardLabel, Typography.caption.sm]}>Income</Text>
                <Text style={[styles.summaryCardAmount, Typography.heading.h3]}>{currency}{monthlyData.income.toLocaleString()}</Text>
              </View>
            </Surface>

            <Surface style={styles.summaryCardAlt} elevation={1}>
              <View style={styles.summaryCardContent}>
                <Text style={[styles.summaryCardLabel, Typography.caption.sm]}>Expenses</Text>
                <Text style={[styles.summaryCardAmount, Typography.heading.h3]}>{currency}{monthlyData.expense.toLocaleString()}</Text>
              </View>
            </Surface>

            <Surface style={styles.summaryCardAlt} elevation={1}>
              <View style={styles.summaryCardContent}>
                <Text style={[styles.summaryCardLabel, Typography.caption.sm]}>Net</Text>
                <Text style={[styles.summaryCardAmount, Typography.heading.h3, { color: monthlyData.net >= 0 ? Colors.success : Colors.error }]}>
                  {currency}{monthlyData.net.toLocaleString()}
                </Text>
              </View>
            </Surface>
          </View>
        )}

        {/* 5-Month Trend */}
        {fiveMonthsData.length > 0 && (
          <Surface style={styles.card} elevation={1}>
            <Text style={[styles.cardTitle, Typography.heading.h4]}>5-Month Trend</Text>
            
            <View style={styles.chartContainer}>
              <View style={styles.chartYAxis}>
                <Text style={[styles.chartYLabel, Typography.caption.xs]}>{currency}{(maxTrendAmount / 1000).toFixed(0)}k</Text>
                <Text style={[styles.chartYLabel, Typography.caption.xs]}>{currency}0</Text>
              </View>

              <View style={styles.chart}>
                {fiveMonthsData.map((month, idx) => {
                  const incomeHeight = Math.max((month.income / maxTrendAmount) * chartHeight, 8);
                  const expenseHeight = Math.max((month.expense / maxTrendAmount) * chartHeight, 8);
                  const monthName = dayjs(month.month).format('MMM');

                  return (
                    <View key={idx} style={styles.chartColumn}>
                      <View style={styles.chartBars}>
                        <View style={styles.barWrapper}>
                          <Gradient
                            colors={['#10b981', '#059669']}
                            start={{ x: 0, y: 1 }}
                            end={{ x: 0, y: 0 }}
                            style={[styles.chartBar, { height: incomeHeight }]}
                          />
                        </View>
                        <View style={styles.barWrapper}>
                          <Gradient
                            colors={['#ef4444', '#dc2626']}
                            start={{ x: 0, y: 1 }}
                            end={{ x: 0, y: 0 }}
                            style={[styles.chartBar, { height: expenseHeight }]}
                          />
                        </View>
                      </View>
                      <Text style={[styles.chartLabel, Typography.caption.xs]}>{monthName}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                <Text style={[styles.legendText, Typography.caption.sm]}>Income</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                <Text style={[styles.legendText, Typography.caption.sm]}>Expense</Text>
              </View>
            </View>
          </Surface>
        )}

        {/* Spending by Category */}
        {categoryExpense.length > 0 && (
          <Surface style={styles.card} elevation={1}>
            <Text style={[styles.cardTitle, Typography.heading.h4]}>Spending by Category</Text>
            
            {categoryExpense.map((cat, idx) => (
              <View key={idx} style={styles.categoryRow}>
                <View style={styles.categoryRowContent}>
                  <View style={[styles.categoryDot, { backgroundColor: categoryColors[idx] }]} />
                  <View style={styles.categoryRowInfo}>
                    <Text style={[styles.categoryRowName, Typography.body.md]}>{cat.category}</Text>
                    <Text style={[styles.categoryRowAmount, Typography.body.md, { fontFamily: FontFamily.primarySemiBold }]}>
                      {currency}{cat.amount.toLocaleString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.percentBar}>
                  <Gradient
                    colors={[categoryColors[idx], categoryColors[idx] + 'cc']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.percentFill, { width: `${(cat.amount / maxExpenseAmount) * 100}%` }]}
                  />
                </View>
              </View>
            ))}
          </Surface>
        )}

        {/* Account Balances */}
        {accountDistribution.length > 0 && (
          <Surface style={styles.card} elevation={1}>
            <Text style={[styles.cardTitle, Typography.heading.h4]}>Account Balances</Text>
            
            {accountDistribution.map((acc: any, idx: number) => (
              <View key={idx} style={styles.accountRow}>
                <View style={styles.accountInfo}>
                  <Text style={[styles.accountName, Typography.body.md]}>{acc.accountName}</Text>
                  <Text style={[styles.accountBalance, Typography.heading.h4]}>{currency}{acc.balance.toLocaleString()}</Text>
                </View>
                <View style={styles.accountPercentage}>
                  <Text style={[styles.percentageText, Typography.body.md, { fontFamily: FontFamily.primarySemiBold }]}>
                    {acc.percentage.toFixed(0)}%
                  </Text>
                </View>
              </View>
            ))}

            {/* Stacked progress bar */}
            <View style={styles.accountStackedBar}>
              {accountDistribution.map((acc: any, idx: number) => (
                <View
                  key={idx}
                  style={[
                    styles.stackedBarSegment,
                    { width: `${acc.percentage}%`, backgroundColor: categoryColors[idx] || Colors.primary },
                  ]}
                />
              ))}
            </View>
          </Surface>
        )}

        {/* vs Previous Month */}
        {monthlyData && prevMonthData && (
          <Surface style={styles.card} elevation={1}>
            <Text style={[styles.cardTitle, Typography.heading.h4]}>vs Previous Month</Text>
            
            <View style={styles.comparisonGrid}>
              <View style={styles.comparisonColumn}>
                <Text style={[styles.comparisonLabel, Typography.caption.sm]}>Prev Income</Text>
                <Text style={[styles.comparisonValue, Typography.heading.h3]}>{currency}{prevMonthData.income.toLocaleString()}</Text>
              </View>
              <View style={styles.comparisonColumn}>
                <Text style={[styles.comparisonLabel, Typography.caption.sm]}>This Income</Text>
                <View style={styles.comparisonValueWithTrend}>
                  <Text style={[styles.comparisonValue, Typography.heading.h3]}>{currency}{monthlyData.income.toLocaleString()}</Text>
                  <Text style={[styles.trendArrow, { color: monthlyData.income >= prevMonthData.income ? Colors.success : Colors.error }]}>
                    {monthlyData.income >= prevMonthData.income ? '↑' : '↓'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.comparisonDivider} />

            <View style={styles.comparisonGrid}>
              <View style={styles.comparisonColumn}>
                <Text style={[styles.comparisonLabel, Typography.caption.sm]}>Prev Expense</Text>
                <Text style={[styles.comparisonValue, Typography.heading.h3]}>{currency}{prevMonthData.expense.toLocaleString()}</Text>
              </View>
              <View style={styles.comparisonColumn}>
                <Text style={[styles.comparisonLabel, Typography.caption.sm]}>This Expense</Text>
                <View style={styles.comparisonValueWithTrend}>
                  <Text style={[styles.comparisonValue, Typography.heading.h3]}>{currency}{monthlyData.expense.toLocaleString()}</Text>
                  <Text style={[styles.trendArrow, { color: monthlyData.expense <= prevMonthData.expense ? Colors.success : Colors.error }]}>
                    {monthlyData.expense <= prevMonthData.expense ? '↓' : '↑'}
                  </Text>
                </View>
              </View>
            </View>
          </Surface>
        )}
      </ScrollView>
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
    marginBottom: Spacing.lg,
    zIndex: 1,
  },
  title: {
    color: Colors.text.primary,
    fontFamily: FontFamily.primaryBold,
  },
  subtitle: {
    color: Colors.text.secondary,
    fontFamily: FontFamily.primary,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
  },
  monthButton: {
    padding: Spacing.sm,
  },
  monthDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Summary Grid
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  summaryCardAlt: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
  },
  summaryCardContent: {
    alignItems: 'center',
  },
  summaryCardLabel: {
    color: Colors.text.secondary,
    fontFamily: FontFamily.primary,
    marginBottom: Spacing.xs,
  },
  summaryCardAmount: {
    color: Colors.primary,
    fontFamily: FontFamily.primaryBold,
  },

  // Card Container
  card: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  cardTitle: {
    color: Colors.text.primary,
    fontFamily: FontFamily.primaryBold,
    marginBottom: Spacing.lg,
  },

  // Chart Styles
  chartContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    height: 200,
  },
  chartYAxis: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: Spacing.sm,
    width: 50,
  },
  chartYLabel: {
    color: Colors.text.secondary,
    fontFamily: FontFamily.primary,
  },
  chart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingLeft: Spacing.sm,
    gap: Spacing.sm,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBars: {
    flexDirection: 'row',
    height: 150,
    alignItems: 'flex-end',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  barWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  chartBar: {
    borderRadius: BorderRadius.sm,
    minHeight: 8,
  },
  chartLabel: {
    color: Colors.text.secondary,
    fontFamily: FontFamily.primary,
    marginTop: Spacing.xs,
  },
  chartLegend: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: Colors.text.secondary,
    fontFamily: FontFamily.primary,
  },

  // Category Row
  categoryRow: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.md,
  },
  categoryRowInfo: {
    flex: 1,
  },
  categoryRowName: {
    color: Colors.text.primary,
    fontFamily: FontFamily.primary,
    marginBottom: Spacing.xs,
  },
  categoryRowAmount: {
    color: Colors.primary,
    fontFamily: FontFamily.primarySemiBold,
  },
  percentBar: {
    height: 4,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.xs,
    overflow: 'hidden',
  },
  percentFill: {
    height: '100%',
  },

  // Account Row
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    color: Colors.text.primary,
    fontFamily: FontFamily.primary,
    marginBottom: Spacing.xs,
  },
  accountBalance: {
    color: Colors.primary,
    fontFamily: FontFamily.primaryBold,
  },
  accountPercentage: {
    paddingHorizontal: Spacing.md,
  },
  percentageText: {
    color: Colors.primary,
    fontFamily: FontFamily.primarySemiBold,
  },
  accountStackedBar: {
    height: 8,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: Spacing.lg,
  },
  stackedBarSegment: {
    height: '100%',
  },

  // Comparison
  comparisonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  comparisonColumn: {
    flex: 1,
  },
  comparisonLabel: {
    color: Colors.text.secondary,
    fontFamily: FontFamily.primary,
    marginBottom: Spacing.xs,
  },
  comparisonValue: {
    color: Colors.primary,
    fontFamily: FontFamily.primaryBold,
  },
  comparisonValueWithTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  trendArrow: {
    fontSize: 20,
    fontFamily: FontFamily.primaryBold,
  },
  comparisonDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
});

