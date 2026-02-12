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
    is_online: boolean;
}

interface CameraSectionProps {
    selectedCamera: Camera | null;
    onOpenGrid: () => void;
    onOpenAdd: () => void;
}

export function CameraSection({ selectedCamera, onOpenGrid, onOpenAdd }: CameraSectionProps) {
    return (
        <ThemedView className="h-64 bg-black relative">
            <ThemedView className="px-5 flex-row justify-between items-center mb-4 absolute top-4 left-0 right-0 z-10">
                <ThemedText type="subtitle" className="text-white">
                    Cameras
                </ThemedText>
                <ThemedView className="flex-row gap-4">
                    <Button
                        onclick={onOpenGrid}
                        variant="none"
                        className="p-1.5 rounded-lg border border-gray-500 aspect-square bg-black/50"
                        labelClassName="text-white font-medium"
                    >
                        <IconSymbol library={Ionicons} name="camera-reverse-outline" color="white" />
                    </Button>
                    <Button
                        onclick={onOpenAdd}
                        variant="none"
                        className="p-2 rounded-lg border border-gray-500 aspect-square bg-black/50"
                        labelClassName="text-white font-medium"
                    >
                        <IconSymbol library={MaterialCommunityIcons} name="video-plus" color="white" />
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
