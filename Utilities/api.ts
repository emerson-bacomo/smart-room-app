import axios from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { refreshAccessToken } from "./token-refresh";

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

        if (error.response?.status === 403 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const accessToken = await refreshAccessToken();

                if (!accessToken) {
                    throw new Error("Token refresh failed");
                }

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);

export default api;
