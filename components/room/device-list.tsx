import { Button } from "@/components/button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList } from "react-native";
import { Camera } from "./camera-section";

export type RelayConfiguration = {
    id: string;
    deviceId: string;
    name: string;
    sensor: string;
    condition: string;
    threshold: number;
    targetState: string;
    days: string | null;
    time: string | null;
    createdAt: Date;
    updatedAt: Date;
};

export type SmartRoomDevice = {
    motion: number | undefined;
    temperature: number | undefined;
    humidity: number | undefined;
    sound: number | undefined;
    buzzer: number | undefined;
    motionTimestamp: string | undefined;
    tempTimestamp: string | undefined;
    soundTimestamp: string | undefined;
    ldr: number | undefined;
    ldrTimestamp: string | undefined;
    id: string;
    name: string;
    status: string;
    buzzerThreshold: number;
    relayState: string;
    autoMode: boolean;
    activeConfigId: string | null;
    configurations: RelayConfiguration[];
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
    smartRoomDevices: SmartRoomDevice[];
    id: string;
    name: string;
    cameras: Camera[];
};

interface DeviceListProps {
    room: RoomDetails;
    mergedDeviceData: Record<string, any>;
    onDevicePress: (device: SmartRoomDevice) => void;
}

export function DeviceList({ room, mergedDeviceData, onDevicePress }: DeviceListProps) {
    const router = useRouter();

    return (
        <ThemedView className="flex-1">
            <ThemedView className="flex-row justify-between items-center mb-4">
                <ThemedText type="subtitle">Connected Devices</ThemedText>
                <Button onclick={() => router.push("/(tabs)/device-setup")} variant="outline" className="px-2">
                    <IconSymbol name="add" size={18} />
                </Button>
            </ThemedView>

            <FlatList
                data={room.smartRoomDevices}
                keyExtractor={(item) => item.id}
                renderItem={({ item: device }) => {
                    const status = mergedDeviceData[device.id]?.status || device.status;
                    const isOnline = status === "online";

                    return (
                        <ThemedView className="mb-4 rounded-xl overflow-hidden p-2" bordered>
                            <Button
                                variant="none"
                                layout="plain"
                                onclick={() => onDevicePress(device)}
                                className="flex-row items-center justify-between p-2"
                            >
                                <ThemedView className="flex-row items-center gap-2">
                                    <ThemedView
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: isOnline ? "#22c55e" : "#9ca3af" }}
                                    />
                                    <ThemedText className="font-bold">{device.name}</ThemedText>
                                </ThemedView>

                                <ThemedView className="flex-row items-center gap-4">
                                    <IconSymbol library={Ionicons} name="chevron-forward" size={18} color="#6b7280" />
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
