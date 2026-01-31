import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "expo-router";
import React from "react";

export default function Index() {
    const { user } = useAuth();

    if (!user) {
        return <Redirect href="/(auth)/login" />;
    }

    return <Redirect href="/(tabs)" />;
}
