import { Button } from "@/components/button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { FlatList, TouchableOpacity } from "react-native";
import { Camera } from "./camera-section";

export type SwitchToggle = {
    id: string;
    name: string;
    type: "on" | "off";
    isOn: boolean;
    x: number;
    y: number;
    z: number;
};

export type SwitchDevice = {
    motion: number | undefined;
    temperature: number | undefined;
    humidity: number | undefined;
    sound: number | undefined;
    buzzer: number | undefined;
    motionTimestamp: string | undefined;
    tempTimestamp: string | undefined;
    soundTimestamp: string | undefined;
    id: string;
    name: string;
    status: string;
    buzzerThreshold: number;
    toggles: {
        id: string;
        name: string;
        currentStatus: string;
        states: {
            id: string;
            type: string;
            updatedAt: Date;
            toggleId: string;
            x: number;
            y: number;
            z: number;
            armAngle0: number;
            armAngle1: number;
            armAngle2: number;
            armAngle3: number;
        }[];
    }[];
    readings: {
        id: string;
        type: string;
        value: number;
        timestamp: Date;
    }[];
    requestTimestamp: string;
};

export type RoomDetails = {
    requestTimestamp: string;
    switchDevices: SwitchDevice[];
    id: string;
    name: string;
    cameras: Camera[];
};

interface DeviceListProps {
    room: RoomDetails;
    mergedDeviceData: Record<string, any>;
    onSwitchPress: (device: SwitchDevice, sw: any) => void;
    onToggleSwitch: (deviceId: string, switchId: string, currentState: boolean) => void;
}

export function DeviceList({ room, mergedDeviceData, onSwitchPress, onToggleSwitch }: DeviceListProps) {
    const router = useRouter();
    const [expandedDevices, setExpandedDevices] = useState<Record<string, boolean>>({});

    const toggleExpand = (deviceId: string) => {
        setExpandedDevices((prev) => ({
            ...prev,
            [deviceId]: !prev[deviceId],
        }));
    };

    return (
        <ThemedView className="flex-1">
            <ThemedView className="flex-row justify-between items-center mb-4">
                <ThemedText type="subtitle">Connected Devices</ThemedText>
                <Button
                    onclick={() => router.push("/(tabs)/device-setup")}
                    variant="none"
                    className="p-2 rounded-lg border border-gray-200 aspect-square"
                >
                    <IconSymbol library={MaterialIcons} name="add" />
                </Button>
            </ThemedView>

            <FlatList
                data={room.switchDevices}
                keyExtractor={(item) => item.id}
                renderItem={({ item: device }) => {
                    const isExpanded = !!expandedDevices[device.id];
                    const status = mergedDeviceData[device.id]?.status || device.status;
                    const isOnline = status === "online";

                    return (
                        <ThemedView className="mb-4 rounded-xl overflow-hidden" bordered>
                            <TouchableOpacity
                                onPress={() => toggleExpand(device.id)}
                                className="flex-row items-center justify-between p-4 bg-gray-50/50"
                                activeOpacity={0.7}
                            >
                                <ThemedView className="flex-row items-center gap-3">
                                    <IconSymbol
                                        library={Ionicons}
                                        name={isExpanded ? "chevron-down" : "chevron-forward"}
                                        size={18}
                                        color="#6b7280"
                                    />
                                    <ThemedView>
                                        <ThemedText className="font-bold">{device.name}</ThemedText>
                                        <ThemedText className="text-xs" style={{ color: isOnline ? "#22c55e" : "#9ca3af" }}>
                                            {isOnline ? "Online" : "Offline"}
                                        </ThemedText>
                                    </ThemedView>
                                </ThemedView>

                                <ThemedText className="text-xs opacity-50">
                                    {device.toggles.length} {device.toggles.length === 1 ? "Switch" : "Switches"}
                                </ThemedText>
                            </TouchableOpacity>

                            {isExpanded && (
                                <ThemedView className="p-2 bg-white">
                                    {device.toggles.map((sw: any) => {
                                        const isOn = sw.currentStatus === "ON";
                                        return (
                                            <ThemedView
                                                key={sw.id}
                                                className="flex-row items-center justify-between py-3 px-4 rounded-lg mb-1"
                                            >
                                                <Button
                                                    variant="none"
                                                    layout="plain"
                                                    onclick={() => onSwitchPress(device, { ...sw, isOn })}
                                                    className="flex-1"
                                                >
                                                    <ThemedText className="font-medium">{sw.name}</ThemedText>
                                                </Button>

                                                <Button
                                                    variant="none"
                                                    layout="plain"
                                                    onclick={() => onToggleSwitch(device.id, sw.id, isOn)}
                                                    className={`w-12 h-7 rounded-full items-start p-1 ${isOn ? "bg-blue-500" : ""}`}
                                                    style={!isOn ? { backgroundColor: "#d1d5db" } : undefined}
                                                >
                                                    <ThemedView
                                                        className={`w-5 h-5 rounded-full bg-white ${isOn ? "self-end" : "self-start"}`}
                                                        style={{
                                                            shadowColor: "#000",
                                                            shadowOffset: { width: 0, height: 1 },
                                                            shadowOpacity: 0.2,
                                                            shadowRadius: 1.41,
                                                            elevation: 2,
                                                        }}
                                                    />
                                                </Button>
                                            </ThemedView>
                                        );
                                    })}
                                    {device.toggles.length === 0 && (
                                        <ThemedText className="text-center text-gray-400 py-4 text-xs">
                                            No switches for this device
                                        </ThemedText>
                                    )}
                                </ThemedView>
                            )}
                        </ThemedView>
                    );
                }}
                ListEmptyComponent={<ThemedText className="text-center text-gray-400 mt-10">No devices in this room.</ThemedText>}
            />
        </ThemedView>
    );
}
