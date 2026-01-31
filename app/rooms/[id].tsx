import { AppModal, AppModalRef } from "@/components/app-modal";
import { Button, ButtonProps } from "@/components/button";
import { ThemedSafeAreaView } from "@/components/themed-safe-area-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedTextInput } from "@/components/themed-text-input";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import api from "@/utilities/api";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, FlatList, Modal } from "react-native";

// Types
type SwitchState = {
    type: "on" | "off";
    isOn: boolean;
};

type SwitchDevice = {
    id: string;
    name: string;
    state: SwitchState[];
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

    // Camera Modal
    const [cameraModalVisible, setCameraModalVisible] = useState(false);

    const cameraModalRef = useRef<AppModalRef>(null);
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

    const [addCameraVisible, setAddCameraVisible] = useState(false);
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
            setAddCameraVisible(false);
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
            await api.post("/devices", { name, roomId: id });
            loadRoom();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to create switch");
        }
    };

    const handleDevicePress = (device: SwitchDevice) => {
        setSelectedDevice(device);
        setViewMode("control");
    };

    const handleBackToList = () => {
        setSelectedDevice(null);
        setViewMode("list");
    };

    const toggleDevice = async (deviceId: string, currentState: boolean) => {
        // Optimistic update or call API (API update recommended)
        // For now, simpler implementation:
        console.log("Toggle device", deviceId, !currentState);
        // Implement API call to toggle state here
    };

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

                <Button
                    onclick={() => setCameraModalVisible(true)}
                    className="absolute bottom-4 right-4 bg-black/60 px-4 py-2 rounded-full border border-white/20"
                    label="Change Camera"
                    labelClassName="text-white font-medium"
                />
            </ThemedView>

            {/* Bottom: Device Section (Navigable) */}
            <ThemedView className="flex-1 p-5">
                {viewMode === "list" ? (
                    // VIEW 1: Device List
                    <ThemedView className="flex-1">
                        <ThemedView className="flex-row justify-between items-center mb-4">
                            <ThemedText type="subtitle">Devices</ThemedText>
                            <ThemedView className="flex-row gap-2">
                                <Button
                                    onclick={() => setAddCameraVisible(true)}
                                    variant="none"
                                    className="p-2 bg-gray-100 rounded-lg"
                                >
                                    <IconSymbol name="camera.fill" size={20} color="black" />
                                </Button>
                                <Button
                                    onclick={() => switchModalRef.current?.open()}
                                    variant="none"
                                    className="p-2 bg-gray-100 rounded-lg"
                                >
                                    <IconSymbol name="lightbulb.fill" size={20} color="black" />
                                </Button>
                                <Button onclick={loadRoom} variant="none" className="p-2 bg-gray-100 rounded-lg">
                                    <IconSymbol name="arrow.clockwise" size={20} color="black" />
                                </Button>
                            </ThemedView>
                        </ThemedView>

                        <FlatList
                            data={room.switchDevices}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <Button
                                    variant="none"
                                    layout="plain"
                                    onclick={() => handleDevicePress(item)}
                                    className="flex-row items-center justify-between p-4 mb-3 bg-gray-100 rounded-xl"
                                >
                                    <ThemedView className="flex-row items-center gap-3 bg-transparent">
                                        <IconSymbol name="switch.2" size={24} color="#4B5563" />
                                        <ThemedText type="defaultSemiBold" className="text-black">
                                            {item.name}
                                        </ThemedText>
                                    </ThemedView>

                                    <ThemedView className="flex-row items-center gap-2 bg-transparent">
                                        <ThemedText className="text-gray-500 text-sm">Off</ThemedText>
                                        <Button
                                            variant="none"
                                            layout="plain"
                                            onclick={(setBtnLoading) => {
                                                toggleDevice(item.id, false);
                                            }}
                                            className="w-12 h-7 rounded-full items-start p-1 bg-gray-300"
                                        >
                                            <ThemedView className="w-5 h-5 rounded-full bg-white shadow" />
                                        </Button>
                                    </ThemedView>
                                </Button>
                            )}
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
                            <ThemedText type="subtitle" className="mb-1">
                                {selectedDevice?.name}
                            </ThemedText>
                            <ThemedText className="text-gray-500">Device Control</ThemedText>
                        </ThemedView>

                        {/* On/Off States */}
                        <ThemedView className="flex-row gap-4 mb-10">
                            <Button
                                variant="none"
                                layout="plain"
                                className="flex-1 bg-green-100 p-6 rounded-xl items-center border border-green-200"
                                onclick={() => {}}
                            >
                                <ThemedText className="text-green-800 font-bold text-xl">ON</ThemedText>
                            </Button>
                            <Button
                                variant="none"
                                layout="plain"
                                className="flex-1 bg-red-100 p-6 rounded-xl items-center border border-red-200"
                                onclick={() => {}}
                            >
                                <ThemedText className="text-red-800 font-bold text-xl">OFF</ThemedText>
                            </Button>
                        </ThemedView>

                        {/* D-Pad Control */}
                        <ThemedView className="items-center justify-center">
                            <ThemedView className="w-64 h-64 bg-gray-100 rounded-full relative items-center justify-center p-4">
                                <ThemedView className="absolute top-4">
                                    <ControlBtn icon="chevron.up" label="Up" />
                                </ThemedView>
                                <ThemedView className="absolute bottom-4">
                                    <ControlBtn icon="chevron.down" label="Down" />
                                </ThemedView>
                                <ThemedView className="absolute left-4">
                                    <ControlBtn icon="chevron.left" label="Left" />
                                </ThemedView>
                                <ThemedView className="absolute right-4">
                                    <ControlBtn icon="chevron.right" label="Right" />
                                </ThemedView>

                                {/* Center / Forward/Backward */}
                                <ThemedView className="flex-row gap-4">
                                    <ThemedView className="items-center">
                                        <ControlBtn icon="plus" />
                                        <ThemedText className="text-xs text-gray-500 mt-1">Fwd</ThemedText>
                                    </ThemedView>
                                    <ThemedView className="items-center">
                                        <ControlBtn icon="minus" />
                                        <ThemedText className="text-xs text-gray-500 mt-1">Back</ThemedText>
                                    </ThemedView>
                                </ThemedView>
                            </ThemedView>
                        </ThemedView>
                    </ThemedView>
                )}
            </ThemedView>

            {/* Camera Grid Modal */}
            <Modal visible={cameraModalVisible} transparent animationType="slide">
                <ThemedSafeAreaView className="flex-1 bg-black/90">
                    <ThemedView className="flex-1 p-5 bg-transparent">
                        <ThemedView className="flex-row justify-between items-center mb-6 bg-transparent">
                            <ThemedText className="text-white text-xl font-bold">Select Camera</ThemedText>
                            <Button onclick={() => setCameraModalVisible(false)} variant="none" layout="plain">
                                <IconSymbol name="xmark.circle.fill" size={30} color="white" />
                            </Button>
                        </ThemedView>

                        <FlatList
                            data={room.cameras}
                            numColumns={2}
                            keyExtractor={(item) => item.id}
                            columnWrapperStyle={{ gap: 10 }}
                            renderItem={({ item }) => (
                                <Button
                                    onclick={() => {
                                        setSelectedCamera(item);
                                        setCameraModalVisible(false);
                                    }}
                                    variant="none"
                                    layout="plain"
                                    className={`flex-1 aspect-video bg-gray-800 rounded-lg p-2 items-center justify-center border-2 ${selectedCamera?.id === item.id ? "border-blue-500" : "border-transparent"}`}
                                >
                                    <IconSymbol name="video" size={32} color="white" />
                                    <ThemedText className="text-white mt-2 font-medium">{item.name}</ThemedText>
                                </Button>
                            )}
                        />
                    </ThemedView>
                </ThemedSafeAreaView>
            </Modal>

            {/* Add Camera Modal */}
            <Modal visible={addCameraVisible} transparent animationType="fade">
                <ThemedView className="flex-1 justify-center bg-black/40 px-6">
                    <ThemedView className="rounded-xl p-6">
                        <ThemedText type="subtitle" className="mb-4">
                            Link External Camera
                        </ThemedText>

                        <ThemedText className="mb-1 text-gray-500">Camera ID / Name</ThemedText>
                        <ThemedTextInput
                            className="mb-4"
                            value={newCamId}
                            onChangeText={setNewCamId}
                            placeholder="Enter Camera ID"
                        />

                        <ThemedText className="mb-1 text-gray-500">Password</ThemedText>
                        <ThemedTextInput
                            className="mb-6"
                            value={newCamPassword}
                            onChangeText={setNewCamPassword}
                            placeholder="Enter Camera Password"
                            secureTextEntry
                        />

                        <ThemedView className="flex-row justify-end gap-2 bg-transparent">
                            <Button
                                label="Cancel"
                                variant="none"
                                className="bg-gray-200"
                                labelClassName="text-black"
                                onclick={() => setAddCameraVisible(false)}
                            />

                            <Button label="Link Camera" variant="cta" onclick={handleAddCamera} />
                        </ThemedView>
                    </ThemedView>
                </ThemedView>
            </Modal>

            {/* <AppModal ref={cameraModalRef} ... /> Replaced by custom modal */}
            <AppModal ref={switchModalRef} title="Add Switch" placeholder="Switch Name" onSubmit={handleAddSwitch} />
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
            <IconSymbol name={icon as any} size={24} color="black" />
        </Button>
    );
}
