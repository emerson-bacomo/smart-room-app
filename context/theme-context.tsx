import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme as useDeviceColorScheme } from "react-native";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => Promise<void>;
    colorScheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ThemeMode>("system");
    const deviceColorScheme = useDeviceColorScheme();

    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await SecureStore.getItemAsync("themePreference");
            if (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system") {
                setThemeState(savedTheme);
            }
        };
        loadTheme();
    }, []);

    const setTheme = async (newTheme: ThemeMode) => {
        setThemeState(newTheme);
        await SecureStore.setItemAsync("themePreference", newTheme);
    };

    const colorScheme = theme === "system" ? deviceColorScheme || "light" : theme;

    return (
        <ThemeContext.Provider value={{ theme, setTheme, colorScheme: colorScheme as "light" | "dark" }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
