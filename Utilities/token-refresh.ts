import axios from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { router } from "expo-router";

const { API_BASE_URL } = Constants.expoConfig?.extra || {};

/**
 * Shared token refresh utility
 * Calls the /auth/refresh endpoint and updates tokens in SecureStore
 * Returns the new accessToken or null if refresh fails
 * Redirects to login page on failure
 */
export async function refreshAccessToken(): Promise<string | null> {
    try {
        const refreshToken = await SecureStore.getItemAsync("refreshToken");
        if (!refreshToken) {
            console.warn("No refresh token available");
            // Redirect to login
            router.replace("/login");
            return null;
        }

        console.log("Refreshing access token...");
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = res.data;

        if (!accessToken || !newRefreshToken) {
            throw new Error("Missing tokens in refresh response");
        }

        // Update tokens in SecureStore
        if (Platform.OS !== "web") {
            await SecureStore.setItemAsync("accessToken", String(accessToken));
            await SecureStore.setItemAsync("refreshToken", String(newRefreshToken));
        }

        console.log("Access token refreshed successfully");
        return accessToken;
    } catch (error) {
        console.error("Token refresh failed:", error);

        // Clear invalid tokens
        if (Platform.OS !== "web") {
            await SecureStore.deleteItemAsync("accessToken");
            await SecureStore.deleteItemAsync("refreshToken");
        }

        // Redirect to login
        router.replace("/login");
        return null;
    }
}
