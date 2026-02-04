import { AppModal, AppModalRef } from "@/components/app-modal";
import { Button, ButtonProps } from "@/components/button";
import { ThemedSafeAreaView } from "@/components/themed-safe-area-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedTextInput } from "@/components/themed-text-input";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import { useMqtt } from "@/context/mqtt-context";
import api from "@/utilities/api";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { Alert, FlatList } from "react-native";

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
    const { deviceStatuses, publishCommand } = useMqtt();
    const [calibrationMode, setCalibrationMode] = useState(false);
    const [xyz, setXyz] = useState({ x: "0", y: "0", z: "0" });
    const [devicePassword, setDevicePassword] = useState("");

    // Camera Modal
    const cameraGridModalRef = useRef<AppModalRef>(null);
    const addCameraModalRef = useRef<AppModalRef>(null);
    const switchModalRef = useRef<AppModalRef>(null);

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

    const handleAddSwitch = async (name: string) => {
        try {
            await api.post("/devices", {
                name,
                roomId: id,
                password: devicePassword,
            });
            setDevicePassword("");
            loadRoom();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to create switch");
        }
    };

    const handleSwitchPress = (device: SwitchDevice, sw: SwitchToggle) => {
        setSelectedDevice(device);
        setSelectedSwitch(sw);
        setXyz({ x: sw.x.toString(), y: sw.y.toString(), z: sw.z.toString() });
        setCalibrationMode(true);
        setViewMode("control");
    };

    const handleBackToList = () => {
        setSelectedDevice(null);
        setSelectedSwitch(null);
        setCalibrationMode(false);
        setViewMode("list");
    };

    const toggleSwitch = async (deviceId: string, switchId: string, currentState: boolean) => {
        publishCommand(deviceId, { switchId, power: currentState ? "OFF" : "ON" });
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
                            <IconSymbol name="camera-reverse-outline" />
                        </Button>
                        <Button
                            onclick={() => addCameraModalRef.current?.open()}
                            variant="none"
                            className="p-2 rounded-lg border border-gray-200 aspect-square"
                            labelClassName="text-black font-medium"
                        >
                            <IconSymbol name="video-camera-add" />
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
                {viewMode === "list" ? (
                    // VIEW 1: Device List
                    <ThemedView className="flex-1">
                        <ThemedView className="flex-row justify-between items-center mb-4">
                            <ThemedText type="subtitle">Switch Devices</ThemedText>
                            <Button
                                onclick={() => switchModalRef.current?.open()}
                                variant="none"
                                className="p-2 rounded-lg border border-gray-200 aspect-square"
                            >
                                <IconSymbol name="add" />
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
                                                        deviceStatuses[item.deviceId] === "online"
                                                            ? "text-green-500 text-xs"
                                                            : "text-gray-400 text-xs"
                                                    }
                                                >
                                                    {deviceStatuses[item.deviceId] === "online" ? "Online" : "Offline"}
                                                </ThemedText>
                                                <Button
                                                    variant="none"
                                                    layout="plain"
                                                    onclick={() => toggleSwitch(item.deviceId, item.id, item.isOn)}
                                                    className={`w-12 h-7 rounded-full items-start p-1 ${item.isOn ? "bg-blue-500" : "bg-gray-300"}`}
                                                >
                                                    <ThemedView
                                                        className={`w-5 h-5 rounded-full bg-white shadow ${item.isOn ? "self-end" : "self-start"}`}
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
                        <Button onclick={handleBackToList} className="flex-row items-center mb-6" variant="none" layout="plain">
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
                )}
            </ThemedView>

            {/* Camera Grid Modal */}
            <AppModal ref={cameraGridModalRef} title="Select Camera">
                <FlatList
                    data={room.cameras}
                    numColumns={2}
                    keyExtractor={(item) => item.id}
                    columnWrapperStyle={{ gap: 10 }}
                    renderItem={({ item }) => (
                        <Button
                            onclick={() => {
                                setSelectedCamera(item);
                                cameraGridModalRef.current?.close();
                            }}
                            variant="none"
                            layout="plain"
                            className={`flex-1 aspect-video bg-gray-800 rounded-lg p-2 items-center justify-center border-2 ${selectedCamera?.id === item.id ? "border-blue-500" : "border-transparent"}`}
                        >
                            <IconSymbol name="video" size={32} color="white" />
                            <ThemedText className="text-white mt-2 font-medium text-center">{item.name}</ThemedText>
                        </Button>
                    )}
                />
                <Button
                    label="Close"
                    variant="none"
                    className="bg-gray-200 mt-4"
                    labelClassName="text-black"
                    onclick={() => cameraGridModalRef.current?.close()}
                />
            </AppModal>

            {/* Add Camera Modal */}
            <AppModal
                ref={addCameraModalRef}
                title="Link External Camera"
                onSubmitOverride={handleAddCamera}
                submitLabel="Link Camera"
            >
                <ThemedText className="mb-1 text-gray-500">Camera ID / Name</ThemedText>
                <ThemedTextInput className="mb-4" value={newCamId} onChangeText={setNewCamId} placeholder="Enter Camera ID" />

                <ThemedText className="mb-1 text-gray-500">Password</ThemedText>
                <ThemedTextInput
                    className="mb-6"
                    value={newCamPassword}
                    onChangeText={setNewCamPassword}
                    placeholder="Enter Camera Password"
                    secureTextEntry
                />
            </AppModal>

            <AppModal ref={switchModalRef} title="Add Switch" placeholder="Switch Name" onSubmit={handleAddSwitch}>
                <ThemedText className="mb-1 text-gray-500">Security Password</ThemedText>
                <ThemedTextInput
                    className="mb-6"
                    value={devicePassword}
                    onChangeText={setDevicePassword}
                    placeholder="Enter Device Password"
                    secureTextEntry
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
            className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm"
        >
            <IconSymbol name={icon as any} size={24} />
        </Button>
    );
}
