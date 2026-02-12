import { Button, ButtonProps } from "@/components/button";
import { ThemedSafeAreaView } from "@/components/themed-safe-area-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/hooks/use-auth";
import { alertAsync } from "@/utilities/alert-utils";
import api from "@/utilities/api";
import { GoogleSignin as GoogleNative } from "@react-native-google-signin/google-signin";
import * as GoogleBrowser from "expo-auth-session/providers/google"; // Renamed for clarity
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect } from "react";
import { Platform } from "react-native";

const AUTH_MODE: "auto" | "native" | "browser" = "auto" as "auto" | "native" | "browser";

const USE_NATIVE = AUTH_MODE === "native" || (AUTH_MODE === "auto" && Platform.OS !== "web");

const WEB_CLIENT_ID = "733891402411-vlej6d4iq0kncfqf2is1fh48jmael78q.apps.googleusercontent.com";
const ANDROID_CLIENT_ID = "733891402411-7qchghrgv3dodu7ll1b0ikpb5scosing.apps.googleusercontent.com";

export default function Login() {
    WebBrowser.maybeCompleteAuthSession();

    // 1. Browser Flow Setup
    const [request, response, promptAsync] = GoogleBrowser.useAuthRequest({
        androidClientId: ANDROID_CLIENT_ID,
        webClientId: WEB_CLIENT_ID,
    });

    // 2. Native Flow Setup (Android/iOS only)
    useEffect(() => {
        if (Platform.OS !== "web") {
            GoogleNative.configure({
                webClientId: WEB_CLIENT_ID, // Use WEB ID here for backend compatibility
                offlineAccess: true,
            });
        }
    }, []);

    // Handle Browser Response
    useEffect(() => {
        if (response?.type === "success") {
            const idToken = response.authentication?.idToken;
            if (idToken) loginWithBackend(idToken);
        }
    }, [response]);

    const handleLoginPress: ButtonProps["onclick"] = async (setBtnLoading) => {
        if (!setBtnLoading) return;
        if (USE_NATIVE && Platform.OS !== "web") {
            // --- NATIVE METHOD ---
            setBtnLoading(true);
            try {
                await GoogleNative.hasPlayServices();
                const userInfo = await GoogleNative.signIn();
                const idToken = userInfo.data?.idToken;
                if (idToken) {
                    await loginWithBackend(idToken);
                }
            } catch (error) {
                console.error("Native Sign-In Error:", error);
            } finally {
                setBtnLoading(false);
            }
        } else {
            // --- BROWSER METHOD ---
            promptAsync();
        }
    };

    const { setUser } = useAuth();

    const loginWithBackend = async (idToken: string) => {
        try {
            const res = await api.post("/auth/google", { idToken });
            const { accessToken, refreshToken, user } = res.data;

            if (Platform.OS !== "web") {
                await SecureStore.setItemAsync("accessToken", accessToken);
                await SecureStore.setItemAsync("refreshToken", refreshToken);
            }

            setUser(user);
        } catch (error) {
            console.error("Backend Error:", error);
            alertAsync("Login Failed", "Could not verify with server.");
        }
    };

    return (
        <ThemedSafeAreaView className="flex-1 gap-20 items-center justify-center">
            <ThemedView className="items-center gap-2">
                <ThemedText type="title">Welcome</ThemedText>
                <ThemedText>Smart Room App ({USE_NATIVE ? "Native" : "Browser"} Mode)</ThemedText>
            </ThemedView>

            <Button label="Login with Google" className="px-8" onclick={handleLoginPress} />
        </ThemedSafeAreaView>
    );
}
