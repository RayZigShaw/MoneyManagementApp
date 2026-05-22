import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useFonts } from 'expo-font';
import { Tabs } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Avatar, Provider as PaperProvider, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppProvider, useApp } from './_lib/_AppContext';
import { ThemeProvider, useTheme } from './_lib/_ThemeContext';
import { Typography } from './_lib/typography';
import PINScreen from './components/PINScreen';

const tabRoutes = [
  { name: "home", title: "Home", icon: "home-variant" },
  { name: "accounts/index", title: "Accounts", icon: "wallet" },
  { name: "transactions", title: "Transactions", icon: "history" },
  { name: "reports", title: "Reports", icon: "chart-line" },
  { name: "settings", title: "Settings", icon: "cog" },
];

// Keep fonts suspended until loaded
SplashScreen.preventAutoHideAsync();

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom + 8 }]}>
      {state.routes.map((route: any, index: number) => {
        const focused = state.index === index;
        const tab = tabRoutes.find(t => t.name === route.name);
        if (!tab) return null;
        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={styles.tabItem}
          >
            <Avatar.Icon
              size={focused ? 40 : 32}
              icon={tab.icon}
              style={{
                backgroundColor: focused ? '#6366f1' : 'transparent',
              }}
              color={focused ? '#fff' : '#7a869a'}
            />
            <Text style={[
              styles.tabLabel,
              { 
                ...Typography.caption.sm,
                color: focused ? '#6366f1' : '#7a869a', 
                fontWeight: focused ? '700' : '600'
              }
            ]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    marginTop: 4,
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular: require('@expo-google-fonts/inter').Inter_400Regular,
    Inter_500Medium: require('@expo-google-fonts/inter').Inter_500Medium,
    Inter_600SemiBold: require('@expo-google-fonts/inter').Inter_600SemiBold,
    Inter_700Bold: require('@expo-google-fonts/inter').Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}

function RootLayoutContent() {
  const { theme: currentTheme, isDarkMode } = useTheme();

  return (
    <PaperProvider theme={currentTheme}>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </PaperProvider>
  );
}

function AppContent() {
  const { settings } = useApp();
  const { isDarkMode } = useTheme();
  const [pinVerified, setPinVerified] = useState(false);

  // If PIN is enabled and not verified, show PIN screen
  if (settings?.pin_enabled && !pinVerified && settings?.pin_hash) {
    return (
      <PINScreen
        onPINVerified={() => setPinVerified(true)}
        pinHash={settings.pin_hash}
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="home"
        options={{ title: "Home" }}
      />
      <Tabs.Screen
        name="accounts/index"
        options={{ title: "Accounts" }}
      />
      <Tabs.Screen
        name="transactions"
        options={{ title: "Transactions" }}
      />
      <Tabs.Screen
        name="reports"
        options={{ title: "Reports" }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: "Settings" }}
      />
    </Tabs>
  );
}
