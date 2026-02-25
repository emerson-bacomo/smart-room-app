import { Buffer } from "buffer";
import mqtt from "mqtt";
import process from "process";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const { MQTT_URL } = Constants.expoConfig?.extra || {};

// Polyfills for MQTT.js in React Native/Expo
// @ts-ignore
if (typeof global.Buffer === "undefined") {
    global.Buffer = Buffer;
}
// @ts-ignore
if (typeof global.process === "undefined") {
    global.process = process;
}

import { SmartRoomDevice } from "@/components/room/device-list";
import { useAuth } from "@/hooks/use-auth";
import { refreshAccessToken } from "@/utilities/token-refresh";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

interface MqttContextType {
    connected: boolean;
    deviceData: Record<string, SmartRoomDevice>;
    subscribe: (deviceId: string) => void;
    unsubscribe: (deviceId: string) => void;
    subscribeToDevices: (deviceIds: string[]) => void;
    unsubscribeFromDevices: (deviceIds: string[]) => void;
    sendCommand: (deviceId: string, command: object) => void;
}

const MqttContext = createContext<MqttContextType | undefined>(undefined);

export const MqttProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [client, setClient] = useState<mqtt.MqttClient | null>(null);
    const clientRef = useRef<mqtt.MqttClient | null>(null);
    const [connected, setConnected] = useState(false);
    const [deviceData, setDeviceData] = useState<Record<string, SmartRoomDevice>>({});
    const { user } = useAuth();
    const isRefreshing = useRef(false);

    console.log(connected, deviceData);

    const connect = useCallback(async () => {
        if (client?.connected) return;
        console.log("Connecting to MQTT...");

        const token = await SecureStore.getItemAsync("accessToken");
        if (!token) return;

        // Use a generic Admin/User clientId since the specific device check
        // happens at the subscription level now.
        const options: mqtt.IClientOptions = {
            clientId: `user_${user?.id}_${Math.random().toString(16).slice(2, 6)}`,
            username: "mobile_app",
            password: token, // JWT used for Prisma ownership checks later
            clean: true,
            reconnectPeriod: 2000,
        };

        const mqttClient = mqtt.connect(MQTT_URL, options);

        mqttClient.on("error", async (err) => {
            console.error("MQTT Error:", err);
            setConnected(false);

            // Check if it's an authentication error (token expired)
            const errorMsg = err.message || err.toString();
            const isAuthError = errorMsg.includes("Not authorized") || errorMsg.includes("Connection refused");

            if (isAuthError && !isRefreshing.current) {
                isRefreshing.current = true;
                console.log(`Auth error detected, refreshing token and reconnecting...`);

                // Close the current connection
                mqttClient.end(true);

                try {
                    // Refresh token and reconnect
                    const freshToken = await refreshAccessToken();
                    if (freshToken) {
                        console.log(`Token refreshed, triggering reconnection...`);
                        await connect();
                    }
                } catch (refreshErr) {
                    console.error("Failed to refresh token during MQTT error handling:", refreshErr);
                } finally {
                    isRefreshing.current = false;
                }
            }
        });

        mqttClient.on("connect", () => setConnected(true));
        mqttClient.on("message", (topic, message) => {
            const parts = topic.split("/"); // devices/{id}/status or devices/{id}/sensors/{type}
            const deviceId = parts[1];
            console.log(message.toString());

            if (parts[2] === "status") {
                // Update device status
                const messageStr = message.toString();
                try {
                    const payload = JSON.parse(messageStr);
                    setDeviceData((prev) => {
                        const current = prev[deviceId];
                        // Discard stale updates if they arrive out-of-order
                        if (current?.requestTimestamp && payload.requestTimestamp) {
                            if (new Date(payload.requestTimestamp) < new Date(current.requestTimestamp)) {
                                console.log(`[MQTT] Discarding stale update for ${deviceId}`);
                                return prev;
                            }
                        }
                        return {
                            ...prev,
                            [deviceId]: { ...prev[deviceId], ...payload },
                        };
                    });
                } catch (e) {
                    console.error("Error parsing MQTT status JSON:", e);
                }
            }
        });

        mqttClient.on("close", () => setConnected(false));
        clientRef.current = mqttClient;
        setClient(mqttClient);
    }, [user, client]);

    // All callbacks use clientRef so their references stay stable across reconnects.
    // This prevents useEffect/useFocusEffect from re-firing just because MQTT reconnected.
    const subscribe = useCallback((deviceId: string) => {
        if (clientRef.current?.connected) clientRef.current.subscribe(`devices/${deviceId}/status`, { qos: 0 });
    }, []);

    const unsubscribe = useCallback((deviceId: string) => {
        if (clientRef.current?.connected) clientRef.current.unsubscribe(`devices/${deviceId}/status`);
    }, []);

    const subscribeToDevices = useCallback((deviceIds: string[]) => {
        deviceIds.forEach((deviceId) => {
            if (clientRef.current?.connected) clientRef.current.subscribe(`devices/${deviceId}/status`, { qos: 0 });
        });
    }, []);

    const unsubscribeFromDevices = useCallback((deviceIds: string[]) => {
        deviceIds.forEach((deviceId) => {
            if (clientRef.current?.connected) clientRef.current.unsubscribe(`devices/${deviceId}/status`);
        });
    }, []);

    const sendCommand = useCallback((deviceId: string, cmd: object) => {
        if (clientRef.current?.connected) clientRef.current.publish(`devices/${deviceId}/cmd`, JSON.stringify(cmd), { qos: 0 });
    }, []);

    useEffect(() => {
        if (user) connect();
        return () => {
            client?.end();
        };
    }, [user]);

    const value = useMemo(
        () => ({
            connected,
            deviceData,
            subscribe,
            unsubscribe,
            subscribeToDevices,
            unsubscribeFromDevices,
            sendCommand,
        }),
        [connected, deviceData, subscribe, unsubscribe, subscribeToDevices, unsubscribeFromDevices, sendCommand],
    );

    return <MqttContext.Provider value={value}>{children}</MqttContext.Provider>;
};

export const useMqtt = () => {
    const context = useContext(MqttContext);
    if (!context) throw new Error("useMqtt must be used within an MqttProvider");
    return context;
};
