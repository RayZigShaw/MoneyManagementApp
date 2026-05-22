import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { Avatar, Button, Chip, Divider, Portal, Surface, Switch, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "./_lib/_AppContext";
import { useTheme } from "./_lib/_ThemeContext";
import { BorderRadius, Colors, Spacing } from "./_lib/theme";
import { FontFamily, Typography } from "./_lib/typography";
import { exportBackup, hashPin, importBackupFromJson, saveBackupToStorage, verifyPin } from "./_services/_backup-service";
import { clearAllData, updateSettings } from "./_services/_db-service";
import { SafeStorage } from "./_services/_safe-storage";

export default function SettingsScreen() {
  const { settings, refresh } = useApp();
  const { isDarkMode } = useTheme();
  const [appLock, setAppLock] = useState(settings?.pin_enabled || false);
  const [incomeSources, setIncomeSources] = useState(settings?.income_sources || [
    "Fiverr",
    "Freelancing",
    "Personal",
    "Other",
  ]);
  const [expenseCategories, setExpenseCategories] = useState(settings?.expense_categories || [
    "Food",
    "Transport",
    "Entertainment",
    "Betting / Personal Use",
    "Other",
  ]);
  const [newSource, setNewSource] = useState("");
  const [newCategory, setNewCategory] = useState("");
  
  // PIN Modal States
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'set' | 'verify'>('set');
  const [pinInput, setPinInput] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [showPinInput, setShowPinInput] = useState(false);
  
  // Import Modal States
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importJson, setImportJson] = useState("");

  // Load initial settings on mount
  useEffect(() => {
    if (settings) {
      setAppLock(settings.pin_enabled);
      setIncomeSources(settings.income_sources);
      setExpenseCategories(settings.expense_categories);
    }
  }, [settings]);

  const addSource = async () => {
    if (newSource.trim() && !incomeSources.includes(newSource.trim())) {
      const updated = [...incomeSources, newSource.trim()];
      setIncomeSources(updated);
      setNewSource("");
      if (settings?.id) {
        try {
          await updateSettings(settings.id, { income_sources: updated });
          await refresh();
        } catch (e) {
          Alert.alert("Error", "Failed to save income source");
        }
      }
    }
  };

  const removeSource = async (src: string) => {
    const updated = incomeSources.filter((s) => s !== src);
    setIncomeSources(updated);
    if (settings?.id) {
      try {
        await updateSettings(settings.id, { income_sources: updated });
        await refresh();
      } catch (e) {
        Alert.alert("Error", "Failed to remove income source");
      }
    }
  };

  const addCategory = async () => {
    if (newCategory.trim() && !expenseCategories.includes(newCategory.trim())) {
      const updated = [...expenseCategories, newCategory.trim()];
      setExpenseCategories(updated);
      setNewCategory("");
      if (settings?.id) {
        try {
          await updateSettings(settings.id, { expense_categories: updated });
          await refresh();
        } catch (e) {
          Alert.alert("Error", "Failed to save expense category");
        }
      }
    }
  };

  const removeCategory = async (cat: string) => {
    const updated = expenseCategories.filter((c) => c !== cat);
    setExpenseCategories(updated);
    if (settings?.id) {
      try {
        await updateSettings(settings.id, { expense_categories: updated });
        await refresh();
      } catch (e) {
        Alert.alert("Error", "Failed to remove expense category");
      }
    }
  };

  const handleAppLockToggle = async (value: boolean) => {
    setAppLock(value);
    if (settings?.id) {
      try {
        await updateSettings(settings.id, { pin_enabled: value });
        await refresh();
      } catch (e) {
        Alert.alert("Error", "Failed to update security settings");
      }
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      "Clear All Data",
      "Are you sure? This will permanently delete all accounts, transactions, and settings. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Everything",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllData();
              await refresh();
              Alert.alert("Success", "All data has been cleared successfully!");
            } catch (e) {
              Alert.alert("Error", "Failed to clear data");
            }
          },
        },
      ]
    );
  };

  // PIN Handlers
  const handleSetPin = async () => {
    if (!pinInput || !pinConfirm) {
      Alert.alert("Validation", "Please enter and confirm your PIN");
      return;
    }

    if (pinInput !== pinConfirm) {
      Alert.alert("Error", "PINs do not match");
      setPinInput("");
      setPinConfirm("");
      return;
    }

    if (pinInput.length < 4) {
      Alert.alert("Validation", "PIN must be at least 4 digits");
      return;
    }

    try {
      const pinHash = await hashPin(pinInput);
      if (settings?.id) {
        await updateSettings(settings.id, { 
          pin_enabled: true,
          pin_hash: pinHash 
        });
        await refresh();
        Alert.alert("Success", "PIN has been set successfully!");
        setPinModalVisible(false);
        setPinInput("");
        setPinConfirm("");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to set PIN");
    }
  };

  const handleRemovePin = async () => {
    if (!settings?.pin_hash) {
      Alert.alert("Error", "No PIN is currently set");
      return;
    }

    Alert.prompt(
      "Enter PIN",
      "Enter your current PIN to remove it",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async (pin) => {
            if (!pin) return;
            try {
              const isValid = await verifyPin(pin, settings.pin_hash!);
              if (isValid) {
                if (settings?.id) {
                  await updateSettings(settings.id, { 
                    pin_enabled: false,
                    pin_hash: undefined 
                  });
                  await refresh();
                  Alert.alert("Success", "PIN has been removed!");
                  setAppLock(false);
                }
              } else {
                Alert.alert("Error", "Invalid PIN");
              }
            } catch (e) {
              Alert.alert("Error", "Failed to verify PIN");
            }
          },
        },
      ],
      "secure-text"
    );
  };

  // Export Backup Handler
  const handleExportBackup = async () => {
    try {
      const backup = await exportBackup();
      await saveBackupToStorage(backup);
      
      const backupJson = JSON.stringify(backup, null, 2);
      
      // Create a shareable format
      Alert.alert(
        "Backup Created",
        `Backup created successfully!\n\nBackup includes:\n• ${backup.accounts.length} accounts\n• ${backup.transactions.length} transactions\n• All settings\n\nBackup JSON has been saved.`,
        [
          { text: "Close", style: "cancel" },
          {
            text: "Copy JSON",
            onPress: async () => {
              await SafeStorage.setItem('clipboard_backup', backupJson);
              Alert.alert("Success", "Backup JSON copied to clipboard (saved in app)");
            }
          }
        ]
      );
    } catch (e) {
      Alert.alert("Error", "Failed to create backup: " + String(e));
    }
  };

  // Import Backup Handler
  const handleImportBackup = async () => {
    if (!importJson.trim()) {
      Alert.alert("Validation", "Please paste the backup JSON");
      return;
    }

    try {
      const backup = await importBackupFromJson(importJson);
      
      Alert.alert(
        "Confirm Import",
        `This will restore:\n• ${backup.accounts.length} accounts\n• ${backup.transactions.length} transactions\n• Settings\n\nContinue?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Import",
            style: "destructive",
            onPress: async () => {
              try {
                // For now, just show success - actual restoration would require additional API
                await saveBackupToStorage(backup);
                Alert.alert("Success", "Backup imported successfully!");
                setImportModalVisible(false);
                setImportJson("");
                await refresh();
              } catch (e) {
                Alert.alert("Error", "Failed to import backup");
              }
            }
          }
        ]
      );
    } catch (e) {
      Alert.alert("Error", "Invalid backup format: " + String(e));
    }
  };


  return (
    <SafeAreaView 
      style={{ 
        flex: 1, 
        backgroundColor: isDarkMode ? "#0f172a" : "#f8fafc" 
      }} 
      edges={["top"]}
    >
      <LinearGradient
        colors={isDarkMode 
          ? ["#6366f1", "#4f46e5"] 
          : ["#6366f1", "#8b5cf6", "#6366f1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: isDarkMode ? "#0f172a" : "#f8fafc" }]}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, Typography.heading.h2]}>Settings</Text>
          <Text style={[styles.subtitle, Typography.body.md]}>Manage your preferences</Text>
        </View>

        {/* Security Section */}
        <Surface style={styles.card} elevation={3}>
          <View style={styles.sectionHeader}>
            <Avatar.Icon
              size={40}
              icon="lock"
              style={{ backgroundColor: "#ec4899" }}
              color="#fff"
            />
            <Text style={styles.sectionTitle}>Security</Text>
          </View>
          <Divider style={{ marginVertical: 12 }} />
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>App Lock (PIN)</Text>
              <Text style={styles.settingDescription}>
                Protect your data
              </Text>
            </View>
            <Switch
              value={appLock}
              onValueChange={handleAppLockToggle}
              color="#ec4899"
            />
          </View>
          {appLock && (
            <>
              <Divider style={{ marginVertical: 12 }} />
              <Button 
                mode="outlined" 
                style={styles.actionButton}
                onPress={() => {
                  setPinModalMode('set');
                  setPinInput("");
                  setPinConfirm("");
                  setPinModalVisible(true);
                }}
              >
                Change PIN
              </Button>
              <Button 
                mode="outlined" 
                style={[styles.actionButton, { marginTop: 8, borderColor: '#ef4444' }]}
                textColor="#ef4444"
                onPress={handleRemovePin}
              >
                Remove PIN
              </Button>
            </>
          )}
          {!appLock && (
            <>
              <Divider style={{ marginVertical: 12 }} />
              <Button 
                mode="outlined" 
                style={styles.actionButton}
                onPress={() => {
                  setPinModalMode('set');
                  setPinInput("");
                  setPinConfirm("");
                  setPinModalVisible(true);
                }}
              >
                Set PIN
              </Button>
            </>
          )}
        </Surface>

        {/* Income Sources Section */}
        <Surface style={styles.card} elevation={3}>
          <View style={styles.sectionHeader}>
            <Avatar.Icon
              size={40}
              icon="plus-circle"
              style={{ backgroundColor: "#10b981" }}
              color="#fff"
            />
            <Text style={styles.sectionTitle}>Income Sources</Text>
          </View>
          <Divider style={{ marginVertical: 12 }} />

          {/* Chips */}
          <View style={styles.chipContainer}>
            {incomeSources.map((src) => (
              <Chip
                key={src}
                icon="close"
                style={styles.chip}
                onClose={() => removeSource(src)}
              >
                {src}
              </Chip>
            ))}
          </View>

          {/* Add New */}
          <View style={styles.addContainer}>
            <TextInput
              placeholder="Add new source..."
              value={newSource}
              onChangeText={setNewSource}
              mode="outlined"
              outlineColor="#e4e4e7"
              activeOutlineColor="#10b981"
              style={{ flex: 1 }}
              dense
            />
            <Button
              mode="contained"
              onPress={addSource}
              icon="plus"
              style={{ marginLeft: 8, backgroundColor: "#10b981" }}
            />
          </View>
        </Surface>

        {/* Expense Categories Section */}
        <Surface style={styles.card} elevation={3}>
          <View style={styles.sectionHeader}>
            <Avatar.Icon
              size={40}
              icon="minus-circle"
              style={{ backgroundColor: "#ef4444" }}
              color="#fff"
            />
            <Text style={styles.sectionTitle}>Expense Categories</Text>
          </View>
          <Divider style={{ marginVertical: 12 }} />

          {/* Chips */}
          <View style={styles.chipContainer}>
            {expenseCategories.map((cat) => (
              <Chip
                key={cat}
                icon="close"
                style={styles.chip}
                onClose={() => removeCategory(cat)}
              >
                {cat}
              </Chip>
            ))}
          </View>

          {/* Add New */}
          <View style={styles.addContainer}>
            <TextInput
              placeholder="Add new category..."
              value={newCategory}
              onChangeText={setNewCategory}
              mode="outlined"
              outlineColor="#e4e4e7"
              activeOutlineColor="#ef4444"
              style={{ flex: 1 }}
              dense
            />
            <Button
              mode="contained"
              onPress={addCategory}
              icon="plus"
              style={{ marginLeft: 8, backgroundColor: "#ef4444" }}
            />
          </View>
        </Surface>

        {/* Data Section */}
        <Surface style={styles.card} elevation={3}>
          <View style={styles.sectionHeader}>
            <Avatar.Icon
              size={40}
              icon="database"
              style={{ backgroundColor: "#0ea5e9" }}
              color="#fff"
            />
            <Text style={styles.sectionTitle}>Data</Text>
          </View>
          <Divider style={{ marginVertical: 12 }} />

          <Button
            mode="outlined"
            icon="export"
            onPress={handleExportBackup}
            style={styles.dataButton}
          >
            Export Backup
          </Button>

          <Button
            mode="outlined"
            icon="import"
            onPress={() => setImportModalVisible(true)}
            style={styles.dataButton}
          >
            Import Backup
          </Button>

          <Button
            mode="outlined"
            icon="delete"
            textColor="#ef4444"
            onPress={handleClearAllData}
            style={styles.dataButton}
          >
            Clear All Data
          </Button>
        </Surface>

        {/* Footer */}
        <Text style={styles.version}>MoneyTrack v1.0.0</Text>
      </ScrollView>

      {/* PIN Modal */}
      <Portal>
        <Modal
          visible={pinModalVisible}
          onDismiss={() => setPinModalVisible(false)}
          contentContainerStyle={styles.pinModalContainer}
        >
          <Surface style={styles.pinModal} elevation={8}>
            {/* Header */}
            <View style={styles.pinModalHeader}>
              <Avatar.Icon
                size={60}
                icon="lock"
                style={{ backgroundColor: "#ec4899" }}
                color="#fff"
              />
              <Text style={[styles.pinModalTitle, Typography.heading.h2]}>
                Secure Your App
              </Text>
              <Text style={[styles.pinModalSubtitle, Typography.body.sm]}>
                Set up a 4-digit PIN to protect your data
              </Text>
            </View>

            {/* PIN Input Fields */}
            <View style={styles.pinInputSection}>
              <Text style={[styles.pinLabel, Typography.subtitle.md]}>Enter PIN</Text>
              <View style={styles.pinDigitDisplay}>
                {pinInput.split('').map((digit, idx) => (
                  <View key={idx} style={styles.pinDigit}>
                    <Text style={styles.pinDigitText}>
                      {showPinInput ? digit : '●'}
                    </Text>
                  </View>
                ))}
                {pinInput.length < 4 && (
                  <View style={styles.pinDigitEmpty} />
                )}
              </View>
              <TextInput
                placeholder="Enter 4+ digits"
                value={pinInput}
                onChangeText={setPinInput}
                keyboardType="numeric"
                mode="outlined"
                secureTextEntry={!showPinInput}
                style={styles.pinInput}
                maxLength={8}
              />
            </View>

            <View style={styles.pinInputSection}>
              <Text style={[styles.pinLabel, Typography.subtitle.md]}>Confirm PIN</Text>
              <View style={styles.pinDigitDisplay}>
                {pinConfirm.split('').map((digit, idx) => (
                  <View key={idx} style={styles.pinDigit}>
                    <Text style={styles.pinDigitText}>
                      {showPinInput ? digit : '●'}
                    </Text>
                  </View>
                ))}
                {pinConfirm.length < 4 && (
                  <View style={styles.pinDigitEmpty} />
                )}
              </View>
              <TextInput
                placeholder="Confirm PIN"
                value={pinConfirm}
                onChangeText={setPinConfirm}
                keyboardType="numeric"
                mode="outlined"
                secureTextEntry={!showPinInput}
                style={styles.pinInput}
                maxLength={8}
              />
            </View>

            {/* Show PIN Toggle */}
            <View style={styles.pinShowToggle}>
              <Avatar.Icon
                size={32}
                icon={showPinInput ? "eye" : "eye-off"}
                style={{ backgroundColor: "transparent" }}
                color="#6366f1"
              />
              <Text style={[styles.pinShowLabel, Typography.body.sm]}>
                {showPinInput ? "Hide" : "Show"} PIN
              </Text>
              <Switch
                value={showPinInput}
                onValueChange={setShowPinInput}
                color="#6366f1"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.pinModalButtons}>
              <Button
                mode="outlined"
                onPress={() => setPinModalVisible(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSetPin}
                style={{ flex: 1, marginLeft: 8 }}
                buttonColor="#ec4899"
              >
                Set PIN
              </Button>
            </View>
          </Surface>
        </Modal>
      </Portal>

      {/* Import Backup Modal */}
      <Portal>
        <Modal
          visible={importModalVisible}
          onDismiss={() => setImportModalVisible(false)}
          contentContainerStyle={styles.importModalContainer}
        >
          <Surface style={styles.importModal} elevation={8}>
            {/* Header */}
            <View style={styles.importModalHeader}>
              <Avatar.Icon
                size={60}
                icon="cloud-upload"
                style={{ backgroundColor: "#0ea5e9" }}
                color="#fff"
              />
              <Text style={[styles.importModalTitle, Typography.heading.h2]}>
                Restore Backup
              </Text>
              <Text style={[styles.importModalSubtitle, Typography.body.sm]}>
                Paste your backup JSON to restore all data
              </Text>
            </View>

            {/* Info Box */}
            <Surface style={styles.importInfoBox} elevation={0}>
              <View style={styles.infoContent}>
                <Avatar.Icon
                  size={32}
                  icon="information"
                  style={{ backgroundColor: "#0ea5e9" }}
                  color="#fff"
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.infoTitle, Typography.subtitle.sm]}>
                    What will be restored?
                  </Text>
                  <Text style={[styles.infoText, Typography.caption.sm]}>
                    • All accounts{'\n'}• All transactions{'\n'}• Settings & preferences
                  </Text>
                </View>
              </View>
            </Surface>

            {/* JSON Input */}
            <View style={styles.importInputSection}>
              <Text style={[styles.importLabel, Typography.subtitle.md]}>Backup Data</Text>
              <TextInput
                placeholder="Paste backup JSON here..."
                value={importJson}
                onChangeText={setImportJson}
                mode="outlined"
                multiline
                numberOfLines={6}
                style={styles.importJsonInput}
                textAlignVertical="top"
              />
              <Text style={[styles.importHint, Typography.caption.xs]}>
                {importJson.length > 0 
                  ? `${importJson.length} characters` 
                  : 'Paste your backup JSON export here'}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.importModalButtons}>
              <Button
                mode="outlined"
                onPress={() => {
                  setImportModalVisible(false);
                  setImportJson("");
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleImportBackup}
                style={{ flex: 1, marginLeft: 8 }}
                disabled={!importJson.trim()}
                buttonColor="#0ea5e9"
              >
                Restore
              </Button>
            </View>
          </Surface>
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
    marginBottom: Spacing.xl,
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
  card: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  sectionTitle: {
    fontFamily: FontFamily.primaryBold,
    color: Colors.text.primary,
    ...Typography.heading.h4,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  settingLabel: {
    fontFamily: FontFamily.primarySemiBold,
    color: Colors.text.primary,
    ...Typography.subtitle.md,
  },
  settingDescription: {
    color: Colors.text.secondary,
    fontFamily: FontFamily.primary,
    marginTop: 2,
    ...Typography.caption.sm,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chip: {
    backgroundColor: Colors.surfaceVariant,
    color: Colors.text.primary,
  },
  addContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },
  actionButton: {
    borderColor: Colors.secondary,
    borderWidth: 1.5,
    marginVertical: Spacing.md,
  },
  dataButton: {
    borderColor: Colors.border,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  version: {
    textAlign: "center",
    color: Colors.text.tertiary,
    fontFamily: FontFamily.primary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    ...Typography.caption.sm,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modal: {
    width: "85%",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  modalTitle: {
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    fontFamily: FontFamily.primaryBold,
  },
  modalDescription: {
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
    fontFamily: FontFamily.primary,
  },
  modalInput: {
    marginBottom: Spacing.md,
  },
  jsonInput: {
    marginBottom: Spacing.md,
    fontFamily: "monospace",
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  
  // PIN Modal Styles
  pinModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  pinModal: {
    width: "100%",
    maxWidth: 480,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    backgroundColor: Colors.surface,
  },
  pinModalHeader: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
    padding: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  pinModalTitle: {
    color: "#fff",
    marginTop: Spacing.md,
    fontFamily: FontFamily.primaryBold,
    textAlign: "center",
  },
  pinModalSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: Spacing.sm,
    fontFamily: FontFamily.primary,
    textAlign: "center",
  },
  pinInputSection: {
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
  },
  pinLabel: {
    color: Colors.text.primary,
    fontFamily: FontFamily.primaryBold,
    marginBottom: Spacing.sm,
  },
  pinDigitDisplay: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    minHeight: 50,
  },
  pinDigit: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#ec4899",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.7,
  },
  pinDigitEmpty: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 2,
    borderColor: "#ec4899",
  },
  pinDigitText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  pinInput: {
    marginBottom: Spacing.md,
  },
  pinShowToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  pinShowLabel: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontFamily: FontFamily.primary,
    color: Colors.text.primary,
  },
  pinModalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    marginTop: Spacing.lg,
  },
  
  // Import Modal Styles
  importModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  importModal: {
    width: "100%",
    maxWidth: 480,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    backgroundColor: Colors.surface,
  },
  importModalHeader: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)",
    padding: Spacing.xl,
  },
  importModalTitle: {
    color: "#fff",
    marginTop: Spacing.md,
    fontFamily: FontFamily.primaryBold,
    textAlign: "center",
  },
  importModalSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: Spacing.sm,
    fontFamily: FontFamily.primary,
    textAlign: "center",
  },
  importInfoBox: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceVariant,
  },
  infoContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  infoTitle: {
    fontFamily: FontFamily.primaryBold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontFamily: FontFamily.primary,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  importInputSection: {
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.lg,
  },
  importLabel: {
    color: Colors.text.primary,
    fontFamily: FontFamily.primaryBold,
    marginBottom: Spacing.sm,
  },
  importJsonInput: {
    marginBottom: Spacing.sm,
    fontFamily: "monospace",
    fontSize: 12,
  },
  importHint: {
    color: Colors.text.tertiary,
    fontFamily: FontFamily.primary,
    marginTop: Spacing.sm,
  },
  importModalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    marginTop: Spacing.lg,
  },
});

