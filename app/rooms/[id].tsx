import { AppModal, AppModalRef } from "@/components/app-modal";
import { Button, ButtonProps } from "@/components/button";
import { ThemedSafeAreaView } from "@/components/themed-safe-area-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedTextInput } from "@/components/themed-text-input";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMqtt } from "@/context/mqtt-context";
import { useAuth } from "@/hooks/use-auth";
import api from "@/utilities/api";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, Pressable } from "react-native";

// Types
type SwitchToggle = {
    id: string;
    name: string;
    type: "on" | "off";
    isOn: boolean;
    x: number;
    y: number;
    z: number;
};

type SwitchDevice = {
    id: string;
    name: string;
    toggles: SwitchToggle[];
    readings?: { type: string; value: number }[];
};

type Camera = {
    id: string;
    name: string;
    is_online: boolean;
};

type RoomDetails = {
    id: string;
    name: string;
    switchDevices: SwitchDevice[];
    cameras: Camera[];
};

export default function RoomDetailsScreen() {
    const { id } = useLocalSearchParams();
    const navigation = useNavigation();
    const { user } = useAuth();
    const [room, setRoom] = useState<RoomDetails | null>(null);
    const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
    const [viewMode, setViewMode] = useState<"list" | "control">("list");
    const [selectedDevice, setSelectedDevice] = useState<SwitchDevice | null>(null);
    const [selectedSwitch, setSelectedSwitch] = useState<SwitchToggle | null>(null);
    const { deviceData, subscribeToDevices, unsubscribeFromDevices, sendCommand } = useMqtt();
    const [calibrationMode, setCalibrationMode] = useState(false);
    const [xyz, setXyz] = useState({ x: "0", y: "0", z: "0" });
    const [devicePassword, setDevicePassword] = useState("");
    const [activeTab, setActiveTab] = useState<"switches" | "sensors">("switches");
    const router = useRouter();

    const mergedDeviceData = useMemo(() => {
        const merged: Record<string, any> = { ...deviceData };

        if (room) {
            room.switchDevices.forEach((device) => {
                const current = merged[device.id] || {};
                const readings = device.readings || [];

                const motion = readings.find((r) => r.type === "motion");
                const temp = readings.find((r) => r.type === "temperature");
                const humidity = readings.find((r) => r.type === "humidity");

                merged[device.id] = {
                    ...current,
                    motion: current.motion ?? motion?.value,
                    temperature: current.temperature ?? temp?.value,
                    humidity: current.humidity ?? humidity?.value,
                };
            });
        }
        return merged;
    }, [deviceData, room]);

    const cameraGridModalRef = useRef<AppModalRef>(null);
    const addCameraModalRef = useRef<AppModalRef>(null);
    const sensorHistoryModalRef = useRef<AppModalRef>(null);

    const [selectedSensor, setSelectedSensor] = useState<{ deviceId: string; type: string } | null>(null);
    const [sensorHistory, setSensorHistory] = useState<{ value: number; timestamp: string }[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const loadRoom = async () => {
        if (!user) return;
        try {
            const res = await api.get(`/rooms/${id}`);
            const roomData = res.data;
            setRoom(roomData);
            navigation.setOptions({ title: roomData.name });

            // Set default selected camera
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

    // Subscribe to all devices in the room
    useEffect(() => {
        if (room && room.switchDevices.length > 0) {
            const deviceIds = room.switchDevices.map((d) => d.id);
            subscribeToDevices(deviceIds);

            return () => {
                unsubscribeFromDevices(deviceIds);
            };
        }
    }, [room, id, subscribeToDevices, unsubscribeFromDevices]);

    const [newCamId, setNewCamId] = useState("");
    const [newCamPassword, setNewCamPassword] = useState("");

    const handleAddCamera: ButtonProps["onclick"] = async (setBtnLoading) => {
        if (!setBtnLoading) return;
        setBtnLoading(true);
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
            setBtnLoading(false);
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

    const handleBackToList = () => {
        setSelectedDevice(null);
        setSelectedSwitch(null);
        setCalibrationMode(false);
        setViewMode("list");
    };

    const handleSwitchPress = (device: SwitchDevice, sw: SwitchToggle) => {
        setSelectedDevice(device);
        setSelectedSwitch(sw);
        setXyz({ x: sw.x.toString(), y: sw.y.toString(), z: sw.z.toString() });
        setCalibrationMode(true);
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

            // Also update the backend with new XYZ
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
            {/* Top: Camera Section (Persistent) */}
            <ThemedView className="h-64 bg-black relative">
                <ThemedView className="px-5 flex-row justify-between items-center mb-4">
                    <ThemedText type="subtitle">Cameras</ThemedText>
                    <ThemedView className="flex-row gap-4">
                        <Button
                            onclick={() => cameraGridModalRef.current?.open()}
                            variant="none"
                            className="p-1.5 rounded-lg border border-gray-200 aspect-square"
                            labelClassName="text-black font-medium"
                        >
                            <IconSymbol library={Ionicons} name="camera-reverse-outline" />
                        </Button>
                        <Button
                            onclick={() => addCameraModalRef.current?.open()}
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
                        {/* Mock Live View */}
                        <IconSymbol name="video.fill" size={64} color="white" />
                        <ThemedText className="text-white mt-2">{selectedCamera.name} (Live)</ThemedText>
                    </ThemedView>
                ) : (
                    <ThemedView className="flex-1 items-center justify-center bg-gray-800">
                        <ThemedText className="text-gray-400">No Camera Selected</ThemedText>
                    </ThemedView>
                )}
            </ThemedView>

            {/* Bottom: Device Section (Navigable) */}
            <ThemedView className="flex-1 p-5">
                {/* Tab Navigation */}
                <ThemedView className="flex-row mb-4 bg-gray-100 rounded-xl p-1">
                    <Pressable
                        onPress={() => setActiveTab("switches")}
                        className={`flex-1 py-2 rounded-lg items-center ${activeTab === "switches" ? "bg-white" : ""}`}
                        style={
                            activeTab === "switches"
                                ? {
                                      shadowColor: "#000",
                                      shadowOffset: { width: 0, height: 1 },
                                      shadowOpacity: 0.1,
                                      shadowRadius: 2,
                                      elevation: 2,
                                  }
                                : undefined
                        }
                    >
                        <ThemedText className={activeTab === "switches" ? "font-semibold" : "text-gray-500"}>Switches</ThemedText>
                    </Pressable>
                    <Pressable
                        onPress={() => setActiveTab("sensors")}
                        className={`flex-1 py-2 rounded-lg items-center ${activeTab === "sensors" ? "bg-white" : ""}`}
                        style={
                            activeTab === "sensors"
                                ? {
                                      shadowColor: "#000",
                                      shadowOffset: { width: 0, height: 1 },
                                      shadowOpacity: 0.1,
                                      shadowRadius: 2,
                                      elevation: 2,
                                  }
                                : undefined
                        }
                    >
                        <ThemedText className={activeTab === "sensors" ? "font-semibold" : "text-gray-500"}>Sensors</ThemedText>
                    </Pressable>
                </ThemedView>

                {activeTab === "switches" ? (
                    viewMode === "list" ? (
                        // VIEW 1: Device List
                        <ThemedView className="flex-1">
                            <ThemedView className="flex-row justify-between items-center mb-4">
                                <ThemedText type="subtitle">Switch Devices</ThemedText>
                                <Button
                                    onclick={() => router.push("/(tabs)/device-setup")}
                                    variant="none"
                                    className="p-2 rounded-lg border border-gray-200 aspect-square"
                                >
                                    <IconSymbol library={MaterialIcons} name="add" />
                                </Button>
                            </ThemedView>

                            <FlatList
                                data={flattenedSwitches}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => {
                                    const device = room.switchDevices.find((d) => d.id === item.deviceId)!;
                                    return (
                                        <ThemedView className="mb-4 bg-gray-50 rounded-xl p-2 border border-gray-100">
                                            <ThemedText className="text-gray-400 text-xs px-2 mb-1 uppercase font-bold">
                                                {item.deviceName}
                                            </ThemedText>
                                            <Button
                                                variant="none"
                                                layout="plain"
                                                onclick={() => handleSwitchPress(device, item)}
                                                className="flex-row items-center justify-between px-2"
                                            >
                                                <ThemedText className="font-medium">{item.name}</ThemedText>

                                                <ThemedView className="flex-row items-center gap-4">
                                                    <ThemedText
                                                        className={
                                                            mergedDeviceData[item.deviceId]?.status === "online"
                                                                ? "text-green-500 text-xs"
                                                                : "text-gray-400 text-xs"
                                                        }
                                                    >
                                                        {mergedDeviceData[item.deviceId]?.status === "online"
                                                            ? "Online"
                                                            : "Offline"}
                                                    </ThemedText>
                                                    <Button
                                                        variant="none"
                                                        layout="plain"
                                                        onclick={() => toggleSwitch(item.deviceId, item.id, item.isOn)}
                                                        className={`w-12 h-7 rounded-full items-start p-1 ${item.isOn ? "bg-blue-500" : "bg-gray-300"}`}
                                                    >
                                                        <ThemedView
                                                            className={`w-5 h-5 rounded-full bg-white ${item.isOn ? "self-end" : "self-start"}`}
                                                            style={{
                                                                shadowColor: "#000",
                                                                shadowOffset: { width: 0, height: 1 },
                                                                shadowOpacity: 0.2,
                                                                shadowRadius: 1.41,
                                                                elevation: 2,
                                                            }}
                                                        />
                                                    </Button>
                                                </ThemedView>
                                            </Button>
                                        </ThemedView>
                                    );
                                }}
                                ListEmptyComponent={
                                    <ThemedText className="text-center text-gray-400 mt-10">No devices in this room.</ThemedText>
                                }
                            />
                        </ThemedView>
                    ) : (
                        // VIEW 2: Device Control (State Edit)
                        <ThemedView className="flex-1">
                            <Button
                                onclick={handleBackToList}
                                className="flex-row items-center mb-6"
                                variant="none"
                                layout="plain"
                            >
                                <IconSymbol name="chevron.left" size={24} color="#2563EB" />
                                <ThemedText type="link" className="font-medium text-lg ml-1">
                                    Back to Devices
                                </ThemedText>
                            </Button>

                            <ThemedView className="items-center mb-8">
                                <ThemedText type="subtitle" className="mb-1 text-gray-400 text-sm uppercase">
                                    {selectedDevice?.name}
                                </ThemedText>
                                <ThemedText type="subtitle" className="mb-1">
                                    {selectedSwitch?.name}
                                </ThemedText>
                                <ThemedText className="text-gray-500">Calibration & Control</ThemedText>
                            </ThemedView>

                            {/* On/Off States */}
                            <ThemedView className="flex-row gap-4 mb-6">
                                <Button
                                    variant="none"
                                    layout="plain"
                                    className={`flex-1 p-6 rounded-xl items-center border ${selectedSwitch?.isOn ? "bg-green-100 border-green-200" : "bg-gray-100 border-gray-200"}`}
                                    onclick={() => toggleSwitch(selectedDevice?.id!, selectedSwitch?.id!, false)}
                                >
                                    <ThemedText
                                        className={`${selectedSwitch?.isOn ? "text-green-800" : "text-gray-400"} font-bold text-xl`}
                                    >
                                        ON
                                    </ThemedText>
                                </Button>
                                <Button
                                    variant="none"
                                    layout="plain"
                                    className={`flex-1 p-6 rounded-xl items-center border ${!selectedSwitch?.isOn ? "bg-red-100 border-red-200" : "bg-gray-100 border-gray-200"}`}
                                    onclick={() => toggleSwitch(selectedDevice?.id!, selectedSwitch?.id!, true)}
                                >
                                    <ThemedText
                                        className={`${!selectedSwitch?.isOn ? "text-red-800" : "text-gray-400"} font-bold text-xl`}
                                    >
                                        OFF
                                    </ThemedText>
                                </Button>
                            </ThemedView>

                            <ThemedView className="gap-4 bg-gray-100 p-4 rounded-xl mb-6">
                                <ThemedView className="flex-row gap-2">
                                    <ThemedTextInput
                                        className="flex-1 bg-white"
                                        placeholder="X"
                                        value={xyz.x}
                                        onChangeText={(val) => setXyz((prev) => ({ ...prev, x: val }))}
                                        keyboardType="numeric"
                                    />
                                    <ThemedTextInput
                                        className="flex-1 bg-white"
                                        placeholder="Y"
                                        value={xyz.y}
                                        onChangeText={(val) => setXyz((prev) => ({ ...prev, y: val }))}
                                        keyboardType="numeric"
                                    />
                                    <ThemedTextInput
                                        className="flex-1 bg-white"
                                        placeholder="Z"
                                        value={xyz.z}
                                        onChangeText={(val) => setXyz((prev) => ({ ...prev, z: val }))}
                                        keyboardType="numeric"
                                    />
                                </ThemedView>
                                <Button label="Update Calibration (.local)" onclick={handleCalibration} />
                            </ThemedView>
                        </ThemedView>
                    )
                ) : (
                    // Sensors Tab
                    <ThemedView className="flex-1">
                        <ThemedView className="flex-row justify-between items-center mb-4">
                            <ThemedText type="subtitle">Sensor Data</ThemedText>
                        </ThemedView>

                        <FlatList
                            data={room.switchDevices}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => {
                                const sensorData = mergedDeviceData[item.id];
                                const motionValue = sensorData?.motion;
                                const motionDetected = motionValue === 1; // Calibrate: 1 = detected, 0 = clear
                                const temperature = sensorData?.temperature;
                                const humidity = sensorData?.humidity;

                                return (
                                    <ThemedView className="mb-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <ThemedText className="text-gray-400 text-xs px-2 mb-2 uppercase font-bold">
                                            {item.name}
                                        </ThemedText>

                                        {/* Motion Sensor */}
                                        {motionValue !== undefined && (
                                            <Pressable onPress={() => handleSensorClick(item.id, "motion")}>
                                                <ThemedView className="flex-row items-center justify-between px-2 mb-3">
                                                    <ThemedView className="flex-row items-center gap-2">
                                                        <IconSymbol
                                                            library={MaterialCommunityIcons}
                                                            name="sensor"
                                                            size={20}
                                                            color={motionDetected ? "#ef4444" : "#6b7280"}
                                                        />
                                                        <ThemedText className="font-medium">Motion Sensor</ThemedText>
                                                    </ThemedView>
                                                    <ThemedView className="flex-row items-center gap-2">
                                                        <ThemedText className="text-xs text-gray-400">
                                                            Value: {motionValue}
                                                        </ThemedText>
                                                        <ThemedText
                                                            className={
                                                                motionDetected ? "text-red-500 font-bold" : "text-gray-500"
                                                            }
                                                        >
                                                            {motionDetected ? "DETECTED" : "Clear"}
                                                        </ThemedText>
                                                    </ThemedView>
                                                </ThemedView>
                                            </Pressable>
                                        )}

                                        {/* Temperature Sensor */}
                                        {temperature !== undefined && (
                                            <Pressable onPress={() => handleSensorClick(item.id, "temperature")}>
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
                                                    <ThemedText className="text-orange-600 font-bold">
                                                        {temperature.toFixed(1)}°C
                                                    </ThemedText>
                                                </ThemedView>
                                            </Pressable>
                                        )}

                                        {/* Humidity Sensor */}
                                        {humidity !== undefined && (
                                            <Pressable onPress={() => handleSensorClick(item.id, "humidity")}>
                                                <ThemedView className="flex-row items-center justify-between px-2">
                                                    <ThemedView className="flex-row items-center gap-2">
                                                        <IconSymbol library={Ionicons} name="water" size={20} color="#3b82f6" />
                                                        <ThemedText className="font-medium">Humidity</ThemedText>
                                                    </ThemedView>
                                                    <ThemedText className="text-blue-600 font-bold">
                                                        {humidity.toFixed(1)}%
                                                    </ThemedText>
                                                </ThemedView>
                                            </Pressable>
                                        )}

                                        {motionValue === undefined && temperature === undefined && humidity === undefined && (
                                            <ThemedText className="text-center text-gray-400 py-4">
                                                No sensor data available
                                            </ThemedText>
                                        )}
                                    </ThemedView>
                                );
                            }}
                            ListEmptyComponent={
                                <ThemedText className="text-center text-gray-400 mt-10">
                                    No devices with sensors in this room.
                                </ThemedText>
                            }
                        />
                    </ThemedView>
                )}
            </ThemedView>

            {/* Sensor History Modal */}
            <AppModal
                ref={sensorHistoryModalRef}
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
                    onclick={() => sensorHistoryModalRef.current?.close()}
                />
            </AppModal>
        </ThemedSafeAreaView>
    );
}

function ControlBtn({ icon, label }: { icon: string; label?: string }) {
    return (
        <Button
            variant="none"
            onclick={() => {}}
            className="w-12 h-12 bg-white rounded-full items-center justify-center"
            style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
            }}
        >
            <IconSymbol name={icon as any} size={24} />
        </Button>
    );
}
