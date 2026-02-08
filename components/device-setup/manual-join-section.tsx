import { Button } from "@/components/button";
import { ThemedText } from "@/components/themed-text";
import { ThemedTextInput } from "@/components/themed-text-input";
import { ThemedView } from "@/components/themed-view";
import React from "react";

interface ManualJoinSectionProps {
    manualDeviceId: string;
    setManualDeviceId: (val: string) => void;
    manualPassword: string;
    setManualPassword: (val: string) => void;
    isJoining: boolean;
    onJoin: () => void;
}

export function ManualJoinSection({
    manualDeviceId,
    setManualDeviceId,
    manualPassword,
    setManualPassword,
    isJoining,
    onJoin,
}: ManualJoinSectionProps) {
    return (
        <ThemedView className="p-6 rounded-3xl bg-white/10 border border-white/20 mb-8">
            <ThemedText type="subtitle" className="mb-2">
                Join Existing Device
            </ThemedText>
            <ThemedText className="text-gray-400 mb-4">Enter Device ID and Password to join a device already set up.</ThemedText>

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

            <Button label={isJoining ? "Joining..." : "Join Device"} onclick={onJoin} disabled={isJoining} />
        </ThemedView>
    );
}
