import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatTimeAgo } from "@/utilities/time";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { FlatList, Pressable } from "react-native";
import { RoomDetails, SwitchDevice } from "./switch-list";

interface SensorListProps {
    room: RoomDetails;
    mergedDeviceData: Record<string, SwitchDevice>;
    onSensorClick: (deviceId: string, type: string) => void;
}

export function SensorList({ room, mergedDeviceData, onSensorClick }: SensorListProps) {
    return (
        <ThemedView className="flex-1">
            <ThemedView className="flex-row justify-between items-center mb-4">
                <ThemedText type="subtitle">Sensor Data</ThemedText>
            </ThemedView>

            <FlatList
                data={room.switchDevices}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const sensorData = mergedDeviceData[item.id];
                    const motionValue = sensorData?.motion;
                    const motionDetected = motionValue === 1; // Calibrate: 1 = detected, 0 = clear
                    const temperature = sensorData?.temperature;
                    const humidity = sensorData?.humidity;

                    return (
                        <ThemedView className="mb-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <ThemedText className="text-gray-400 text-xs px-2 mb-2 uppercase font-bold">{item.name}</ThemedText>

                            {/* Motion Sensor */}
                            {motionValue !== undefined && (
                                <Pressable onPress={() => onSensorClick(item.id, "motion")}>
                                    <ThemedView className="flex-row items-center justify-between px-2 mb-3">
                                        <ThemedView className="flex-row items-center gap-2">
                                            <IconSymbol
                                                library={MaterialCommunityIcons}
                                                name="motion-sensor"
                                                size={20}
                                                color={motionDetected ? "#3ce784ff" : "#6b7280"}
                                            />
                                            <ThemedText className="font-medium">Motion</ThemedText>
                                        </ThemedView>
                                        <ThemedView className="flex-row items-center gap-2">
                                            <ThemedText className={motionDetected ? "text-green-500 font-bold" : "text-gray-500"}>
                                                {motionDetected ? "DETECTED" : "Clear"}
                                            </ThemedText>
                                            <ThemedText style={{ opacity: 0.5, width: 70, textAlign: "right" }}>
                                                {formatTimeAgo(sensorData?.motionTimestamp)}
                                            </ThemedText>
                                        </ThemedView>
                                    </ThemedView>
                                </Pressable>
                            )}

                            {/* Temperature Sensor */}
                            {temperature !== undefined && (
                                <Pressable onPress={() => onSensorClick(item.id, "temperature")}>
                                    <ThemedView className="flex-row items-center justify-between px-2 mb-3">
                                        <ThemedView className="flex-row items-center gap-2">
                                            <IconSymbol
                                                library={MaterialCommunityIcons}
                                                name="thermometer"
                                                size={20}
                                                color="#f59e0b"
                                            />
                                            <ThemedText className="font-medium">Temperature</ThemedText>
                                        </ThemedView>
                                        <ThemedView className="flex-row items-center gap-2">
                                            <ThemedText className="text-orange-600 font-bold">
                                                {temperature.toFixed(1)}°C
                                            </ThemedText>
                                            <ThemedText style={{ opacity: 0.5, width: 70, textAlign: "right" }}>
                                                {formatTimeAgo(sensorData?.tempTimestamp)}
                                            </ThemedText>
                                        </ThemedView>
                                    </ThemedView>
                                </Pressable>
                            )}

                            {/* Humidity Sensor */}
                            {humidity !== undefined && (
                                <Pressable onPress={() => onSensorClick(item.id, "humidity")}>
                                    <ThemedView className="flex-row items-center justify-between px-2">
                                        <ThemedView className="flex-row items-center gap-2">
                                            <IconSymbol library={Ionicons} name="water" size={20} color="#3b82f6" />
                                            <ThemedText className="font-medium">Humidity</ThemedText>
                                        </ThemedView>
                                        <ThemedView className="flex-row items-center gap-2">
                                            <ThemedText className="text-blue-600 font-bold">{humidity.toFixed(1)}%</ThemedText>
                                            <ThemedText style={{ opacity: 0.5, width: 70, textAlign: "right" }}>
                                                {formatTimeAgo(sensorData?.tempTimestamp)}
                                            </ThemedText>
                                        </ThemedView>
                                    </ThemedView>
                                </Pressable>
                            )}

                            {motionValue === undefined && temperature === undefined && humidity === undefined && (
                                <ThemedText className="text-center text-gray-400 py-4">No sensor data available</ThemedText>
                            )}
                        </ThemedView>
                    );
                }}
                ListEmptyComponent={
                    <ThemedText className="text-center text-gray-400 mt-10">No devices with sensors in this room.</ThemedText>
                }
            />
        </ThemedView>
    );
}
