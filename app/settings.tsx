import { Button } from "@/components/button";
import { ThemedSafeAreaView } from "@/components/themed-safe-area-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/context/theme-context";
import React from "react";

export default function SettingsScreen() {
    const { theme, setTheme } = useTheme();

    return (
        <ThemedSafeAreaView className="flex-1 px-5" edges={["bottom", "left", "right"]}>
            <ThemedView className="mt-8 gap-6 bg-transparent">
                <ThemedView className="bg-transparent">
                    <ThemedText type="subtitle">Appearance</ThemedText>
                    <ThemedText className="text-gray-500">Choose how SmartRoom looks to you.</ThemedText>
                </ThemedView>

                <ThemedView className="gap-3 bg-transparent">
                    <Button
                        label="Light"
                        variant={theme === "light" ? "cta" : "outline"}
                        labelClassName={theme === "light" ? "text-white" : "text-blue-500"}
                        onclick={() => setTheme("light")}
                    />
                    <Button
                        label="Dark"
                        variant={theme === "dark" ? "cta" : "outline"}
                        labelClassName={theme === "dark" ? "text-white" : "text-blue-500"}
                        onclick={() => setTheme("dark")}
                    />
                    <Button
                        label="System"
                        variant={theme === "system" ? "cta" : "outline"}
                        labelClassName={theme === "system" ? "text-white" : "text-blue-500"}
                        onclick={() => setTheme("system")}
                    />
                </ThemedView>
            </ThemedView>
        </ThemedSafeAreaView>
    );
}
