import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { Pressable, View } from "react-native";

export interface WifiNetwork {
    SSID: string;
    BSSID: string;
    level: number;
    capabilities?: string;
}

interface ScanDevicesSectionProps {
    devices: WifiNetwork[];
    selectedDevices: { [key: string]: boolean };
    isScanning: boolean;
    onScan: () => void;
    onToggleSelection: (bssid: string) => void;
    onSetup: () => void;
}

export function ScanDevicesSection({
    devices,
    selectedDevices,
    isScanning,
    onScan,
    onToggleSelection,
    onSetup,
}: ScanDevicesSectionProps) {
    return (
        <>
            <View className="flex-row items-center justify-between mb-4">
                <View className="flex-1">
                    <ThemedText type="subtitle">Setup New Devices</ThemedText>
                    <ThemedText className="text-gray-400 mt-1">Available Switch Toggler devices nearby</ThemedText>
                </View>
                <View className="flex-row items-center gap-3">
                    <Pressable
                        onPress={onScan}
                        disabled={isScanning}
                        className="bg-white/10 p-2 rounded-full border border-white/10"
                    >
                        <IconSymbol library={MaterialIcons} name="refresh" size={18} color="#6366f1" />
                    </Pressable>
                    {Object.values(selectedDevices).some(Boolean) && (
                        <Pressable onPress={onSetup} className="bg-indigo-500 px-4 py-2 rounded-xl">
                            <ThemedText className="text-white font-bold text-xs">SETUP</ThemedText>
                        </Pressable>
                    )}
                </View>
            </View>

            <View className="mb-8">
                {devices.length === 0 ? (
                    <ThemedView className="items-center justify-center p-10 rounded-3xl bg-white/5 border border-white/10 border-dashed">
                        <IconSymbol library={MaterialIcons} name="bluetooth" size={48} color="#4b5563" />
                        <ThemedText className="mt-4 text-center text-gray-500">
                            {isScanning
                                ? "Looking for devices..."
                                : "No devices found yet.\nTap scan to look for Switch Togglers."}
                        </ThemedText>
                    </ThemedView>
                ) : (
                    devices.map((item) => (
                        <Pressable
                            key={item.BSSID}
                            onPress={() => onToggleSelection(item.BSSID)}
                            className={`flex-row items-center p-5 mb-3 rounded-2xl border ${
                                selectedDevices[item.BSSID] ? "bg-indigo-500/10 border-indigo-500" : "bg-white/5 border-white/10"
                            }`}
                        >
                            <View
                                className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-4 ${
                                    selectedDevices[item.BSSID] ? "bg-indigo-500 border-indigo-500" : "border-gray-500"
                                }`}
                            >
                                {selectedDevices[item.BSSID] && (
                                    <IconSymbol library={MaterialIcons} name="checkmark" size={16} color="white" />
                                )}
                            </View>
                            <View className="flex-1">
                                <ThemedText type="defaultSemiBold">{item.SSID}</ThemedText>
                                <ThemedText className="text-xs text-gray-500">{item.BSSID}</ThemedText>
                            </View>
                            <IconSymbol
                                library={MaterialIcons}
                                name="wifi"
                                size={20}
                                color={item.level > -60 ? "#4ade80" : "#facc15"}
                            />
                        </Pressable>
                    ))
                )}
            </View>
        </>
    );
}
