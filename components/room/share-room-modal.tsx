import { AppModal, AppModalRef } from "@/components/app-modal";
import { Button } from "@/components/button";
import { ThemedText } from "@/components/themed-text";
import { ThemedTextInput } from "@/components/themed-text-input";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { RelativeTimer } from "@/components/ui/relative-timer";
import { useToast } from "@/context/toast-context";
import api from "@/utilities/api";
import { useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { MiddleEllipsisText } from "../middle-ellipsis-text";

interface ShareRoomModalProps {
    visible: boolean;
    onClose: () => void;
    roomId: string;
}

export function ShareRoomModal({ visible, onClose, roomId }: ShareRoomModalProps) {
    const {
        data: shareData,
        isLoading: loading,
        error,
    } = useQuery({
        queryKey: ["roomShare", roomId],
        queryFn: async ({ signal }) => {
            const res = await api.get(`/rooms/share/${roomId}`, { signal });
            return res.data;
        },
        enabled: visible && !!roomId,
    });

    const shareUrl = shareData?.shareUrl || "";
    const expiresAt = shareData?.expiresAt;

    const toast = useToast();

    const copyToClipboard = async () => {
        if (!shareUrl) return;
        await Clipboard.setStringAsync(shareUrl);
        toast.success("Link copied to clipboard");
    };

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <View className="flex-1 justify-center items-center bg-black/50">
                <ThemedView className="w-[85%] rounded-[20px] p-[30px] items-center shadow-lg" bordered opposite>
                    <ThemedText type="subtitle" className="mb-2">
                        Share Room
                    </ThemedText>
                    <ThemedView className="flex-row items-center gap-1 mb-5 bg-transparent">
                        <ThemedText className="text-orange-500 text-sm font-semibold">Link expires</ThemedText>
                        <RelativeTimer timestamp={expiresAt} className="text-orange-500 text-sm font-semibold" />
                    </ThemedView>

                    <ThemedView className="mb-5 p-2.5 bg-white rounded-lg">
                        {loading ? <ActivityIndicator /> : shareUrl ? <QRCode value={shareUrl} size={200} /> : null}
                    </ThemedView>

                    <MiddleEllipsisText textClassName="text-xs mb-5" style={{ opacity: 0.6 }} text={shareUrl} />

                    <Button
                        className="w-full"
                        onclick={copyToClipboard}
                        disabled={!shareUrl}
                        label="Copy Share Link"
                        icon={<IconSymbol name="doc.on.doc" size={20} color="#fff" />}
                    />

                    <TouchableOpacity className="p-2.5 mt-2.5" onPress={onClose}>
                        <ThemedText className="font-semibold" style={{ opacity: 0.6 }}>
                            Close
                        </ThemedText>
                    </TouchableOpacity>
                </ThemedView>
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
    const toast = useToast();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [qrData, setQrData] = useState("");

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
                toast.info("Please enable camera access in your device settings to scan QR codes.");
            }
        } catch (error) {
            console.error("Error requesting camera permission:", error);
            setHasPermission(false);
        }
    };

    const extractCodeFromUrl = (url: string): string | null => {
        try {
            // Internal URL format: smartroomapp://join/room?code=CODE
            if (url.startsWith("smartroomapp://")) {
                const queryStr = url.split("?")[1];
                if (!queryStr) return null;
                const params = new URLSearchParams(queryStr);
                return params.get("code");
            }
            // If it's just the code itself
            if (/^[0-9A-Z]{8}$/.test(url)) {
                return url;
            }
            return null;
        } catch (e) {
            return null;
        }
    };

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);
        setQrData(data);

        const code = extractCodeFromUrl(data);
        if (!code) {
            toast.error("Invalid QR code format");
            setScanned(false);
            return;
        }

        await joinRoom(code);
    };

    const handlePasteJoin = async () => {
        if (!shareLink.trim()) {
            toast.info("Please paste a share link or code");
            return;
        }

        const code = extractCodeFromUrl(shareLink.trim());
        if (!code) {
            toast.error("Invalid room share link or code");
            return;
        }

        await joinRoom(code);
    };

    const joinRoom = async (code: string) => {
        setJoining(true);
        try {
            await api.post("/rooms/join", { code });
            toast.success("Successfully joined room!");
            modalRef.current?.close();
            setShareLink("");
            setScanned(false);
            onJoinSuccess();
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.error || "Failed to join room";

            if (status === 410) {
                toast.error("This invite link has expired. Please ask for a new one.");
            } else if (status === 404) {
                toast.error("This invite code is invalid or no longer exists.");
            } else {
                toast.error(message);
            }
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
                {qrData && <MiddleEllipsisText text={qrData} />}

                {scanned && (
                    <View className="absolute inset-0 bg-black/50 items-center justify-center">
                        <ActivityIndicator size="large" color="#fff" />
                    </View>
                )}
            </View>
        );
    };

    return (
        <AppModal ref={modalRef} title="Join Room" footerType="CLOSE">
            <ThemedView className="flex-row mb-4 rounded-lg p-1" style={{ backgroundColor: "#f3f4f6" }}>
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
            </ThemedView>

            {mode === "scan" ? (
                renderScanner()
            ) : (
                <>
                    <ThemedTextInput
                        placeholder="Paste share link or 8-char code here"
                        value={shareLink}
                        onChangeText={setShareLink}
                        className="mb-4"
                        autoCapitalize="characters"
                    />
                    <Button label={joining ? "Joining..." : "Join Room"} onclick={handlePasteJoin} disabled={joining} />
                </>
            )}
        </AppModal>
    );
}
