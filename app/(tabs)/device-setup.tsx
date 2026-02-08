import { ThemedSafeAreaView } from "@/components/themed-safe-area-view";
import { useAuth } from "@/hooks/use-auth";
import api from "@/utilities/api";
import { useFocusEffect } from "expo-router";
import React, { useState } from "react";
import { Alert, PermissionsAndroid, Platform, ScrollView } from "react-native";
import WifiManager from "react-native-wifi-reborn";

// Components
import { ConfigureDevicesView } from "@/components/device-setup/configure-devices-view";
import { ManualJoinSection } from "@/components/device-setup/manual-join-section";
import { ScanDevicesSection, WifiNetwork } from "@/components/device-setup/scan-devices-section";
import { SettedUpDevicesSection } from "@/components/device-setup/setted-up-devices-section";

const requestPermissions = async () => {
    if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
};

export default function DeviceSetupScreen() {
    const { user } = useAuth();
    const [devices, setDevices] = useState<WifiNetwork[]>([]);
    const [selectedDevices, setSelectedDevices] = useState<{ [key: string]: boolean }>({});
    const [isScanning, setIsScanning] = useState(false);
    const [setupMode, setSetupMode] = useState(false);
    const [targetSsid, setTargetSsid] = useState("POCO F7");
    const [password, setPassword] = useState("00000000");
    const [availableNetworks, setAvailableNetworks] = useState<WifiNetwork[]>([]);
    const [isScanningNetworks, setIsScanningNetworks] = useState(false);
    const [showNetworkList, setShowNetworkList] = useState(false);
    const [devicePasswords, setDevicePasswords] = useState<{ [key: string]: string }>({});
    const [isConnecting, setIsConnecting] = useState(false);
    const [setupStatus, setSetupStatus] = useState<{ [key: string]: "pending" | "connecting" | "success" | "error" }>({});
    const [settedUpDevices, setSettedUpDevices] = useState<any[]>([]);
    const [isLoadingSettedUp, setIsLoadingSettedUp] = useState(false);

    // Manual Join State
    const [manualDeviceId, setManualDeviceId] = useState("");
    const [manualPassword, setManualPassword] = useState("");
    const [isJoining, setIsJoining] = useState(false);

    const fetchSettedUpDevices = async () => {
        setIsLoadingSettedUp(true);
        try {
            const res = await api.get("/devices");
            setSettedUpDevices(res.data);
        } catch (err) {
            console.error("Failed to fetch setted up devices:", err);
        } finally {
            setIsLoadingSettedUp(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchSettedUpDevices();
        }, []),
    );

    const handleRename = (device: any) => {
        Alert.prompt(
            "Rename Device",
            `Enter new display name for ${device.name}`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Rename",
                    onPress: (newName?: string) => {
                        api.put(`/devices/${device.id}`, { name: newName }).then(() => fetchSettedUpDevices());
                    },
                },
            ],
            "plain-text",
            device.name || "",
        );
    };

    const handleAddToRoom = async (device: any) => {
        try {
            const roomsRes = await api.get("/rooms");
            const rooms = roomsRes.data;

            if (rooms.length === 0) {
                Alert.alert("No Rooms", "Please create a room first in the Home tab.");
                return;
            }

            Alert.alert("Assign to Room", "Choose a room", [
                ...rooms.map((r: any) => ({
                    text: r.name,
                    onPress: () => {
                        api.put(`/devices/${device.id}`, { roomId: r.id }).then(() => fetchSettedUpDevices());
                    },
                })),
                {
                    text: "Unassign",
                    style: "destructive",
                    onPress: () => {
                        api.put(`/devices/${device.id}`, { roomId: null }).then(() => fetchSettedUpDevices());
                    },
                },
                { text: "Cancel", style: "cancel" },
            ]);
        } catch (err) {
            console.error("Failed to load rooms:", err);
        }
    };

    const handleManualJoin = async (joinRoom = false) => {
        if (!manualDeviceId || !manualPassword) {
            Alert.alert("Missing Info", "Please enter both Device ID and Password.");
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
                Alert.alert(
                    "Shared Device Found",
                    `This device is in room "${res.data.roomName}". Do you want to join this room as well?`,
                    [
                        { text: "No, cancel", style: "cancel" },
                        {
                            text: "Yes, Join Room",
                            onPress: () => handleManualJoin(true),
                        },
                    ],
                );
                return;
            }

            Alert.alert("Success", "Device joined successfully!");
            setManualDeviceId("");
            setManualPassword("");
            fetchSettedUpDevices();
        } catch (err: any) {
            console.error("Join failed:", err);
            const msg = err.response?.data?.error || "Failed to join device. Check credentials.";
            Alert.alert("Join Failed", msg);
        } finally {
            setIsJoining(false);
        }
    };

    const handleScanDevices = async () => {
        setIsScanning(true);
        console.log("Starting device scan...");

        // Request location permission (required for WiFi scanning on Android)
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
            Alert.alert(
                "Permission Required",
                "Location permission is required to scan for WiFi networks on Android. Please grant the permission in your device settings.",
            );
            setIsScanning(false);
            return;
        }

        if (!WifiManager || !WifiManager.reScanAndLoadWifiList) {
            Alert.alert("Native module missing", "Wi-Fi scanning is only available in a native build, not in Expo Go.");
            setIsScanning(false);
            return;
        }

        try {
            console.log("Triggering Wi-Fi re-scan...");
            const wifiList = await WifiManager.reScanAndLoadWifiList();

            if (!wifiList || wifiList.length === 0) {
                console.warn("Wi-Fi list is empty. Ensure GPS/Location is ON.");
                Alert.alert("No networks found", "Ensure your GPS is enabled and try again.");
                setDevices([]);
                return;
            }

            const filtered = wifiList.filter((net) => net.SSID && net.SSID.startsWith("switch-toggler-"));
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
                Alert.alert(
                    "No devices found",
                    "Make sure your devices are in setup mode and nearby (names should start with 'switch-toggler-').",
                );
            }
        } catch (err) {
            console.error("Scan failed:", err);
            Alert.alert("Scan Error", "Failed to scan for Wi-Fi networks. " + (err instanceof Error ? err.message : ""));
        } finally {
            setIsScanning(false);
        }
    };

    const handleScanNetworks = async () => {
        setIsScanningNetworks(true);

        if (!WifiManager || !WifiManager.reScanAndLoadWifiList) {
            Alert.alert("Native module missing", "Wi-Fi scanning is only available in a native build.");
            setIsScanningNetworks(false);
            return;
        }

        const hasPermission = await requestPermissions();
        if (!hasPermission) {
            Alert.alert("Permission denied", "Cannot scan for networks without location permission.");
            setIsScanningNetworks(false);
            return;
        }

        try {
            const wifiList = await WifiManager.reScanAndLoadWifiList();
            const networks = wifiList.filter((n) => n.SSID && !n.SSID.startsWith("switch-toggler-"));
            setAvailableNetworks(networks);
            setShowNetworkList(true);

            if (networks.length === 0) {
                console.warn("No available Wi-Fi networks found besides setup devices.");
            }
        } catch (err) {
            console.error("Network scan failed:", err);
            Alert.alert("Scan Error", "Failed to scan for available Wi-Fi networks.");
        } finally {
            setIsScanningNetworks(false);
        }
    };

    const toggleSelection = (bssid: string) => {
        setSelectedDevices((prev) => ({
            ...prev,
            [bssid]: !prev[bssid],
        }));
    };

    const handleConnect = async () => {
        if (!targetSsid || !password) {
            Alert.alert("Missing information", "Please provide both SSID and password for the target Wi-Fi.");
            return;
        }

        const selectedList = devices.filter((d) => selectedDevices[d.BSSID]);
        if (selectedList.length === 0) {
            Alert.alert("No devices selected", "Please select at least one device to setup.");
            return;
        }

        setIsConnecting(true);
        const newStatus: { [key: string]: "pending" | "connecting" | "success" | "error" } = {};
        selectedList.forEach((d) => (newStatus[d.BSSID] = "pending"));
        setSetupStatus(newStatus);

        try {
            console.log(selectedList);
            for (const device of selectedList) {
                setSetupStatus((prev) => ({ ...prev, [device.BSSID]: "connecting" }));
                console.log(`Connecting to device hotspot: ${device.SSID}`);

                try {
                    const isProtected = device.capabilities?.includes("WPA") || device.capabilities?.includes("WEP");
                    const devicePwd = devicePasswords[device.BSSID] || "";

                    if (isProtected && !devicePwd) {
                        throw new Error(`Password required for ${device.SSID}`);
                    }

                    // 1. Connect to device hotspot
                    await WifiManager.connectToProtectedSSID(device.SSID, devicePwd, false, false);
                    console.log(`Connected to ${device.SSID}. Sending Wi-Fi credentials...`);

                    // Wait for IP
                    await new Promise((resolve) => setTimeout(resolve, 3000));

                    // 2. Send request to wifisave
                    // Pass userid so the device can claim itself
                    const response = await fetch(
                        `http://${device.SSID}.local/wifisave?s=${encodeURIComponent(targetSsid)}&p=${encodeURIComponent(password)}&userid=${encodeURIComponent(user?.id || "")}`,
                        { method: "GET" },
                    );

                    if (!response.ok) {
                        throw new Error(`Failed to save Wi-Fi on ${device.SSID}`);
                    }

                    setSetupStatus((prev) => ({ ...prev, [device.BSSID]: "success" }));
                } catch (err) {
                    console.error(`Error provisioning ${device.SSID}:`, err);
                    setSetupStatus((prev) => ({ ...prev, [device.BSSID]: "error" }));
                    return;
                }
            }

            Alert.alert("Setup Process Finished", "Devices are connecting to the internet and will appear in your list shortly.");
            // We can't immediately fetch setted up devices because we might still be on the hotspot network or just switching back.
            // But we can try after a delay or just let the user refresh.
            setTimeout(() => fetchSettedUpDevices(), 5000);
        } catch (err) {
            console.error("Setup process failed:", err);
            Alert.alert("Setup Error", "An unexpected error occurred.");
        } finally {
            setIsConnecting(false);
        }
    };

    if (setupMode) {
        return (
            <ConfigureDevicesView
                devices={devices}
                selectedDevices={selectedDevices}
                targetSsid={targetSsid}
                setTargetSsid={setTargetSsid}
                password={password}
                setPassword={setPassword}
                availableNetworks={availableNetworks}
                isScanningNetworks={isScanningNetworks}
                showNetworkList={showNetworkList}
                setShowNetworkList={setShowNetworkList}
                devicePasswords={devicePasswords}
                setDevicePasswords={setDevicePasswords}
                isConnecting={isConnecting}
                setupStatus={setupStatus}
                onBack={() => setSetupMode(false)}
                onScanNetworks={handleScanNetworks}
                onConnect={handleConnect}
            />
        );
    }

    return (
        <ThemedSafeAreaView className="flex-1 px-6 pt-4">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                <ManualJoinSection
                    manualDeviceId={manualDeviceId}
                    setManualDeviceId={setManualDeviceId}
                    manualPassword={manualPassword}
                    setManualPassword={setManualPassword}
                    isJoining={isJoining}
                    onJoin={handleManualJoin}
                />

                <ScanDevicesSection
                    devices={devices}
                    selectedDevices={selectedDevices}
                    isScanning={isScanning}
                    onScan={handleScanDevices}
                    onToggleSelection={toggleSelection}
                    onSetup={() => setSetupMode(true)}
                />

                <SettedUpDevicesSection
                    devices={settedUpDevices}
                    isLoading={isLoadingSettedUp}
                    onRefresh={fetchSettedUpDevices}
                    onAction={(item) => {
                        Alert.alert("Device Settings", "Select an action", [
                            { text: "Rename", onPress: () => handleRename(item) },
                            {
                                text: item.roomId ? "Move Room" : "Add to Room",
                                onPress: () => handleAddToRoom(item),
                            },
                            { text: "Cancel", style: "cancel" },
                        ]);
                    }}
                />
            </ScrollView>
        </ThemedSafeAreaView>
    );
}
