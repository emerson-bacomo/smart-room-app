import { AppModalRef } from "@/components/app-modal";
import { ThemedSafeAreaView } from "@/components/themed-safe-area-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useMqtt } from "@/context/mqtt-context";
import { useAuth } from "@/hooks/use-auth";
import api from "@/utilities/api";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";

// Components
import { CameraModals } from "@/components/room/camera-modals";
import { Camera, CameraSection } from "@/components/room/camera-section";
import { DeviceControl } from "@/components/room/device-control";
import { RoomTabs } from "@/components/room/room-tabs";
import { SensorHistoryModal } from "@/components/room/sensor-history-modal";
import { SensorList } from "@/components/room/sensor-list";
import { RoomDetails, SwitchDevice, SwitchList, SwitchToggle } from "@/components/room/switch-list";

export default function RoomDetailsScreen() {
    const { id } = useLocalSearchParams();
    const navigation = useNavigation();
    const { user } = useAuth();

    // State
    const [room, setRoom] = useState<RoomDetails | null>(null);
    const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
    const [viewMode, setViewMode] = useState<"list" | "control">("list");
    const [selectedDevice, setSelectedDevice] = useState<SwitchDevice | null>(null);
    const [selectedSwitch, setSelectedSwitch] = useState<SwitchToggle | null>(null);
    const [activeTab, setActiveTab] = useState<"switches" | "sensors">("switches");
    const [xyz, setXyz] = useState({ x: "0", y: "0", z: "0" });
    const [newCamId, setNewCamId] = useState("");
    const [newCamPassword, setNewCamPassword] = useState("");
    const [selectedSensor, setSelectedSensor] = useState<{ deviceId: string; type: string } | null>(null);
    const [sensorHistory, setSensorHistory] = useState<{ value: number; timestamp: string }[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Refs
    const cameraGridModalRef = useRef<AppModalRef>(null);
    const addCameraModalRef = useRef<AppModalRef>(null);
    const sensorHistoryModalRef = useRef<AppModalRef>(null);

    // MQTT
    const { deviceData, subscribeToDevices, unsubscribeFromDevices, sendCommand } = useMqtt();

    const mergedDeviceData = useMemo(() => {
        const merged: Record<string, SwitchDevice> = { ...deviceData };
        if (room) {
            room.switchDevices.forEach((device) => {
                const mqttData = deviceData[device.id];
                const roomTimestamp = room.requestTimestamp ? new Date(room.requestTimestamp).getTime() : 0;
                const mqttTimestamp = mqttData?.requestTimestamp ? new Date(mqttData.requestTimestamp).getTime() : 0;
                console.log(device);

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

    const loadRoom = async () => {
        if (!user) return;
        try {
            const res = await api.get(`/rooms/${id}`);
            const roomData = res.data as RoomDetails;
            roomData.switchDevices.forEach((device) => {
                device.requestTimestamp = roomData.requestTimestamp;
            });

            roomData.cameras = []; // TODO: only temp

            setRoom(roomData);
            navigation.setOptions({ title: roomData.name });
            if (roomData.cameras.length > 0 && !selectedCamera) {
                setSelectedCamera(roomData.cameras[0]);
            }
        } catch (error) {
            console.error("Failed to load room:", error);
            Alert.alert("Error", "Failed to load room details");
        }
    };

    useEffect(() => {
        if (id) loadRoom();
    }, [id]);

    useEffect(() => {
        if (room && room.switchDevices.length > 0) {
            const deviceIds = room.switchDevices.map((d) => d.id);
            subscribeToDevices(deviceIds);
            return () => unsubscribeFromDevices(deviceIds);
        }
    }, [room, id, subscribeToDevices, unsubscribeFromDevices]);

    // Handlers
    const handleAddCamera = async (setBtnLoading?: (loading: boolean) => void) => {
        if (setBtnLoading) setBtnLoading(true);
        try {
            await api.post("/cameras", {
                externalId: newCamId,
                password: newCamPassword,
                roomId: id,
            });
            addCameraModalRef.current?.close();
            setNewCamId("");
            setNewCamPassword("");
            loadRoom();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to link camera. Check ID and Password.");
        } finally {
            if (setBtnLoading) setBtnLoading(false);
        }
    };

    const handleSensorClick = async (deviceId: string, type: string) => {
        setSelectedSensor({ deviceId, type });
        setLoadingHistory(true);
        sensorHistoryModalRef.current?.open();
        try {
            const res = await api.get(`/devices/${deviceId}/readings?type=${type}`);
            setSensorHistory(res.data);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to fetch sensor history");
        } finally {
            setLoadingHistory(false);
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
            Alert.alert("Success", "Calibration command sent and saved.");
            loadRoom();
        } catch (error) {
            Alert.alert("Connection Failed", `Please ensure you are on the same Wi-Fi network as ${selectedDevice.name}.`);
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

    if (!room)
        return (
            <ThemedView className="flex-1 items-center justify-center">
                <ThemedText>Loading...</ThemedText>
            </ThemedView>
        );

    return (
        <ThemedSafeAreaView className="flex-1" edges={["bottom", "left", "right"]}>
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
                newCamId={newCamId}
                setNewCamId={setNewCamId}
                newCamPassword={newCamPassword}
                setNewCamPassword={setNewCamPassword}
                handleAddCamera={handleAddCamera}
            />

            <SensorHistoryModal
                modalRef={sensorHistoryModalRef}
                selectedSensor={selectedSensor}
                sensorHistory={sensorHistory}
                loadingHistory={loadingHistory}
            />
        </ThemedSafeAreaView>
    );
}
