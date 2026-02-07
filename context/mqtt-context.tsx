import { Buffer } from "buffer";
import mqtt from "mqtt";
import process from "process";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

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

import { useAuth } from "@/hooks/use-auth";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

interface DeviceDataValue {
    status?: string;
    motion?: any;
    [key: string]: any; // Allow any sensor data
}

interface MqttContextType {
    connected: boolean;
    deviceData: Record<string, DeviceDataValue>;
    subscribe: (deviceId: string) => void;
    unsubscribe: (deviceId: string) => void;
    subscribeToDevices: (deviceIds: string[]) => void;
    unsubscribeFromDevices: (deviceIds: string[]) => void;
    sendCommand: (deviceId: string, command: object) => void;
}

const MqttContext = createContext<MqttContextType | undefined>(undefined);

export const MqttProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [client, setClient] = useState<mqtt.MqttClient | null>(null);
    const [connected, setConnected] = useState(false);
    const [deviceData, setDeviceData] = useState<Record<string, DeviceDataValue>>({});
    const { user } = useAuth();

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

        mqttClient.on("error", (err) => {
            console.error("MQTT Error:", err);
            setConnected(false);
        });

        mqttClient.on("connect", () => setConnected(true));
        mqttClient.on("message", (topic, message) => {
            const parts = topic.split("/"); // devices/{id}/status or devices/{id}/sensors/{type}
            const deviceId = parts[1];
            console.log(message.toString());

            if (parts[2] === "status") {
                // Update device status
                const messageStr = message.toString();
                // Try parsing as JSON first
                const payload = JSON.parse(messageStr);
                setDeviceData((prev) => ({
                    ...prev,
                    [deviceId]: { ...prev[deviceId], ...payload },
                }));
            }
        });

        mqttClient.on("close", () => setConnected(false));
        setClient(mqttClient);
    }, [user, client]);

    const subscribe = useCallback(
        (deviceId: string) => {
            if (client?.connected) client.subscribe(`devices/${deviceId}/status`);
        },
        [client],
    );

    const unsubscribe = useCallback(
        (deviceId: string) => {
            if (client?.connected) {
                client.unsubscribe(`devices/${deviceId}/status`);
            }
        },
        [client],
    );

    const subscribeToDevices = useCallback(
        (deviceIds: string[]) => {
            if (client?.connected) {
                deviceIds.forEach((deviceId) => {
                    client.subscribe(`devices/${deviceId}/status`);
                });
            }
        },
        [client],
    );

    const unsubscribeFromDevices = useCallback(
        (deviceIds: string[]) => {
            if (client?.connected) {
                deviceIds.forEach((deviceId) => {
                    client.unsubscribe(`devices/${deviceId}/status`);
                });
            }
        },
        [client],
    );

    const sendCommand = useCallback(
        (deviceId: string, cmd: object) => {
            if (client?.connected) {
                client.publish(`devices/${deviceId}/cmd`, JSON.stringify(cmd));
            }
        },
        [client],
    );

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
