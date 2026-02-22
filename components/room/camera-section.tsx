import { Button } from "@/components/button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";

import { RtcViewer } from "./rtc-viewer";

export interface Camera {
    id: string;
    name: string;
    isOnline?: boolean;
}

interface CameraSectionProps {
    selectedCamera: Camera | null;
    onOpenGrid: () => void;
    onOpenAdd: () => void;
}

export function CameraSection({ selectedCamera, onOpenGrid, onOpenAdd }: CameraSectionProps) {
    return (
        <ThemedView className="min-h-72 bg-black relative gap-4">
            <ThemedView className="px-5 flex-row justify-between items-center">
                <ThemedText type="subtitle" className="text-white">
                    {selectedCamera ? selectedCamera.name : "Cameras"}
                </ThemedText>
                <ThemedView className="flex-row gap-4">
                    <Button
                        onclick={onOpenGrid}
                        variant="outline"
                        className="p-1.5 rounded-lg aspect-square bg-white/10 dark:bg-black/20"
                    >
                        <IconSymbol library={Ionicons} name="camera-reverse-outline" color="white" />
                    </Button>
                    <Button onclick={onOpenAdd} variant="outline" className="p-1.5 rounded-lg aspect-square">
                        <IconSymbol library={MaterialCommunityIcons} name="video-plus" color="white" size={24} />
                    </Button>
                </ThemedView>
            </ThemedView>

            {selectedCamera ? (
                <RtcViewer cameraId={selectedCamera.id} />
            ) : (
                <ThemedView className="flex-1 items-center justify-center bg-gray-800">
                    <ThemedText className="text-gray-400">No Camera Selected</ThemedText>
                </ThemedView>
            )}
        </ThemedView>
    );
}
