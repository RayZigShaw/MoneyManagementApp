import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Avatar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { BorderRadius, Spacing } from "../_lib/theme";
import { FontFamily, Typography } from "../_lib/typography";
import { verifyPin } from "../_services/_backup-service";

interface PINScreenProps {
  onPINVerified: () => void;
  pinHash: string;
  isDarkMode: boolean;
}

export default function PINScreen({ onPINVerified, pinHash, isDarkMode }: PINScreenProps) {
  const [pinInput, setPinInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);

  // Arrange digits in 3 columns
  const digitRows = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "backspace"],
  ];

  const handleDigitPress = (digit: string) => {
    if (locked) return;
    if (pinInput.length < 8) {
      setPinInput(pinInput + digit);
    }
  };

  const handleBackspace = () => {
    if (locked) return;
    setPinInput(pinInput.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (locked) return;
    if (pinInput.length < 4) {
      Alert.alert("Error", "PIN must be at least 4 digits");
      return;
    }

    try {
      const isValid = await verifyPin(pinInput, pinHash);
      if (isValid) {
        setPinInput("");
        setAttempts(0);
        onPINVerified();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 5) {
          setLocked(true);
          Alert.alert(
            "Locked",
            "Too many failed attempts. Please try again later.",
            [
              {
                text: "OK",
                onPress: () => {
                  // After 30 seconds, unlock
                  setTimeout(() => {
                    setLocked(false);
                    setAttempts(0);
                    setPinInput("");
                  }, 30000);
                },
              },
            ]
          );
        } else {
          Alert.alert("Error", `Incorrect PIN. ${5 - newAttempts} attempts remaining.`);
          setPinInput("");
        }
      }
    } catch (e) {
      Alert.alert("Error", "Failed to verify PIN");
    }
  };

  const backgroundColor = isDarkMode ? "#0f172a" : "#f8fafc";
  const textColor = isDarkMode ? "#f8fafc" : "#1e293b";
  const secondaryTextColor = isDarkMode ? "#cbd5e1" : "#64748b";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }]}
      edges={["top", "left", "right"]}
    >
      <LinearGradient
        colors={["#0ea5e9", "#06b6d4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      />

      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Avatar.Icon
            size={50}
            icon="lock"
            style={{ backgroundColor: "#0ea5e9" }}
            color="#fff"
          />
          <Text style={[styles.headerTitle, Typography.heading.h2, { color: textColor }]}>
            moneyBox
          </Text>
          <Text style={[styles.headerSubtitle, Typography.body.md, { color: secondaryTextColor }]}>
            Enter PIN to continue
          </Text>
        </View>

        {/* PIN Indicators */}
        <View style={styles.pinIndicators}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.pinDot,
                {
                  backgroundColor: idx < pinInput.length ? "#0ea5e9" : "transparent",
                  borderColor: isDarkMode ? "#475569" : "#e2e8f0",
                },
              ]}
            />
          ))}
        </View>

        {/* Attempts Counter */}
        {attempts > 0 && (
          <Text style={[styles.attemptsText, { color: "#ef4444" }]}>
            {5 - attempts} attempts remaining
          </Text>
        )}

        {/* PIN Pad */}
        <View style={styles.pinPad}>
          {digitRows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.pinRow}>
              {row.map((item) => {
                // Empty spacer (invisible)
                if (item === "") {
                  return <View key={`spacer-${item}`} style={styles.spacer} />;
                }

                // Backspace button
                if (item === "backspace") {
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.digitButton,
                        {
                          backgroundColor: isDarkMode ? "#1e293b" : "#fff",
                          borderColor: isDarkMode ? "#334155" : "#e2e8f0",
                        },
                        locked && styles.digitButtonDisabled,
                      ]}
                      onPress={handleBackspace}
                      disabled={locked}
                    >
                      <Avatar.Icon
                        size={32}
                        icon="backspace"
                        style={{ backgroundColor: "transparent" }}
                        color={textColor}
                      />
                    </TouchableOpacity>
                  );
                }

                // Regular digit button
                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.digitButton,
                      {
                        backgroundColor: isDarkMode ? "#1e293b" : "#fff",
                        borderColor: isDarkMode ? "#334155" : "#e2e8f0",
                      },
                      locked && styles.digitButtonDisabled,
                    ]}
                    onPress={() => handleDigitPress(item)}
                    disabled={locked}
                  >
                    <Text style={[styles.digitText, { color: textColor }]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: locked ? "#cbd5e1" : "#0ea5e9",
            },
          ]}
          onPress={handleSubmit}
          disabled={locked || pinInput.length < 4}
        >
          <Text style={[styles.submitButtonText, Typography.heading.h4]}>
            Unlock
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 30,
  },
  headerTitle: {
    color: "#1e293b",
    fontFamily: FontFamily.primaryBold,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  headerSubtitle: {
    color: "#64748b",
    fontFamily: FontFamily.primary,
  },
  pinIndicators: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: 40,
    justifyContent: "center",
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  attemptsText: {
    fontSize: 14,
    fontFamily: FontFamily.primarySemiBold,
    marginBottom: 16,
    textAlign: "center",
  },
  pinPad: {
    width: "100%",
    maxWidth: 320,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  pinRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  spacer: {
    width: 70,
    height: 70,
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  digitButton: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  digitButtonDisabled: {
    opacity: 0.5,
  },
  digitText: {
    fontSize: 28,
    fontFamily: FontFamily.primaryBold,
    color: "#1e293b",
  },
  submitButton: {
    width: "100%",
    maxWidth: 300,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: "#0ea5e9",
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontFamily: FontFamily.primaryBold,
  },
});
