import { ThemedSafeAreaView } from "@/components/themed-safe-area-view";
import { toast } from "sonner-native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView } from "react-native";
import WifiManager from "react-native-wifi-reborn";

// Components
import { requestPermissions } from "@/components/device-setup/configure-devices-view";
import { ManualJoinSection } from "@/components/device-setup/manual-join-section";
import { ScanDevicesSection, WifiNetwork } from "@/components/device-setup/scan-devices-section";
import { SettedUpDevicesSection } from "@/components/device-setup/setted-up-devices-section";

export default function DeviceSetupScreen() {
    const [devices, setDevices] = useState<WifiNetwork[]>([]);
    const [selectedDevices, setSelectedDevices] = useState<{ [key: string]: boolean }>({});
    const [isScanning, setIsScanning] = useState(false);
    const router = useRouter();

    useEffect(() => {
        handleScanDevices();
    }, []);

    const handleScanDevices = useCallback(async () => {
        setIsScanning(true);
        console.log("Starting device scan...");

        // Request location permission (required for WiFi scanning on Android)
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
            toast.error("Location permission is required to scan for WiFi networks.");
            setIsScanning(false);
            return;
        }

        if (!WifiManager || !WifiManager.reScanAndLoadWifiList) {
            toast.info("Wi-Fi scanning is only available in a native build");
            setIsScanning(false);
            return;
        }

        try {
            console.log("Triggering Wi-Fi re-scan...");
            const wifiList = await WifiManager.reScanAndLoadWifiList();

            if (!wifiList || wifiList.length === 0) {
                console.warn("Wi-Fi list is empty. Ensure GPS/Location is ON.");
                toast.info("No networks found. Ensure GPS is enabled.");
                setDevices([]);
                return;
            }

            const filtered = wifiList.filter((net) => net.SSID && net.SSID.startsWith("smart-room-device-"));
            console.log("Filtered devices:", filtered);
            setDevices(
                filtered.map((n) => ({
                    SSID: n.SSID,
                    BSSID: n.BSSID,
                    level: n.level,
                    capabilities: n.capabilities || "",
                })),
            );

            if (filtered.length === 0) {
                toast.info("No setup devices found nearby.");
            }
        } catch (err) {
            console.error("Scan failed:", err);
            toast.error("Failed to scan for Wi-Fi networks");
        } finally {
            setIsScanning(false);
        }
    }, [toast]);

    const toggleSelection = (bssid: string) => {
        setSelectedDevices((prev) => ({
            ...prev,
            [bssid]: !prev[bssid],
        }));
    };

    const handleSetup = () => {
        const hasSelection = Object.values(selectedDevices).some((v) => v);
        if (!hasSelection) {
            toast.info("Please select at least one device to setup");
            return;
        }

        router.push({
            pathname: "/device-setup/configure",
            params: {
                devices: JSON.stringify(devices),
                selectedDevices: JSON.stringify(selectedDevices),
            },
        });
    };

    return (
        <ThemedSafeAreaView className="flex-1">
            <ScrollView showsVerticalScrollIndicator={false} className="px-6" contentContainerStyle={{ paddingBottom: 120 }}>
                <ManualJoinSection />

                <ScanDevicesSection
                    devices={devices}
                    selectedDevices={selectedDevices}
                    isScanning={isScanning}
                    onScan={handleScanDevices}
                    onToggleSelection={toggleSelection}
                    onSetup={handleSetup}
                />

                <SettedUpDevicesSection />
            </ScrollView>
        </ThemedSafeAreaView>
    );
}
