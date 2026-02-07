import { Button } from "@/components/button";
import { ThemedSafeAreaView } from "@/components/themed-safe-area-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedTextInput } from "@/components/themed-text-input";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import api from "@/utilities/api";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "expo-router";
import React, { useState } from "react";
import { Alert, PermissionsAndroid, Platform, Pressable, ScrollView, View } from "react-native";
import WifiManager from "react-native-wifi-reborn";

interface WifiNetwork {
    SSID: string;
    BSSID: string;
    level: number;
    capabilities?: string;
}

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
                        api.put(`/devices/${device.id}`, { displayName: newName }).then(() => fetchSettedUpDevices());
                    },
                },
            ],
            "plain-text",
            device.displayName || "",
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

    const handleSetup = () => {
        const selectedCount = Object.values(selectedDevices).filter(Boolean).length;
        if (selectedCount === 0) {
            Alert.alert("No devices selected", "Please select at least one device to setup.");
            return;
        }
        setSetupMode(true);
    };

    console.log(user);

    const handleConnect = async () => {
        if (!targetSsid || !password) {
            Alert.alert("Missing information", "Please provide both SSID and password for the target Wi-Fi.");
            return;
        }

        const selectedList = devices.filter((d) => selectedDevices[d.BSSID]);
        if (selectedList.length === 0) {
            Alert.alert("No devices", "No devices selected for setup.");
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
            <ThemedSafeAreaView className="flex-1 px-6 pt-4">
                <View className="flex-row items-center mb-6">
                    <Pressable onPress={() => setSetupMode(false)} className="mr-4">
                        <IconSymbol library={MaterialIcons} name="chevron-left" size={24} color="#6366f1" />
                    </Pressable>
                    <ThemedText type="subtitle">Configure Devices</ThemedText>
                </View>

                <ThemedView className="p-6 rounded-3xl bg-white/10 border border-white/20 mb-6">
                    <ThemedText type="subtitle" className="mb-4">
                        Target Wi-Fi
                    </ThemedText>
                    <ThemedText className="mb-4 text-gray-400">
                        Credentials the devices will use to connect to internet.
                    </ThemedText>

                    <ThemedText type="defaultSemiBold" className="mb-2">
                        SSID
                    </ThemedText>
                    <View className="flex-row items-center mb-2">
                        <ThemedTextInput
                            className="flex-1 mb-0"
                            placeholder="Enter SSID"
                            value={targetSsid}
                            onChangeText={setTargetSsid}
                        />
                        <Button className="ml-2 px-3 h-12" onclick={handleScanNetworks}>
                            {isScanningNetworks ? (
                                <IconSymbol library={MaterialIcons} name="refresh" size={20} color="#6366f1" />
                            ) : (
                                <IconSymbol library={MaterialIcons} name="wifi" size={20} />
                            )}
                        </Button>
                    </View>

                    {showNetworkList && (
                        <ThemedView className="mb-4 max-h-48 border border-white/10 rounded-xl overflow-hidden">
                            <ScrollView>
                                {availableNetworks.map((net) => (
                                    <Pressable
                                        key={net.BSSID}
                                        onPress={() => {
                                            setTargetSsid(net.SSID);
                                            setShowNetworkList(false);
                                        }}
                                        className="p-3 border-b border-white/5 flex-row justify-between items-center"
                                    >
                                        <ThemedText>{net.SSID}</ThemedText>
                                        <IconSymbol library={MaterialIcons} name="wifi" size={16} color="#4ade80" />
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </ThemedView>
                    )}

                    <ThemedText type="defaultSemiBold" className="mb-2">
                        Password
                    </ThemedText>
                    <ThemedTextInput
                        className="mb-6"
                        placeholder="Enter Password"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <View className="h-[1px] bg-white/10 mb-6" />

                    <ThemedText type="subtitle" className="mb-4">
                        Device Hotspots
                    </ThemedText>
                    <ThemedText className="mb-4 text-gray-400">Enter passwords for the device hotspots.</ThemedText>

                    {devices
                        .filter((d) => selectedDevices[d.BSSID])
                        .map((device) => {
                            const isProtected = device.capabilities?.includes("WPA") || device.capabilities?.includes("WEP");
                            return (
                                <View key={device.BSSID} className="mb-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <View className="flex-row justify-between items-center mb-2">
                                        <ThemedText type="defaultSemiBold">{device.SSID}</ThemedText>
                                        {setupStatus[device.BSSID] === "success" && (
                                            <IconSymbol library={MaterialIcons} name="check-circle" size={20} color="#4ade80" />
                                        )}
                                        {setupStatus[device.BSSID] === "error" && (
                                            <IconSymbol library={MaterialIcons} name="warning" size={20} color="#ef4444" />
                                        )}
                                        {setupStatus[device.BSSID] === "connecting" && (
                                            <IconSymbol library={MaterialIcons} name="sync" size={20} color="#6366f1" />
                                        )}
                                    </View>
                                    {isProtected ? (
                                        <ThemedTextInput
                                            placeholder="Hotspot Password"
                                            secureTextEntry
                                            value={devicePasswords[device.BSSID] || ""}
                                            onChangeText={(val) =>
                                                setDevicePasswords((prev) => ({ ...prev, [device.BSSID]: val }))
                                            }
                                            className="mb-0"
                                        />
                                    ) : (
                                        <ThemedText className="text-xs text-gray-500 italic">
                                            Open Network (No password required)
                                        </ThemedText>
                                    )}
                                </View>
                            );
                        })}

                    <Button
                        variant="cta"
                        label={
                            isConnecting
                                ? "Connecting..."
                                : `Start Setup (${Object.values(selectedDevices).filter(Boolean).length})`
                        }
                        onclick={handleConnect}
                        disabled={isConnecting}
                    />
                </ThemedView>
            </ThemedSafeAreaView>
        );
    }

    return (
        <ThemedSafeAreaView className="flex-1 px-6 pt-4">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Manual Join Section */}
                <ThemedView className="p-6 rounded-3xl bg-white/10 border border-white/20 mb-8">
                    <ThemedText type="subtitle" className="mb-2">
                        Join Existing Device
                    </ThemedText>
                    <ThemedText className="text-gray-400 mb-4">
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

                    <Button
                        label={isJoining ? "Joining..." : "Join Device"}
                        onclick={() => handleManualJoin()}
                        disabled={isJoining}
                    />
                </ThemedView>

                <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-1">
                        <ThemedText type="subtitle">Setup New Devices</ThemedText>
                        <ThemedText className="text-gray-400 mt-1">Available Switch Toggler devices nearby</ThemedText>
                    </View>
                    <View className="flex-row items-center gap-3">
                        <Pressable
                            onPress={handleScanDevices}
                            disabled={isScanning}
                            className="bg-white/10 p-2 rounded-full border border-white/10"
                        >
                            <IconSymbol library={MaterialIcons} name="refresh" size={18} color="#6366f1" />
                        </Pressable>
                        {Object.values(selectedDevices).some(Boolean) && (
                            <Pressable onPress={handleSetup} className="bg-indigo-500 px-4 py-2 rounded-xl">
                                <ThemedText className="text-white font-bold text-xs">SETUP</ThemedText>
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* Scan Devices List */}
                <View className="mb-8">
                    {devices.length === 0 ? (
                        <ThemedView className="items-center justify-center p-10 rounded-3xl bg-white/5 border border-white/10 border-dashed">
                            <IconSymbol library={MaterialIcons} name="bluetooth" size={48} color="#4b5563" />
                            <ThemedText className="mt-4 text-center text-gray-500">
                                {isScanning
                                    ? "Looking for devices..."
                                    : "No devices found yet.\nTap scan to look for Switch Togglers."}
                            </ThemedText>
                        </ThemedView>
                    ) : (
                        devices.map((item) => (
                            <Pressable
                                key={item.BSSID}
                                onPress={() => toggleSelection(item.BSSID)}
                                className={`flex-row items-center p-5 mb-3 rounded-2xl border ${
                                    selectedDevices[item.BSSID]
                                        ? "bg-indigo-500/10 border-indigo-500"
                                        : "bg-white/5 border-white/10"
                                }`}
                            >
                                <View
                                    className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-4 ${
                                        selectedDevices[item.BSSID] ? "bg-indigo-500 border-indigo-500" : "border-gray-500"
                                    }`}
                                >
                                    {selectedDevices[item.BSSID] && (
                                        <IconSymbol library={MaterialIcons} name="checkmark" size={16} color="white" />
                                    )}
                                </View>
                                <View className="flex-1">
                                    <ThemedText type="defaultSemiBold">{item.SSID}</ThemedText>
                                    <ThemedText className="text-xs text-gray-500">{item.BSSID}</ThemedText>
                                </View>
                                <IconSymbol
                                    library={MaterialIcons}
                                    name="wifi"
                                    size={20}
                                    color={item.level > -60 ? "#4ade80" : "#facc15"}
                                />
                            </Pressable>
                        ))
                    )}
                </View>

                <View className="flex-row items-center justify-between mb-4 mt-8">
                    <View className="flex-1">
                        <ThemedText type="subtitle">Setted Up Devices</ThemedText>
                        <ThemedText className="text-gray-400 mt-1">Devices already managed by you</ThemedText>
                    </View>
                    <Pressable
                        onPress={fetchSettedUpDevices}
                        disabled={isLoadingSettedUp}
                        className="bg-white/10 p-2 rounded-full border border-white/10"
                    >
                        <IconSymbol library={MaterialIcons} name="refresh" size={18} color="#6366f1" />
                    </Pressable>
                </View>

                {/* Setted Up Devices List */}
                <View>
                    {settedUpDevices.length === 0
                        ? !isLoadingSettedUp && (
                              <ThemedView className="p-8 items-center border border-white/5 rounded-2xl">
                                  <ThemedText className="text-gray-500 italic">No devices setted up yet.</ThemedText>
                              </ThemedView>
                          )
                        : settedUpDevices.map((item) => (
                              <View
                                  key={item.id}
                                  className="flex-row items-center p-5 mb-3 rounded-2xl bg-white/5 border border-white/10"
                              >
                                  <View className="w-10 h-10 rounded-full bg-indigo-500/20 items-center justify-center mr-4">
                                      <IconSymbol library={Feather} name="cpu" size={20} color="#6366f1" />
                                  </View>
                                  <View className="flex-1">
                                      <ThemedText type="defaultSemiBold">{item.displayName || item.name}</ThemedText>
                                      <ThemedText className="text-xs text-gray-500">
                                          {item.room ? `Room: ${item.room.name}` : "Not Assigned"}
                                      </ThemedText>
                                  </View>
                                  <Pressable
                                      onPress={() => {
                                          Alert.alert("Device Settings", "Select an action", [
                                              { text: "Rename", onPress: () => handleRename(item) },
                                              {
                                                  text: item.roomId ? "Move Room" : "Add to Room",
                                                  onPress: () => handleAddToRoom(item),
                                              },
                                              { text: "Cancel", style: "cancel" },
                                          ]);
                                      }}
                                      className="p-2"
                                  >
                                      <IconSymbol library={Ionicons} name="ellipsis-vertical" size={20} color="#4b5563" />
                                  </Pressable>
                              </View>
                          ))}
                </View>
            </ScrollView>
        </ThemedSafeAreaView>
    );
}
