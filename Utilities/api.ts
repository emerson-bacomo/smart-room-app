import axios from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const { API_BASE_URL } = Constants.expoConfig?.extra || {};

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
});

// Add interceptor to include token
api.interceptors.request.use(async (config) => {
    if (Platform.OS !== "web") {
        const token = await SecureStore.getItemAsync("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if ([401, 403].includes(error.response?.status) && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await SecureStore.getItemAsync("refreshToken");
                if (!refreshToken) throw new Error("No refresh token");

                const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
                const { accessToken, refreshToken: newRefreshToken } = res.data;

                if (!accessToken || !newRefreshToken) {
                    throw new Error("Missing tokens in refresh response");
                }

                if (Platform.OS !== "web") {
                    await SecureStore.setItemAsync("accessToken", String(accessToken));
                    await SecureStore.setItemAsync("refreshToken", String(newRefreshToken));
                }

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // If refresh fails, clear tokens and let the app handle the auth state (e.g. redirect to login)
                if (Platform.OS !== "web") {
                    await SecureStore.deleteItemAsync("accessToken");
                    await SecureStore.deleteItemAsync("refreshToken");
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);

export default api;
