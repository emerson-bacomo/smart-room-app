import { AppModal, AppModalRef } from "@/components/app-modal";
import { Button } from "@/components/button";
import { ThemedText } from "@/components/themed-text";
import { ThemedTextInput } from "@/components/themed-text-input";
import { IconSymbol } from "@/components/ui/icon-symbol";
import api from "@/utilities/api";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Modal, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

interface ShareRoomModalProps {
    visible: boolean;
    onClose: () => void;
    roomId: string;
}

export function ShareRoomModal({ visible, onClose, roomId }: ShareRoomModalProps) {
    const [shareUrl, setShareUrl] = useState("");
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        if (visible && roomId) {
            loadShareUrl();
        }
    }, [visible, roomId]);

    const loadShareUrl = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/rooms/share/${roomId}`);
            setShareUrl(res.data.shareUrl);
        } catch (error) {
            Alert.alert("Error", "Failed to generate share link");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(shareUrl);
        Alert.alert("Success", "Link copied to clipboard");
    };

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <View className="flex-1 justify-center items-center bg-black/50">
                <View className="w-[85%] bg-white rounded-[20px] p-[30px] items-center shadow-lg">
                    <Text className="text-[22px] font-bold mb-5">Share Room</Text>

                    <View className="mb-5 p-2.5 bg-white">
                        {loading ? <ActivityIndicator /> : shareUrl ? <QRCode value={shareUrl} size={200} /> : null}
                    </View>

                    <Text className="text-[#666] text-xs mb-5" numberOfLines={1}>
                        {shareUrl}
                    </Text>

                    <TouchableOpacity
                        className="flex-row bg-[#007AFF] py-3 px-5 rounded-[10px] items-center gap-2.5 mb-2.5 w-full justify-center"
                        onPress={copyToClipboard}
                        disabled={!shareUrl}
                    >
                        <IconSymbol name="doc.on.doc" size={20} color="#fff" />
                        <Text className="text-white font-bold">Copy Share Link</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="p-2.5 mt-2.5" onPress={onClose}>
                        <Text className="text-[#666] font-semibold">Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

interface JoinRoomModalProps {
    modalRef: React.RefObject<AppModalRef | null>;
    onJoinSuccess: () => void;
}

export function JoinRoomModal({ modalRef, onJoinSuccess }: JoinRoomModalProps) {
    const [mode, setMode] = useState<"scan" | "paste">("scan");
    const [shareLink, setShareLink] = useState("");
    const [joining, setJoining] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);

    // Request camera permission when modal opens in scan mode
    React.useEffect(() => {
        if (mode === "scan") {
            requestCameraPermission();
        }
    }, [mode]);

    const requestCameraPermission = async () => {
        try {
            const { Camera } = await import("expo-camera");
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === "granted");

            if (status !== "granted") {
                Alert.alert(
                    "Camera Permission Required",
                    "Please enable camera access in your device settings to scan QR codes.",
                    [{ text: "OK" }],
                );
            }
        } catch (error) {
            console.error("Error requesting camera permission:", error);
            setHasPermission(false);
        }
    };

    const extractRoomIdFromUrl = (url: string): string | null => {
        // TODO
        return url;
    };

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);

        const roomId = extractRoomIdFromUrl(data);
        if (!roomId) {
            Alert.alert("Invalid QR Code", "This QR code does not contain a valid room share link.");
            setScanned(false);
            return;
        }

        await joinRoom(roomId);
    };

    const handlePasteJoin = async () => {
        if (!shareLink.trim()) {
            Alert.alert("Error", "Please paste a share link");
            return;
        }

        const roomId = extractRoomIdFromUrl(shareLink.trim());
        if (!roomId) {
            Alert.alert("Invalid Link", "Please paste a valid room share link.");
            return;
        }

        await joinRoom(roomId);
    };

    const joinRoom = async (roomId: string) => {
        setJoining(true);
        try {
            await api.post("/rooms/join", { roomId });
            Alert.alert("Success", "Successfully joined room!");
            modalRef.current?.close();
            setShareLink("");
            setScanned(false);
            onJoinSuccess();
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.error || "Failed to join room");
            setScanned(false);
        } finally {
            setJoining(false);
        }
    };

    const renderScanner = () => {
        if (hasPermission === null) {
            return <ActivityIndicator size="large" className="my-10" />;
        }

        if (hasPermission === false) {
            return (
                <View className="items-center py-10">
                    <ThemedText className="text-center text-gray-500 mb-4">
                        Camera permission is required to scan QR codes
                    </ThemedText>
                    <Button label="Request Permission" onclick={requestCameraPermission} />
                </View>
            );
        }

        const { CameraView } = require("expo-camera");
        return (
            <View className="w-full h-80 mb-4 overflow-hidden rounded-lg">
                <CameraView
                    style={{ flex: 1 }}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr"],
                    }}
                />
                {scanned && (
                    <View className="absolute inset-0 bg-black/50 items-center justify-center">
                        <ActivityIndicator size="large" color="#fff" />
                    </View>
                )}
            </View>
        );
    };

    return (
        <AppModal ref={modalRef} title="Join Room" hideButtons>
            <View className="flex-row mb-4 bg-gray-100 rounded-lg p-1">
                <TouchableOpacity
                    className={`flex-1 py-2 rounded-md ${mode === "scan" ? "bg-white" : ""}`}
                    onPress={() => setMode("scan")}
                >
                    <Text className={`text-center font-semibold ${mode === "scan" ? "text-blue-500" : "text-gray-500"}`}>
                        Scan QR
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`flex-1 py-2 rounded-md ${mode === "paste" ? "bg-white" : ""}`}
                    onPress={() => setMode("paste")}
                >
                    <Text className={`text-center font-semibold ${mode === "paste" ? "text-blue-500" : "text-gray-500"}`}>
                        Paste Link
                    </Text>
                </TouchableOpacity>
            </View>

            {mode === "scan" ? (
                renderScanner()
            ) : (
                <>
                    <ThemedTextInput
                        placeholder="Paste share link here"
                        value={shareLink}
                        onChangeText={setShareLink}
                        className="mb-4"
                        autoCapitalize="none"
                    />
                    <Button label={joining ? "Joining..." : "Join Room"} onclick={handlePasteJoin} disabled={joining} />
                </>
            )}
        </AppModal>
    );
}
