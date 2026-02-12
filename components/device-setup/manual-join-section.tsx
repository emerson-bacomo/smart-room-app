import { AppModal, AppModalRef } from "@/components/app-modal";
import { Button } from "@/components/button";
import { ThemedText } from "@/components/themed-text";
import { ThemedTextInput } from "@/components/themed-text-input";
import { ThemedView } from "@/components/themed-view";
import { useToast } from "@/context/toast-context";
import api from "@/utilities/api";
import { useQueryClient } from "@tanstack/react-query";
import React, { useRef, useState } from "react";

export function ManualJoinSection() {
    const queryClient = useQueryClient();
    const [manualDeviceId, setManualDeviceId] = useState("");
    const [manualPassword, setManualPassword] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [confirmRoomName, setConfirmRoomName] = useState("");
    const toast = useToast();
    const confirmModalRef = useRef<AppModalRef>(null);

    const handleManualJoin = async (joinRoom = false) => {
        if (!manualDeviceId || !manualPassword) {
            toast.info("Please enter both Device ID and Password.");
            return;
        }

        setIsJoining(true);
        try {
            const res = await api.post("/setup/claim", {
                dnsName: manualDeviceId.trim(),
                password: manualPassword,
                joinRoom: joinRoom,
            });

            if (res.data.requiresConfirmation) {
                // Device exists in a room, prompt user to join
                setConfirmRoomName(res.data.roomName);
                confirmModalRef.current?.open();
                return;
            }

            toast.success("Device joined successfully!");
            setManualDeviceId("");
            setManualPassword("");
            queryClient.invalidateQueries({ queryKey: ["devices"] });
        } catch (err: any) {
            console.error("Join failed:", err);
            const msg = err.response?.data?.error || "Failed to join device. Check credentials.";
            toast.error(msg);
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <ThemedView className="p-6 rounded-3xl mb-8" bordered>
            <ThemedText type="subtitle" className="mb-2">
                Join Existing Device
            </ThemedText>
            <ThemedText className="mb-4" style={{ opacity: 0.5 }}>
                Enter Device ID and Password to join a device already set up.
            </ThemedText>

            <ThemedText type="defaultSemiBold" className="mb-2">
                Device ID (DNS Name)
            </ThemedText>
            <ThemedTextInput
                placeholder="e.g. switch-toggler-abcdef"
                value={manualDeviceId}
                onChangeText={setManualDeviceId}
                className="mb-4"
                autoCapitalize="none"
            />

            <ThemedText type="defaultSemiBold" className="mb-2">
                Device Password
            </ThemedText>
            <ThemedTextInput
                placeholder="Enter Device Password"
                value={manualPassword}
                onChangeText={setManualPassword}
                secureTextEntry
                className="mb-4"
            />

            <Button label={isJoining ? "Joining..." : "Join Device"} onclick={() => handleManualJoin()} disabled={isJoining} />

            <AppModal
                ref={confirmModalRef}
                title="Shared Device Found"
                submitLabel="Confirm"
                onSubmitOverride={async () => {
                    confirmModalRef.current?.close();
                    handleManualJoin(true);
                }}
            >
                <ThemedText className="mb-4">
                    This device is in room <ThemedText type="defaultSemiBold">"{confirmRoomName}"</ThemedText>. You need to join
                    this room.
                </ThemedText>
            </AppModal>
        </ThemedView>
    );
}
