import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Avatar, Text } from "react-native-paper";
import { Colors, Spacing } from "../_lib/theme";
import { FontFamily, Typography } from "../_lib/typography";

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Avatar.Icon size={48} icon="wallet" style={{ backgroundColor: Colors.primary }} color="#fff" />
      <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.md }} />
      <Text style={[styles.text, Typography.body.md]}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  text: {
    marginTop: Spacing.sm,
    color: Colors.text.primary,
    fontFamily: FontFamily.primary,
  },
});

