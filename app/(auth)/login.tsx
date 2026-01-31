import { Button } from "@/components/Button";
import { alertAsync } from "@/Utilities/AlertUtils";
import api from "@/Utilities/api";
import { GoogleSignin as GoogleNative } from "@react-native-google-signin/google-signin";
import * as GoogleBrowser from "expo-auth-session/providers/google"; // Renamed for clarity
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect } from "react";
import { Platform, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

    const handleLoginPress = async () => {
        if (USE_NATIVE && Platform.OS !== "web") {
            // --- NATIVE METHOD ---
            try {
                await GoogleNative.hasPlayServices();
                const userInfo = await GoogleNative.signIn();
                const idToken = userInfo.data?.idToken;
                if (idToken) loginWithBackend(idToken);
            } catch (error) {
                console.error("Native Sign-In Error:", error);
            }
        } else {
            // --- BROWSER METHOD ---
            promptAsync();
        }
    };

    const loginWithBackend = async (idToken: string) => {
        try {
            const res = await api.post("/auth/google", { idToken });
            const { accessToken, refreshToken, user } = res.data;

            if (Platform.OS !== "web") {
                await SecureStore.setItemAsync("accessToken", accessToken);
                await SecureStore.setItemAsync("refreshToken", refreshToken);
            }

            console.log("Logged in user:", user);
            alertAsync("Log in success.", user.email);
        } catch (error) {
            console.error("Backend Error:", error);
            alertAsync("Login Failed", "Could not verify with server.");
        }
    };

    return (
        <SafeAreaView className="flex-1 gap-20 items-center justify-center bg-white">
            <View className="items-center gap-2">
                <Text className="text-4xl font-bold">Welcome</Text>
                <Text>Smart Room App ({USE_NATIVE ? "Native" : "Browser"} Mode)</Text>
            </View>

            <Button label="Login with Google" className="px-8" onclick={handleLoginPress} />
        </SafeAreaView>
    );
}
