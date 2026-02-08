import { AppModal, AppModalRef } from "@/components/app-modal";
import { Button } from "@/components/button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import React from "react";
import { FlatList } from "react-native";

interface SensorHistoryModalProps {
    modalRef: React.RefObject<AppModalRef | null>;
    selectedSensor: { deviceId: string; type: string } | null;
    sensorHistory: { value: number; timestamp: string }[];
    loadingHistory: boolean;
}

export function SensorHistoryModal({ modalRef, selectedSensor, sensorHistory, loadingHistory }: SensorHistoryModalProps) {
    return (
        <AppModal
            ref={modalRef}
            title={`${selectedSensor?.type.charAt(0).toUpperCase() + selectedSensor?.type.slice(1)!} History`}
            hideButtons
        >
            <ThemedView className="h-96">
                {loadingHistory ? (
                    <ThemedText className="text-center mt-10">Loading history...</ThemedText>
                ) : (
                    <FlatList
                        data={sensorHistory}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <ThemedView className="flex-row justify-between py-3 border-b border-gray-100">
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
                                    {item.value.toFixed(1)}{" "}
                                    {selectedSensor?.type === "temperature"
                                        ? "°C"
                                        : selectedSensor?.type === "humidity"
                                          ? "%"
                                          : ""}
                                </ThemedText>
                            </ThemedView>
                        )}
                        ListEmptyComponent={
                            <ThemedText className="text-center text-gray-400 mt-10">No history available.</ThemedText>
                        }
                    />
                )}
            </ThemedView>
            <Button
                label="Close"
                variant="none"
                className="bg-gray-200 mt-4"
                labelClassName="text-black"
                onclick={() => modalRef.current?.close()}
            />
        </AppModal>
    );
}
