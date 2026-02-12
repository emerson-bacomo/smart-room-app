import { Button } from "@/components/button";
import { ThemedSafeAreaView } from "@/components/themed-safe-area-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedTextInput } from "@/components/themed-text-input";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/hooks/use-auth";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import WifiManager from "react-native-wifi-reborn";
import { requestPermissions } from "../../app/(tabs)/device-setup";
import { WifiNetwork } from "./scan-devices-section";

interface ConfigureDevicesViewProps {
    devices: WifiNetwork[];
    selectedDevices: { [key: string]: boolean };
    onBack: () => void;
}

export function ConfigureDevicesView({ devices, selectedDevices, onBack }: ConfigureDevicesViewProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const toast = useToast();

    const [targetSsid, setTargetSsid] = useState("POCO F7");
    const [password, setPassword] = useState("00000000");
    const [availableNetworks, setAvailableNetworks] = useState<WifiNetwork[]>([]);
    const [isScanningNetworks, setIsScanningNetworks] = useState(false);
    const [showNetworkList, setShowNetworkList] = useState(false);
    const [devicePasswords, setDevicePasswords] = useState<{ [key: string]: string }>({});
    const [isConnecting, setIsConnecting] = useState(false);
    const [setupStatus, setSetupStatus] = useState<{ [key: string]: "pending" | "connecting" | "success" | "error" }>({});

    const selectedList = devices.filter((d) => selectedDevices[d.BSSID]);

    const handleScanNetworks = async () => {
        setIsScanningNetworks(true);

        if (!WifiManager || !WifiManager.reScanAndLoadWifiList) {
            toast.info("Wi-Fi scanning is only available in a native build");
            setIsScanningNetworks(false);
            return;
        }

        const hasPermission = await requestPermissions();
        if (!hasPermission) {
            toast.error("Cannot scan for networks without location permission");
            setIsScanningNetworks(false);
            return;
        }

        try {
            const wifiList = await WifiManager.reScanAndLoadWifiList();
            const networks = wifiList.filter((n) => n.SSID && !n.SSID.startsWith("switch-toggler-"));
            setAvailableNetworks(networks as unknown as WifiNetwork[]);
            setShowNetworkList(true);

            if (networks.length === 0) {
                console.warn("No available Wi-Fi networks found besides setup devices.");
            }
        } catch (err) {
            console.error("Network scan failed:", err);
            toast.error("Failed to scan for available Wi-Fi networks");
        } finally {
            setIsScanningNetworks(false);
        }
    };

    const handleConnect = async () => {
        if (!targetSsid || !password) {
            toast.info("Please provide both SSID and password");
            return;
        }

        if (selectedList.length === 0) {
            toast.info("Please select at least one device to setup");
            return;
        }

        setIsConnecting(true);
        const newStatus: { [key: string]: "pending" | "connecting" | "success" | "error" } = {};
        selectedList.forEach((d) => (newStatus[d.BSSID] = "pending"));
        setSetupStatus(newStatus);

        try {
            console.log(selectedList);
            for (const device of selectedList) {
                setSetupStatus((prev) => ({ ...prev, [device.BSSID]: "connecting" }));
                console.log(`Connecting to device hotspot: ${device.SSID}`);

                try {
                    const isProtected = device.capabilities?.includes("WPA") || device.capabilities?.includes("WEP");
                    const devicePwd = devicePasswords[device.BSSID] || "";

                    if (isProtected && !devicePwd) {
                        throw new Error(`Password required for ${device.SSID}`);
                    }

                    // 1. Connect to device hotspot
                    await WifiManager.connectToProtectedSSID(device.SSID, devicePwd, false, false);
                    console.log(`Connected to ${device.SSID}. Sending Wi-Fi credentials...`);

                    // Wait for IP
                    await new Promise((resolve) => setTimeout(resolve, 3000));

                    // 2. Send request to wifisave
                    // Pass userid so the device can claim itself
                    const response = await fetch(
                        `http://${device.SSID}.local/wifisave?s=${encodeURIComponent(targetSsid)}&p=${encodeURIComponent(password)}&userid=${encodeURIComponent(user?.id || "")}`,
                        { method: "GET" },
                    );

                    if (!response.ok) {
                        throw new Error(`Failed to save Wi-Fi on ${device.SSID}`);
                    }

                    setSetupStatus((prev) => ({ ...prev, [device.BSSID]: "success" }));
                } catch (err) {
                    console.error(`Error provisioning ${device.SSID}:`, err);
                    setSetupStatus((prev) => ({ ...prev, [device.BSSID]: "error" }));
                    return;
                }
            }

            toast.success("Devices are connecting to the internet and will appear shortly");
            // We can't immediately fetch setted up devices because we might still be on the hotspot network or just switching back.
            // But we can try after a delay or just let the user refresh.
            setTimeout(() => queryClient.invalidateQueries({ queryKey: ["devices"] }), 5000);
        } catch (err) {
            console.error("Setup process failed:", err);
            toast.error("An unexpected error occurred during setup");
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <ThemedSafeAreaView className="flex-1 px-6 pt-4">
            <View className="flex-row items-center mb-6">
                <Pressable onPress={onBack} className="mr-4">
                    <IconSymbol library={MaterialIcons} name="chevron-left" size={24} color="#6366f1" />
                </Pressable>
                <ThemedText type="subtitle">Configure Devices</ThemedText>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <ThemedView className="p-6 rounded-3xl bg-white/10 border border-white/20 mb-6">
                    <ThemedText type="subtitle" className="mb-4">
                        Target Wi-Fi
                    </ThemedText>
                    <ThemedText className="mb-4 text-gray-400">
                        Credentials the devices will use to connect to internet.
                    </ThemedText>

                    <ThemedText type="defaultSemiBold" className="mb-2">
                        SSID
                    </ThemedText>
                    <View className="flex-row items-center mb-2">
                        <ThemedTextInput
                            className="flex-1 mb-0"
                            placeholder="Enter SSID"
                            value={targetSsid}
                            onChangeText={setTargetSsid}
                        />
                        <Button className="ml-2 px-3 h-12" onclick={handleScanNetworks}>
                            {isScanningNetworks ? (
                                <IconSymbol library={MaterialIcons} name="refresh" size={20} color="#6366f1" />
                            ) : (
                                <IconSymbol library={MaterialIcons} name="wifi" size={20} />
                            )}
                        </Button>
                    </View>

                    {showNetworkList && (
                        <ThemedView className="mb-4 max-h-48 border border-white/10 rounded-xl overflow-hidden">
                            <ScrollView>
                                {availableNetworks.map((net) => (
                                    <Pressable
                                        key={net.BSSID}
                                        onPress={() => {
                                            setTargetSsid(net.SSID);
                                            setShowNetworkList(false);
                                        }}
                                        className="p-3 border-b border-white/5 flex-row justify-between items-center"
                                    >
                                        <ThemedText>{net.SSID}</ThemedText>
                                        <IconSymbol library={MaterialIcons} name="wifi" size={16} color="#4ade80" />
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </ThemedView>
                    )}

                    <ThemedText type="defaultSemiBold" className="mb-2">
                        Password
                    </ThemedText>
                    <ThemedTextInput
                        className="mb-6"
                        placeholder="Enter Password"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <View className="h-[1px] bg-white/10 mb-6" />

                    <ThemedText type="subtitle" className="mb-4">
                        Device Hotspots
                    </ThemedText>
                    <ThemedText className="mb-4 text-gray-400">Enter passwords for the device hotspots.</ThemedText>

                    {selectedList.map((device) => {
                        const isProtected = device.capabilities?.includes("WPA") || device.capabilities?.includes("WEP");
                        return (
                            <View key={device.BSSID} className="mb-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                                <View className="flex-row justify-between items-center mb-2">
                                    <ThemedText type="defaultSemiBold">{device.SSID}</ThemedText>
                                    {setupStatus[device.BSSID] === "success" && (
                                        <IconSymbol library={MaterialIcons} name="check-circle" size={20} color="#4ade80" />
                                    )}
                                    {setupStatus[device.BSSID] === "error" && (
                                        <IconSymbol library={MaterialIcons} name="warning" size={20} color="#ef4444" />
                                    )}
                                    {setupStatus[device.BSSID] === "connecting" && (
                                        <IconSymbol library={MaterialIcons} name="sync" size={20} color="#6366f1" />
                                    )}
                                </View>
                                {isProtected ? (
                                    <ThemedTextInput
                                        placeholder="Hotspot Password"
                                        secureTextEntry
                                        value={devicePasswords[device.BSSID] || ""}
                                        onChangeText={(val) => setDevicePasswords((prev) => ({ ...prev, [device.BSSID]: val }))}
                                        className="mb-0"
                                    />
                                ) : (
                                    <ThemedText className="text-xs text-gray-500 italic">
                                        Open Network (No password required)
                                    </ThemedText>
                                )}
                            </View>
                        );
                    })}

                    <Button
                        variant="cta"
                        label={isConnecting ? "Connecting..." : `Start Setup (${selectedList.length})`}
                        onclick={handleConnect}
                        disabled={isConnecting}
                    />
                </ThemedView>
            </ScrollView>
        </ThemedSafeAreaView>
    );
}
