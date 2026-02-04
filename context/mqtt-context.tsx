import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { Buffer } from "buffer";
import process from "process";
import mqtt from "mqtt";

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
import * as SecureStore from "expo-secure-store";
import { refreshAccessToken } from "@/utilities/token-refresh";

type MqttStatus = "online" | "offline" | "unknown";

interface MqttContextType {
    connected: boolean;
    deviceStatuses: Record<string, MqttStatus>;
    publishCommand: (deviceId: string, command: object) => void;
    subscribeToDevice: (deviceId: string) => void;
    connectToDevice: (deviceDnsName: string) => Promise<void>;
}

const MqttContext = createContext<MqttContextType | undefined>(undefined);

export const MqttProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [clients, setClients] = useState<Record<string, mqtt.MqttClient>>({});
    const [connected, setConnected] = useState(false);
    const [deviceStatuses, setDeviceStatuses] = useState<Record<string, MqttStatus>>({});
    const { user } = useAuth();

    // Connect to a specific device
    const connectToDevice = useCallback(
        async (deviceDnsName: string) => {
            if (clients[deviceDnsName]) return; // Already connected

            const token = await SecureStore.getItemAsync("accessToken");
            if (!token) {
                console.warn("No access token available for MQTT connection");
                return;
            }

            const brokerUrl = "ws://YOUR_BACKEND_IP:8888";
            const options: mqtt.IClientOptions = {
                clientId: `smart_room_mob_${deviceDnsName}_` + Math.random().toString(16).substring(2, 10),
                username: deviceDnsName, // Send DNS name as username
                password: token, // Send JWT as password
                clean: true,
                connectTimeout: 4000,
                reconnectPeriod: 1000,
            };

            console.log(`Connecting to MQTT broker for device ${deviceDnsName}...`, brokerUrl);
            const mqttClient = mqtt.connect(brokerUrl, options);

            mqttClient.on("connect", () => {
                setConnected(true);
                console.log(`MQTT Connected for device ${deviceDnsName}`);
                mqttClient.subscribe(`devices/${deviceDnsName}/status`);
            });

            mqttClient.on("message", (topic, message) => {
                const topicParts = topic.split("/");
                if (topicParts[0] === "devices" && topicParts[2] === "status") {
                    const deviceId = topicParts[1];
                    const status = message.toString() as MqttStatus;
                    setDeviceStatuses((prev) => ({ ...prev, [deviceId]: status }));
                }
            });

            mqttClient.on("error", (err) => {
                console.error(`MQTT Client Error for ${deviceDnsName}:`, err);

                // Check if it's an authentication error (token expired)
                const errorMsg = err.message || err.toString();
                if (errorMsg.includes("Not authorized") || errorMsg.includes("Connection refused")) {
                    console.log(`Auth error detected for ${deviceDnsName}, refreshing token and reconnecting...`);

                    // Close the current connection
                    mqttClient.end(true);

                    // Remove from clients map
                    setClients((prev) => {
                        const newClients = { ...prev };
                        delete newClients[deviceDnsName];
                        return newClients;
                    });

                    // Refresh token and reconnect
                    refreshAccessToken().then((freshToken) => {
                        if (freshToken) {
                            console.log(`Token refreshed, reconnecting to ${deviceDnsName}...`);
                            connectToDevice(deviceDnsName);
                        }
                        // If refresh fails, refreshAccessToken already redirects to login
                    });
                }
            });

            mqttClient.on("close", () => {
                console.log(`MQTT Connection Closed for ${deviceDnsName}`);
                setClients((prev) => {
                    const newClients = { ...prev };
                    delete newClients[deviceDnsName];
                    return newClients;
                });
            });

            setClients((prev) => ({ ...prev, [deviceDnsName]: mqttClient }));
        },
        [clients],
    );

    useEffect(() => {
        if (!user) return;

        // Cleanup on unmount
        return () => {
            Object.values(clients).forEach((client) => {
                client.end();
            });
        };
    }, [user, clients]);

    const publishCommand = useCallback(
        (deviceId: string, command: object) => {
            const client = clients[deviceId];
            if (client && client.connected) {
                const topic = `devices/${deviceId}/cmd`;
                const payload = JSON.stringify(command);
                client.publish(topic, payload, { qos: 1 }, (err) => {
                    if (err) console.error("Publish error:", err);
                });
            } else {
                console.warn(`Cannot publish: MQTT client for ${deviceId} not connected`);
            }
        },
        [clients],
    );

    const subscribeToDevice = useCallback(
        (deviceId: string) => {
            const client = clients[deviceId];
            if (client) {
                client.subscribe(`devices/${deviceId}/status`);
            }
        },
        [clients],
    );

    const value = useMemo(
        () => ({
            connected,
            deviceStatuses,
            publishCommand,
            subscribeToDevice,
            connectToDevice,
        }),
        [connected, deviceStatuses, publishCommand, subscribeToDevice, connectToDevice],
    );

    return <MqttContext.Provider value={value}>{children}</MqttContext.Provider>;
};

export const useMqtt = () => {
    const context = useContext(MqttContext);
    if (!context) throw new Error("useMqtt must be used within an MqttProvider");
    return context;
};
