import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";

import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider as AppThemeProvider } from "@/context/theme-context";
import { useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";

export default function RootLayout() {
    return (
        <AppThemeProvider>
            <AuthProvider>
                <RootLayoutContent />
            </AuthProvider>
        </AppThemeProvider>
    );
}

function RootLayoutContent() {
    const colorScheme = useColorScheme();
    const { user, loading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === "(auth)";

        if (!user && !inAuthGroup) {
            router.replace("/(auth)/login");
        } else if (user && inAuthGroup) {
            router.replace("/(tabs)");
        }
    }, [user, loading, segments]);

    if (loading) return null;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
        // Prevent rendering protected screens while redirecting to login.
        // This stops components from mounting and making 401-triggering API calls.
        return null;
    }

    return (
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
                <Stack.Screen name="rooms/[id]" />
                <Stack.Screen name="settings" options={{ title: "Settings" }} />
            </Stack>
            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        </ThemeProvider>
    );
}
