import { AppModal, AppModalRef } from "@/components/app-modal";
import { Button } from "@/components/button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useToast } from "@/context/toast-context";
import api from "@/utilities/api";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { IconSymbol } from "../ui/icon-symbol";
import { Camera } from "./camera-section";

interface CameraModalsProps {
    cameraGridModalRef: React.RefObject<AppModalRef | null>;
    addCameraModalRef: React.RefObject<AppModalRef | null>;
    cameras: Camera[];
    selectedCamera: Camera | null;
    setSelectedCamera: (cam: Camera) => void;
    handleRemoveCamera: (cameraId: string) => Promise<void>;
    roomId: string;
    onRefresh: () => void;
}

type OwnedCamera = {
    id: string;
    name: string;
    roomId: string | null;
};

export function CameraModals({
    cameraGridModalRef,
    addCameraModalRef,
    cameras,
    selectedCamera,
    setSelectedCamera,
    handleRemoveCamera,
    roomId,
    onRefresh,
}: CameraModalsProps) {
    const {
        data: ownedCameras = [],
        isLoading: loadingOwned,
        refetch: fetchOwnedCameras,
    } = useQuery<OwnedCamera[]>({
        queryKey: ["ownedCameras"],
        queryFn: async ({ signal }) => {
            const res = await api.get("/cameras", { signal });
            return res.data;
        },
    });

    const [linking, setLinking] = useState(false);
    const toast = useToast();
    const confirmMoveModalRef = useRef<AppModalRef>(null);
    const [cameraToMove, setCameraToMove] = useState<OwnedCamera | null>(null);

    const handleLinkCamera = async (camera: OwnedCamera, overwrite = false) => {
        setLinking(true);
        try {
            await api.put(`/cameras/${camera.id}`, {
                roomId,
                ...(overwrite && { overwrite: true }),
            });
            toast.success("Camera linked to room");
            addCameraModalRef.current?.close();
            onRefresh();
        } catch (error: any) {
            if (error.response?.status === 409) {
                // Camera already linked to another room
                setCameraToMove(camera);
                confirmMoveModalRef.current?.open();
            } else {
                toast.error(error.response?.data?.error || "Failed to link camera");
            }
        } finally {
            setLinking(false);
        }
    };

    const [onlineStatuses, setOnlineStatuses] = useState<Record<string, boolean>>({});

    const fetchCameraStatuses = useCallback(async () => {
        try {
            const res = await api.get("/cameras?fields=id,isOnline");
            const statuses: Record<string, boolean> = {};
            for (const cam of res.data) {
                statuses[cam.id] = cam.isOnline;
            }
            setOnlineStatuses(statuses);
        } catch (e) {
            console.error("Failed to fetch camera statuses", e);
        }
    }, []);

    return (
        <>
            <AppModal ref={cameraGridModalRef} title="Select Camera" footerType="CLOSE" onOpen={fetchCameraStatuses}>
                <ThemedView className="gap-4">
                    {cameras.map((cam) => (
                        <ThemedView key={cam.id} className="flex-row items-center gap-3">
                            {onlineStatuses[cam.id] && <View className="size-2.5 rounded-full bg-green-500" />}
                            <Button
                                label={cam.name}
                                variant={selectedCamera?.id === cam.id ? "cta" : "outline"}
                                className="flex-1"
                                onclick={() => {
                                    setSelectedCamera(cam);
                                    cameraGridModalRef.current?.close();
                                }}
                            />
                            <Button
                                icon={<IconSymbol library={Ionicons} name="trash-outline" size={16} color="#ef4444" />}
                                variant="outline"
                                className="border-red-500 px-2.5"
                                onclick={() => {
                                    handleRemoveCamera(cam.id);
                                }}
                            />
                        </ThemedView>
                    ))}
                    {cameras.length === 0 && (
                        <ThemedView className="items-center py-8">
                            <IconSymbol library={Ionicons} name="camera-outline" size={48} color="#999" />
                            <ThemedText className="text-center opacity-60 mt-2">No cameras linked to this room.</ThemedText>
                        </ThemedView>
                    )}
                </ThemedView>
            </AppModal>

            <AppModal
                ref={addCameraModalRef}
                title="Link Camera to Room"
                footerType="CLOSE"
                onOpen={() => {
                    fetchOwnedCameras();
                }}
            >
                {loadingOwned ? (
                    <ThemedView className="items-center py-8">
                        <ActivityIndicator />
                    </ThemedView>
                ) : (
                    <ThemedView className="gap-2">
                        {ownedCameras.map((cam) => {
                            const isInCurrentRoom = cam.roomId === roomId;
                            const hasRoom = cam.roomId !== null;

                            return (
                                <TouchableOpacity
                                    key={cam.id}
                                    onPress={() => !isInCurrentRoom && handleLinkCamera(cam)}
                                    disabled={linking || isInCurrentRoom}
                                    className={`p-4 rounded-xl border ${
                                        isInCurrentRoom
                                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                            : hasRoom
                                              ? "border-orange-300 bg-orange-50 dark:bg-orange-900/20"
                                              : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                                    }`}
                                >
                                    <ThemedView className="flex-row items-center justify-between bg-transparent">
                                        <ThemedView className="flex-1 bg-transparent">
                                            <ThemedText
                                                type="defaultSemiBold"
                                                className={isInCurrentRoom ? "text-green-700 dark:text-green-400" : ""}
                                            >
                                                {cam.name}
                                            </ThemedText>
                                            <ThemedText className="text-xs opacity-60 mt-1">
                                                {isInCurrentRoom
                                                    ? "Already in this room"
                                                    : hasRoom
                                                      ? "Linked to another room"
                                                      : "Not linked to any room"}
                                            </ThemedText>
                                        </ThemedView>
                                        {isInCurrentRoom && (
                                            <IconSymbol library={Ionicons} name="checkmark-circle" size={24} color="#22c55e" />
                                        )}
                                    </ThemedView>
                                </TouchableOpacity>
                            );
                        })}
                        {ownedCameras.length === 0 && (
                            <ThemedText className="text-center opacity-60 py-4">
                                No cameras found. Create a camera first.
                            </ThemedText>
                        )}
                    </ThemedView>
                )}
            </AppModal>

            <AppModal
                ref={confirmMoveModalRef}
                title="Camera Already Linked"
                submitLabel="Move to This Room"
                onSubmitOverride={async () => {
                    if (cameraToMove) {
                        confirmMoveModalRef.current?.close();
                        handleLinkCamera(cameraToMove, true);
                    }
                }}
            >
                <ThemedText className="mb-4">
                    <ThemedText type="defaultSemiBold">"{cameraToMove?.name}"</ThemedText> is already linked to another room. Do
                    you want to move it to this room?
                </ThemedText>
            </AppModal>
        </>
    );
}
