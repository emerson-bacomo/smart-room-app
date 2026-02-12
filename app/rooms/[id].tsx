import { AppModalRef } from "@/components/app-modal";
import { ThemedSafeAreaView } from "@/components/themed-safe-area-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useMqtt } from "@/context/mqtt-context";
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/hooks/use-auth";
import api from "@/utilities/api";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, TouchableOpacity } from "react-native";

// Components
import { CameraModals } from "@/components/room/camera-modals";
import { Camera, CameraSection } from "@/components/room/camera-section";
import { DeviceControl } from "@/components/room/device-control";
import { RoomTabs } from "@/components/room/room-tabs";
import { SensorHistoryModal } from "@/components/room/sensor-history-modal";
import { SensorList } from "@/components/room/sensor-list";
import { ShareRoomModal } from "@/components/room/share-room-modal";
import { RoomDetails, SwitchDevice, SwitchList, SwitchToggle } from "@/components/room/switch-list";
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
            roomData.switchDevices.forEach((device) => {
                device.requestTimestamp = roomData.requestTimestamp;
            });
            return roomData;
        },
        enabled: !!user && !!id,
    });

    // State
    const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
    const [viewMode, setViewMode] = useState<"list" | "control">("list");
    const [selectedDevice, setSelectedDevice] = useState<SwitchDevice | null>(null);
    const [selectedSwitch, setSelectedSwitch] = useState<SwitchToggle | null>(null);
    const [activeTab, setActiveTab] = useState<"switches" | "sensors">("switches");
    const [xyz, setXyz] = useState({ x: "0", y: "0", z: "0" });
    const [selectedSensor, setSelectedSensor] = useState<{ deviceId: string; type: string } | null>(null);
    const [sensorHistory, setSensorHistory] = useState<{ value: number; timestamp: string }[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [shareRoomModalVisible, setShareRoomModalVisible] = useState(false);

    // Refs
    const cameraGridModalRef = useRef<AppModalRef>(null);
    const addCameraModalRef = useRef<AppModalRef>(null);
    const sensorHistoryModalRef = useRef<AppModalRef>(null);

    // MQTT
    const { deviceData, subscribeToDevices, unsubscribeFromDevices, sendCommand } = useMqtt();

    useLayoutEffect(() => {
        if (room?.name) {
            navigation.setOptions({ title: room.name });
        }
    }, [navigation, room?.name]);

    useEffect(() => {
        if (room?.cameras.length && room?.cameras.length > 0 && !selectedCamera) {
            setSelectedCamera(room.cameras[0]);
        }
    }, [room?.cameras, selectedCamera]);

    const mergedDeviceData = useMemo(() => {
        const merged: Record<string, SwitchDevice> = { ...deviceData };
        if (room) {
            room.switchDevices.forEach((device) => {
                const mqttData = deviceData[device.id];
                const roomTimestamp = room.requestTimestamp ? new Date(room.requestTimestamp).getTime() : 0;
                const mqttTimestamp = mqttData?.requestTimestamp ? new Date(mqttData.requestTimestamp).getTime() : 0;

                // Priority: Use MQTT data if it's strictly newer than the initial room load
                if (mqttTimestamp > roomTimestamp && mqttData) {
                    merged[device.id] = mqttData;
                } else {
                    // Otherwise use the data from the room object (which is already flattened)
                    merged[device.id] = device;
                }
            });
        }
        return merged;
    }, [deviceData, room]);

    useEffect(() => {
        if (room && room.switchDevices.length > 0) {
            const deviceIds = room.switchDevices.map((d) => d.id);
            subscribeToDevices(deviceIds);
            return () => unsubscribeFromDevices(deviceIds);
        }
    }, [room, id, subscribeToDevices, unsubscribeFromDevices]);

    const toast = useToast();

    // Handlers

    const handleSensorClick = async (deviceId: string, type: string) => {
        setSelectedSensor({ deviceId, type });
        setLoadingHistory(true);
        sensorHistoryModalRef.current?.open();
        try {
            const res = await api.get(`/devices/${deviceId}/readings?type=${type}`);
            setSensorHistory(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch sensor history");
        } finally {
            setLoadingHistory(false);
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

    const handleSwitchPress = (device: SwitchDevice, sw: SwitchToggle) => {
        setSelectedDevice(device);
        setSelectedSwitch(sw);
        setXyz({ x: sw.x.toString(), y: sw.y.toString(), z: sw.z.toString() });
        setViewMode("control");
    };

    const toggleSwitch = async (deviceId: string, switchId: string, currentState: boolean) => {
        sendCommand(deviceId, { switchId, power: currentState ? "OFF" : "ON" });
    };

    const handleCalibration = async () => {
        if (!selectedDevice || !selectedSwitch) return;
        const deviceUrl = `http://${selectedDevice.name}.local/move?switchId=${selectedSwitch.id}&x=${xyz.x}&y=${xyz.y}&z=${xyz.z}`;
        try {
            const res = await fetch(deviceUrl);
            if (!res.ok) throw new Error("Request failed");
            await api.patch(`/switches/${selectedSwitch.id}/calibration`, {
                x: parseFloat(xyz.x),
                y: parseFloat(xyz.y),
                z: parseFloat(xyz.z),
            });
            toast.success("Calibration command sent and saved");
            queryClient.invalidateQueries({ queryKey: ["room", id] });
        } catch (error) {
            toast.error(`Connection Failed: Ensure you are on the same Wi-Fi as ${selectedDevice.name}`);
        }
    };

    const flattenedSwitches = useMemo(() => {
        if (!room) return [];
        return room.switchDevices.flatMap((device) =>
            device.toggles.map((sw) => ({
                ...sw,
                deviceName: device.name,
                deviceId: device.id,
            })),
        );
    }, [room]);

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
                    <>
                        <ThemedView className="flex-row justify-between items-center px-5 pt-4 pb-2">
                            <ThemedText type="subtitle">{room.name}</ThemedText>
                            <TouchableOpacity onPress={() => setShareRoomModalVisible(true)} className="p-2">
                                <IconSymbol library={Ionicons} name="share-social-outline" size={24} style={{ opacity: 0.8 }} />
                            </TouchableOpacity>
                        </ThemedView>

                        <CameraSection
                            selectedCamera={selectedCamera}
                            onOpenGrid={() => cameraGridModalRef.current?.open()}
                            onOpenAdd={() => addCameraModalRef.current?.open()}
                        />

                        <ThemedView className="flex-1 p-5">
                            <RoomTabs activeTab={activeTab} setActiveTab={setActiveTab} />

                            {activeTab === "switches" ? (
                                viewMode === "list" ? (
                                    <SwitchList
                                        room={room}
                                        flattenedSwitches={flattenedSwitches}
                                        mergedDeviceData={mergedDeviceData}
                                        onSwitchPress={handleSwitchPress}
                                        onToggleSwitch={toggleSwitch}
                                    />
                                ) : (
                                    <DeviceControl
                                        selectedDevice={selectedDevice}
                                        selectedSwitch={selectedSwitch}
                                        xyz={xyz}
                                        setXyz={setXyz}
                                        onBack={() => setViewMode("list")}
                                        onToggleSwitch={toggleSwitch}
                                        onCalibration={handleCalibration}
                                    />
                                )
                            ) : (
                                <SensorList room={room} mergedDeviceData={mergedDeviceData} onSensorClick={handleSensorClick} />
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
                            loadingHistory={loadingHistory}
                        />

                        <ShareRoomModal
                            visible={shareRoomModalVisible}
                            onClose={() => setShareRoomModalVisible(false)}
                            roomId={id as string}
                        />
                    </>
                );
            })()}
        </ThemedSafeAreaView>
    );
}
