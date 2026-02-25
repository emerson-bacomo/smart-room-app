import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { RelativeTimer } from "@/components/ui/relative-timer";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { ActivityIndicator, FlatList, Pressable } from "react-native";
import { RoomDetails, SmartRoomDevice } from "./device-list";

interface SensorListProps {
    room: RoomDetails;
    mergedDeviceData: Record<string, SmartRoomDevice>;
    onSensorClick: (deviceId: string, type: string) => void;
    onRefresh: (deviceId: string) => void;
    refreshingDevices?: Set<string>;
}

export function SensorList({ room, mergedDeviceData, onSensorClick, onRefresh, refreshingDevices }: SensorListProps) {
    return (
        <ThemedView className="flex-1">
            <ThemedView className="flex-row justify-between items-center mb-4">
                <ThemedText type="subtitle">Sensor Data</ThemedText>
            </ThemedView>

            <FlatList
                data={room.smartRoomDevices}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const sensorData = mergedDeviceData[item.id];
                    const motionValue = sensorData?.motion;
                    const motionDetected = motionValue === 1; // Calibrate: 1 = detected, 0 = clear
                    const temperature = sensorData?.temperature;
                    const humidity = sensorData?.humidity;
                    const sound = sensorData?.sound;
                    const ldr = sensorData?.ldr;

                    return (
                        <ThemedView className="mb-4 rounded-xl p-4" bordered>
                            <ThemedView className="flex-row items-center justify-between mb-2">
                                <ThemedText className="text-xs px-2 uppercase font-bold text-gray-400">{item.name}</ThemedText>
                                <ThemedView className="flex-row items-center gap-2">
                                    {refreshingDevices?.has(item.id) ? (
                                        <ActivityIndicator size="small" color="#2563EB" style={{ marginRight: 8 }} />
                                    ) : (
                                        <Pressable onPress={() => onRefresh(item.id)} className="px-2">
                                            <Ionicons name="refresh" size={16} color="#6b7280" />
                                        </Pressable>
                                    )}
                                </ThemedView>
                            </ThemedView>

                            {/* Motion Sensor */}
                            {motionValue !== undefined && motionValue !== null && (
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
                                            <RelativeTimer
                                                timestamp={sensorData?.motionTimestamp}
                                                className="opacity-50 w-[70px] text-right"
                                            />
                                        </ThemedView>
                                    </ThemedView>
                                </Pressable>
                            )}

                            {/* Temperature Sensor */}
                            {temperature !== undefined && temperature !== null && (
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
                                            <RelativeTimer
                                                timestamp={sensorData?.tempTimestamp}
                                                style={{ opacity: 0.5, width: 70, textAlign: "right" }}
                                            />
                                        </ThemedView>
                                    </ThemedView>
                                </Pressable>
                            )}

                            {/* Humidity Sensor */}
                            {humidity !== undefined && humidity !== null && (
                                <Pressable onPress={() => onSensorClick(item.id, "humidity")}>
                                    <ThemedView className="flex-row items-center justify-between px-2 mb-3">
                                        <ThemedView className="flex-row items-center gap-2">
                                            <IconSymbol library={Ionicons} name="water" size={20} color="#3b82f6" />
                                            <ThemedText className="font-medium">Humidity</ThemedText>
                                        </ThemedView>
                                        <ThemedView className="flex-row items-center gap-2">
                                            <ThemedText className="text-blue-600 font-bold">{humidity.toFixed(1)}%</ThemedText>
                                            <RelativeTimer
                                                timestamp={sensorData?.tempTimestamp}
                                                style={{ opacity: 0.5, width: 70, textAlign: "right" }}
                                            />
                                        </ThemedView>
                                    </ThemedView>
                                </Pressable>
                            )}

                            {/* Sound Sensor */}
                            {sound !== undefined && sound !== null && (
                                <Pressable onPress={() => onSensorClick(item.id, "sound")}>
                                    <ThemedView className="flex-row items-center justify-between px-2 mb-3">
                                        <ThemedView className="flex-row items-center gap-2">
                                            <IconSymbol library={Ionicons} name="volume-high" size={20} color="#8b5cf6" />
                                            <ThemedText className="font-medium">Sound Level</ThemedText>
                                        </ThemedView>
                                        <ThemedView className="flex-row items-center gap-2">
                                            <ThemedText className="text-purple-600 font-bold">{sound.toFixed(0)}</ThemedText>
                                            <RelativeTimer
                                                timestamp={sensorData?.soundTimestamp}
                                                style={{ opacity: 0.5, width: 70, textAlign: "right" }}
                                            />
                                        </ThemedView>
                                    </ThemedView>
                                </Pressable>
                            )}

                            {/* LDR Sensor */}
                            {ldr !== undefined && ldr !== null && (
                                <Pressable onPress={() => onSensorClick(item.id, "ldr")}>
                                    <ThemedView className="flex-row items-center justify-between px-2">
                                        <ThemedView className="flex-row items-center gap-2">
                                            <IconSymbol library={Ionicons} name="sunny" size={20} color="#eab308" />
                                            <ThemedText className="font-medium">Light Level</ThemedText>
                                        </ThemedView>
                                        <ThemedView className="flex-row items-center gap-2">
                                            <ThemedText className="text-yellow-600 font-bold">{ldr.toFixed(0)}</ThemedText>
                                            <RelativeTimer
                                                timestamp={sensorData?.ldrTimestamp}
                                                style={{ opacity: 0.5, width: 70, textAlign: "right" }}
                                            />
                                        </ThemedView>
                                    </ThemedView>
                                </Pressable>
                            )}

                            {motionValue === undefined &&
                                temperature === undefined &&
                                humidity === undefined &&
                                sound === undefined &&
                                ldr === undefined && (
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
