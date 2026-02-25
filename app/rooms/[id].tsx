import { AppModalRef } from "@/components/app-modal";
import { ThemedSafeAreaView } from "@/components/themed-safe-area-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useMqtt } from "@/context/mqtt-context";
import { useAuth } from "@/hooks/use-auth";
import api from "@/utilities/api";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, TouchableOpacity } from "react-native";
import { toast } from "sonner-native";

// Components
import { CameraModals } from "@/components/room/camera-modals";
import { Camera, CameraSection } from "@/components/room/camera-section";
import { DeviceControl } from "@/components/room/device-control";
import { DeviceList, RoomDetails, SmartRoomDevice } from "@/components/room/device-list";
import { RoomTabs } from "@/components/room/room-tabs";
import { SensorHistoryModal } from "@/components/room/sensor-history-modal";
import { SensorList } from "@/components/room/sensor-list";
import { ShareRoomModal } from "@/components/room/share-room-modal";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function RoomDetailsScreen() {
    const { id } = useLocalSearchParams();
    const navigation = useNavigation();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Queries
    const {
        data: room,
        isLoading,
        isRefetching,
        refetch,
    } = useQuery<RoomDetails>({
        queryKey: ["room", id],
        queryFn: async ({ signal }) => {
            const res = await api.get(`/rooms/${id}`, { signal });
            const roomData = res.data as RoomDetails;
            roomData.smartRoomDevices.forEach((device) => {
                device.requestTimestamp = roomData.requestTimestamp;
            });
            return roomData;
        },
        enabled: !!user && !!id,
    });

    // State
    const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
    const [viewMode, setViewMode] = useState<"list" | "control">("list");
    const [selectedDevice, setSelectedDevice] = useState<SmartRoomDevice | null>(null);
    const [activeTab, setActiveTab] = useState<"devices" | "sensors">("devices");
    const [selectedSensor, setSelectedSensor] = useState<{ deviceId: string; type: string } | null>(null);
    const [sensorHistory, setSensorHistory] = useState<{ value: number; timestamp: string }[]>([]);
    const [shareRoomModalVisible, setShareRoomModalVisible] = useState(false);
    const [buzzerThreshold, setBuzzerThreshold] = useState("500");
    const [refreshingDevices, setRefreshingDevices] = useState<Record<string, string | undefined>>({});

    // Refs
    const cameraGridModalRef = useRef<AppModalRef>(null);
    const addCameraModalRef = useRef<AppModalRef>(null);
    const sensorHistoryModalRef = useRef<AppModalRef>(null);

    // MQTT
    const { deviceData, subscribeToDevices, unsubscribeFromDevices, sendCommand } = useMqtt();

    useLayoutEffect(() => {
        if (room?.name) {
            navigation.setOptions({
                title: room.name,
                headerRight: () => (
                    <TouchableOpacity onPress={() => setShareRoomModalVisible(true)} className="p-2 mr-2">
                        <IconSymbol library={Ionicons} name="share-social-outline" size={24} />
                    </TouchableOpacity>
                ),
            });
        }
    }, [navigation, room?.name]);

    useEffect(() => {
        if (room?.cameras.length && room?.cameras.length > 0 && !selectedCamera) {
            setSelectedCamera(room.cameras[0]);
        }
    }, [room?.cameras, selectedCamera]);

    const mergedDeviceData = useMemo(() => {
        const merged: Record<string, any> = { ...deviceData };
        if (room) {
            room.smartRoomDevices.forEach((device) => {
                const mqttData = deviceData[device.id];

                // Favor MQTT data if available for this device, otherwise fall back to initial room load.
                // This prevents flickering when timestamps are slightly discordant due to server/device precision differences.
                if (mqttData) {
                    merged[device.id] = { ...device, ...mqttData };
                } else {
                    merged[device.id] = device;
                }
            });
        }
        return merged;
    }, [deviceData, room]);

    // Keep a ref of device IDs so useFocusEffect always sees the latest list
    // without needing room in its dependency array.
    const deviceIdsRef = useRef<string[]>([]);
    useEffect(() => {
        if (room) deviceIdsRef.current = room.smartRoomDevices.map((d) => d.id);
    }, [room]);

    // Subscribe when screen comes into focus, unsubscribe on blur/leave.
    // Stable callbacks from mqtt-context mean this only fires on navigation events.
    useFocusEffect(
        useCallback(() => {
            const ids = deviceIdsRef.current;
            if (ids.length > 0) subscribeToDevices(ids);
            return () => {
                if (deviceIdsRef.current.length > 0) unsubscribeFromDevices(deviceIdsRef.current);
            };
        }, [subscribeToDevices, unsubscribeFromDevices]),
    );

    // Also subscribe when room data arrives (screen may already be focused by then)
    useEffect(() => {
        if (room?.smartRoomDevices.length) {
            subscribeToDevices(room.smartRoomDevices.map((d) => d.id));
        }
    }, [room, subscribeToDevices]);

    // Clear loading state when data arrives
    useEffect(() => {
        setRefreshingDevices((prev) => {
            const next = { ...prev };
            let changed = false;
            Object.keys(next).forEach((deviceId) => {
                const storedTs = next[deviceId];
                const currentTs = deviceData[deviceId]?.requestTimestamp;
                // If we have a stored timestamp and the current one is newer (different), stop refreshing
                if (currentTs && storedTs !== currentTs) {
                    delete next[deviceId];
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [deviceData]);

    // Handlers

    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const handleSensorClick = async (deviceId: string, type: string) => {
        setSelectedSensor({ deviceId, type });
        setSensorHistory([]);
        setIsHistoryLoading(true);
        sensorHistoryModalRef.current?.open();

        try {
            const res = await api.get(`/devices/${deviceId}/readings`, {
                params: { type },
            });
            setSensorHistory(res.data);
        } catch (error) {
            console.error("Failed to fetch sensor history", error);
            toast.error("Failed to fetch sensor history");
        } finally {
            setIsHistoryLoading(false);
        }
    };

    const handleRemoveCamera = async (cameraId: string) => {
        try {
            await api.post("/cameras/remove-from-room", { cameraId });
            queryClient.invalidateQueries({ queryKey: ["room", id] });
            if (selectedCamera?.id === cameraId) {
                setSelectedCamera(null);
            }
            toast.success("Camera removed from room");
        } catch (error) {
            console.error(error);
            toast.error("Failed to remove camera from room");
        }
    };

    const handleDevicePress = (device: SmartRoomDevice) => {
        setSelectedDevice(device);
        setBuzzerThreshold(device.buzzerThreshold?.toString() || "500");
        setViewMode("control");
    };

    const handleUpdateThreshold = async () => {
        if (!selectedDevice) return;
        try {
            await api.put(`/devices/${selectedDevice.id}`, {
                buzzerThreshold: parseFloat(buzzerThreshold),
            });
            sendCommand(selectedDevice.id, {
                type: "SET_THRESHOLD",
                threshold: parseFloat(buzzerThreshold),
            });
            toast.success("Buzzer threshold updated");
            queryClient.invalidateQueries({ queryKey: ["room", id] });
        } catch (error) {
            console.error(error);
            toast.error("Failed to update buzzer threshold");
        }
    };

    const handleRefresh = (deviceId: string) => {
        const currentTs = mergedDeviceData[deviceId]?.requestTimestamp;
        setRefreshingDevices((prev) => ({ ...prev, [deviceId]: currentTs }));
        sendCommand(deviceId, { type: "REFRESH" });
    };

    return (
        <ThemedSafeAreaView className="flex-1" edges={["bottom", "left", "right"]}>
            {(() => {
                if (isLoading && !isRefetching) {
                    return (
                        <ThemedView className="flex-1 items-center justify-center">
                            <ActivityIndicator size="large" color="#007AFF" />
                        </ThemedView>
                    );
                }

                if (!room) {
                    return (
                        <ThemedView className="flex-1 items-center justify-center">
                            <ThemedText>Room not found</ThemedText>
                        </ThemedView>
                    );
                }

                return (
                    <ThemedView className="flex-1 gap-4 py-4">
                        <CameraSection
                            selectedCamera={selectedCamera}
                            onOpenGrid={() => cameraGridModalRef.current?.open()}
                            onOpenAdd={() => addCameraModalRef.current?.open()}
                        />

                        <ThemedView className="flex-1 p-5">
                            <RoomTabs activeTab={activeTab} setActiveTab={setActiveTab} />

                            {activeTab === "devices" ? (
                                viewMode === "list" ? (
                                    <DeviceList
                                        room={room}
                                        mergedDeviceData={mergedDeviceData}
                                        onDevicePress={handleDevicePress}
                                    />
                                ) : (
                                    <DeviceControl
                                        selectedDevice={selectedDevice}
                                        mergedDeviceData={mergedDeviceData}
                                        onBack={() => setViewMode("list")}
                                        buzzerThreshold={buzzerThreshold}
                                        setBuzzerThreshold={setBuzzerThreshold}
                                        onUpdateThreshold={handleUpdateThreshold}
                                    />
                                )
                            ) : (
                                <SensorList
                                    room={room}
                                    mergedDeviceData={mergedDeviceData}
                                    onSensorClick={handleSensorClick}
                                    onRefresh={handleRefresh}
                                    refreshingDevices={new Set(Object.keys(refreshingDevices))}
                                />
                            )}
                        </ThemedView>

                        <CameraModals
                            cameraGridModalRef={cameraGridModalRef}
                            addCameraModalRef={addCameraModalRef}
                            cameras={room.cameras}
                            selectedCamera={selectedCamera}
                            setSelectedCamera={setSelectedCamera}
                            handleRemoveCamera={handleRemoveCamera}
                            roomId={id as string}
                            onRefresh={refetch}
                        />

                        <SensorHistoryModal
                            modalRef={sensorHistoryModalRef}
                            selectedSensor={selectedSensor}
                            sensorHistory={sensorHistory}
                            isLoading={isHistoryLoading}
                        />

                        <ShareRoomModal
                            visible={shareRoomModalVisible}
                            onClose={() => setShareRoomModalVisible(false)}
                            roomId={id as string}
                        />
                    </ThemedView>
                );
            })()}
        </ThemedSafeAreaView>
    );
}
