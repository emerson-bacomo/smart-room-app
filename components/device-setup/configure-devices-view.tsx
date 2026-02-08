import { Button } from "@/components/button";
import { ThemedSafeAreaView } from "@/components/themed-safe-area-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedTextInput } from "@/components/themed-text-input";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { WifiNetwork } from "./scan-devices-section";

interface ConfigureDevicesViewProps {
    devices: WifiNetwork[];
    selectedDevices: { [key: string]: boolean };
    targetSsid: string;
    setTargetSsid: (val: string) => void;
    password: string;
    setPassword: (val: string) => void;
    availableNetworks: WifiNetwork[];
    isScanningNetworks: boolean;
    showNetworkList: boolean;
    setShowNetworkList: (val: boolean) => void;
    devicePasswords: { [key: string]: string };
    setDevicePasswords: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
    isConnecting: boolean;
    setupStatus: { [key: string]: "pending" | "connecting" | "success" | "error" };
    onBack: () => void;
    onScanNetworks: () => void;
    onConnect: () => void;
}

export function ConfigureDevicesView({
    devices,
    selectedDevices,
    targetSsid,
    setTargetSsid,
    password,
    setPassword,
    availableNetworks,
    isScanningNetworks,
    showNetworkList,
    setShowNetworkList,
    devicePasswords,
    setDevicePasswords,
    isConnecting,
    setupStatus,
    onBack,
    onScanNetworks,
    onConnect,
}: ConfigureDevicesViewProps) {
    const selectedList = devices.filter((d) => selectedDevices[d.BSSID]);

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
                        <Button className="ml-2 px-3 h-12" onclick={onScanNetworks}>
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
                        onclick={onConnect}
                        disabled={isConnecting}
                    />
                </ThemedView>
            </ScrollView>
        </ThemedSafeAreaView>
    );
}
