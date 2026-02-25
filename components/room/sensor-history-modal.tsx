import { AppModal, AppModalRef } from "@/components/app-modal";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import React from "react";
import { ActivityIndicator, FlatList } from "react-native";

interface SensorHistoryModalProps {
    modalRef: React.RefObject<AppModalRef | null>;
    selectedSensor: { deviceId: string; type: string } | null;
    sensorHistory: { value: number; timestamp: string }[];
    isLoading?: boolean;
}

export function SensorHistoryModal({ modalRef, selectedSensor, sensorHistory, isLoading }: SensorHistoryModalProps) {
    return (
        <AppModal
            ref={modalRef}
            title={`${selectedSensor?.type.charAt(0).toUpperCase() + selectedSensor?.type.slice(1)!} History`}
            footerType="CLOSE"
        >
            <ThemedView className="h-96">
                <FlatList
                    data={sensorHistory}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <ThemedView className="flex-row justify-between py-3 border-b" style={{ borderColor: "#f3f4f6" }}>
                            <ThemedText>
                                {new Date(item.timestamp).toLocaleString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                })}
                            </ThemedText>
                            <ThemedText className="font-bold">
                                {(item.value ?? 0).toFixed(1)}{" "}
                                {selectedSensor?.type === "temperature" ? "°C" : selectedSensor?.type === "humidity" ? "%" : ""}
                            </ThemedText>
                        </ThemedView>
                    )}
                    ListEmptyComponent={
                        isLoading ? (
                            <ThemedView className="flex-1 items-center justify-center mt-10">
                                <ActivityIndicator size="small" color="#007AFF" />
                            </ThemedView>
                        ) : (
                            <ThemedText className="text-center text-gray-400 mt-10">No history available.</ThemedText>
                        )
                    }
                />
            </ThemedView>
        </AppModal>
    );
}
