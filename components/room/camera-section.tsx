import { Button } from "@/components/button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";

export type Camera = {
    id: string;
    name: string;
    is_online: boolean;
};

interface CameraSectionProps {
    selectedCamera: Camera | null;
    onOpenGrid: () => void;
    onOpenAdd: () => void;
}

export function CameraSection({ selectedCamera, onOpenGrid, onOpenAdd }: CameraSectionProps) {
    return (
        <ThemedView className="h-64 bg-black relative">
            <ThemedView className="px-5 flex-row justify-between items-center mb-4">
                <ThemedText type="subtitle">Cameras</ThemedText>
                <ThemedView className="flex-row gap-4">
                    <Button
                        onclick={onOpenGrid}
                        variant="none"
                        className="p-1.5 rounded-lg border border-gray-200 aspect-square"
                        labelClassName="text-black font-medium"
                    >
                        <IconSymbol library={Ionicons} name="camera-reverse-outline" />
                    </Button>
                    <Button
                        onclick={onOpenAdd}
                        variant="none"
                        className="p-2 rounded-lg border border-gray-200 aspect-square"
                        labelClassName="text-black font-medium"
                    >
                        <IconSymbol library={MaterialCommunityIcons} name="video-plus" />
                    </Button>
                </ThemedView>
            </ThemedView>

            {selectedCamera ? (
                <ThemedView className="flex-1 items-center justify-center bg-gray-900">
                    <IconSymbol name="video.fill" size={64} color="white" />
                    <ThemedText className="text-white mt-2">{selectedCamera.name} (Live)</ThemedText>
                </ThemedView>
            ) : (
                <ThemedView className="flex-1 items-center justify-center bg-gray-800">
                    <ThemedText className="text-gray-400">No Camera Selected</ThemedText>
                </ThemedView>
            )}
        </ThemedView>
    );
}
