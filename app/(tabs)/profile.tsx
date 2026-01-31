import { Button, ButtonProps } from "@/components/button";
import { ThemedSafeAreaView } from "@/components/themed-safe-area-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "expo-router";
import React from "react";
import { Image } from "react-native";

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout: ButtonProps["onclick"] = async (setLoading) => {
        if (!setLoading) return;
        setLoading(true);
        try {
            await logout();
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedSafeAreaView className="flex-1 px-10">
            <ThemedView className="flex-1 items-center justify-center gap-4 bg-transparent w-full">
                {user?.avatar ? (
                    <Image source={{ uri: user.avatar }} className="h-24 w-24 rounded-full" />
                ) : (
                    <ThemedView className="h-24 w-24 items-center justify-center rounded-full bg-gray-300">
                        <ThemedText className="text-3xl text-gray-500">{user?.name?.[0] || "?"}</ThemedText>
                    </ThemedView>
                )}

                <ThemedText type="title">{user?.name || "User"}</ThemedText>
                <ThemedText className="text-gray-500">{user?.email}</ThemedText>

                <ThemedView className="mt-4 gap-2 w-full bg-transparent">
                    <Button
                        label="Settings"
                        variant="outline"
                        onclick={() => router.push("/settings")}
                        labelClassName="font-bold"
                    />

                    <Button label="Logout" variant="danger" onclick={handleLogout} labelClassName="text-white font-bold" />
                </ThemedView>
            </ThemedView>
        </ThemedSafeAreaView>
    );
}
