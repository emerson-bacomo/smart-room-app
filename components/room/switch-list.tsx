import { Button } from "@/components/button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList } from "react-native";
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

interface SwitchListProps {
    room: RoomDetails;
    flattenedSwitches: any[];
    mergedDeviceData: Record<string, any>;
    onSwitchPress: (device: SwitchDevice, sw: SwitchToggle) => void;
    onToggleSwitch: (deviceId: string, switchId: string, currentState: boolean) => void;
}

export function SwitchList({ room, flattenedSwitches, mergedDeviceData, onSwitchPress, onToggleSwitch }: SwitchListProps) {
    const router = useRouter();

    return (
        <ThemedView className="flex-1">
            <ThemedView className="flex-row justify-between items-center mb-4">
                <ThemedText type="subtitle">Switch Devices</ThemedText>
                <Button
                    onclick={() => router.push("/(tabs)/device-setup")}
                    variant="none"
                    className="p-2 rounded-lg border border-gray-200 aspect-square"
                >
                    <IconSymbol library={MaterialIcons} name="add" />
                </Button>
            </ThemedView>

            <FlatList
                data={flattenedSwitches}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const device = room.switchDevices.find((d) => d.id === item.deviceId)!;
                    return (
                        <ThemedView className="mb-4 rounded-xl p-2" bordered>
                            <ThemedText className="text-xs px-2 mb-1 uppercase font-bold" style={{ opacity: 0.5 }}>
                                {item.deviceName}
                            </ThemedText>
                            <Button
                                variant="none"
                                layout="plain"
                                onclick={() => onSwitchPress(device, item)}
                                className="flex-row items-center justify-between px-2"
                            >
                                <ThemedText className="font-medium">{item.name}</ThemedText>

                                <ThemedView className="flex-row items-center gap-4">
                                    <ThemedText
                                        className="text-xs"
                                        style={{
                                            color: mergedDeviceData[item.deviceId]?.status === "online" ? "#22c55e" : "#9ca3af",
                                        }}
                                    >
                                        {mergedDeviceData[item.deviceId]?.status === "online" ? "Online" : "Offline"}
                                    </ThemedText>
                                    <Button
                                        variant="none"
                                        layout="plain"
                                        onclick={() => onToggleSwitch(item.deviceId, item.id, item.isOn)}
                                        className={`w-12 h-7 rounded-full items-start p-1 ${item.isOn ? "bg-blue-500" : ""}`}
                                        style={!item.isOn ? { backgroundColor: "#d1d5db" } : undefined}
                                    >
                                        <ThemedView
                                            className={`w-5 h-5 rounded-full bg-white ${item.isOn ? "self-end" : "self-start"}`}
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
                            </Button>
                        </ThemedView>
                    );
                }}
                ListEmptyComponent={<ThemedText className="text-center text-gray-400 mt-10">No devices in this room.</ThemedText>}
            />
        </ThemedView>
    );
}
