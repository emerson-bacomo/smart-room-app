import { ConfigureDevicesView } from "@/components/device-setup/configure-devices-view";
import { ThemedView } from "@/components/themed-view";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";

export default function ConfigureScreen() {
    const { devices: devicesRaw, selectedDevices: selectedDevicesRaw } = useLocalSearchParams<{
        devices?: string;
        selectedDevices?: string;
    }>();
    const router = useRouter();

    const devices = useMemo(() => {
        try {
            return devicesRaw ? JSON.parse(devicesRaw) : [];
        } catch (e) {
            console.error("Failed to parse devices", e);
            return [];
        }
    }, [devicesRaw]);

    const selectedDevices = useMemo(() => {
        try {
            return selectedDevicesRaw ? JSON.parse(selectedDevicesRaw) : {};
        } catch (e) {
            console.error("Failed to parse selectedDevices", e);
            return {};
        }
    }, [selectedDevicesRaw]);

    return (
        <ThemedView className="flex-1">
            <ConfigureDevicesView
                devices={devices}
                selectedDevices={selectedDevices}
                onBack={() => router.back()}
                isScreen={true}
            />
        </ThemedView>
    );
}
