import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "../global.css";

import { migrateDbRoomsIfNeeded } from "@/db/rooms";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as SQLite from "expo-sqlite";
import React from "react";

export const unstable_settings = {
    anchor: "(tabs)",
};

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <SQLite.SQLiteProvider databaseName="smartRoomApp.db" onInit={migrateDbRoomsIfNeeded}>
                <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
                </Stack>
                <StatusBar style="auto" />
            </SQLite.SQLiteProvider>
        </ThemeProvider>
    );
}
