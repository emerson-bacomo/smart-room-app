import { AppModal, AppModalRef } from "@/components/app-modal";
import { Button } from "@/components/button";
import { ThemedPicker } from "@/components/themed-picker";
import { ThemedText } from "@/components/themed-text";
import { ThemedTextInput } from "@/components/themed-text-input";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { RelativeTimer } from "@/components/ui/relative-timer";
import { SwitchWithLoading } from "@/components/ui/switch-with-loading";
import { useMqtt } from "@/context/mqtt-context";
import { useTheme } from "@/context/theme-context";
import api from "@/utilities/api";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    GestureResponderEvent,
    KeyboardAvoidingView,
    PanResponder,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { toast } from "sonner-native";
import { twMerge } from "tailwind-merge";
import { RelayConfiguration, SmartRoomDevice } from "./device-list";

interface DeviceControlProps {
    selectedDevice: SmartRoomDevice | null;
    mergedDeviceData: Record<string, any>;
    onBack: () => void;
    buzzerThreshold: string;
    setBuzzerThreshold: (val: string) => void;
    onUpdateThreshold: () => void;
}

export function DeviceControl({
    selectedDevice,
    mergedDeviceData,
    onBack,
    buzzerThreshold,
    setBuzzerThreshold,
    onUpdateThreshold,
}: DeviceControlProps) {
    const { id: roomId } = useLocalSearchParams();
    const queryClient = useQueryClient();
    const { darkThemed } = useTheme();

    const deviceData = selectedDevice ? mergedDeviceData[selectedDevice.id] || selectedDevice : null;
    const isBuzzerOn = deviceData?.buzzer === 1;
    const isNoiseDetectionOn = deviceData?.noiseDetection === 1;
    const relayState = deviceData?.relayState || "off";
    const isRelayOn = relayState === "on";
    const autoMode = deviceData?.autoMode || false;
    const activeConfigId = deviceData?.activeConfigId || null;
    const configurations: RelayConfiguration[] = deviceData?.configurations || [];

    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
    const [formState, setFormState] = useState({
        name: "",
        sensor: "temperature",
        condition: ">=",
        threshold: "0", // generic value used for most sensors
        targetState: "on",
        days: "",
        time: "",
        thresholdMinutes: "0", // for timer
        thresholdSeconds: "0",
    });
    const [configToDelete, setConfigToDelete] = useState<string | null>(null);

    const renameModalRef = useRef<AppModalRef>(null);
    const deleteConfigModalRef = useRef<AppModalRef>(null);
    const removeFromRoomModalRef = useRef<AppModalRef>(null);

    const [isRelayLoading, setIsRelayLoading] = useState(false);
    const [isBuzzerLoading, setIsBuzzerLoading] = useState(false);
    const [isNoiseDetectionLoading, setIsNoiseDetectionLoading] = useState(false);
    const [isConfigLoading, setIsConfigLoading] = useState(false);
    const [isAutoLoading, setIsAutoLoading] = useState(false);
    const [targetConfigId, setTargetConfigId] = useState<string | null>(null);
    const [targetRelayState, setTargetRelayState] = useState<string | null>(null);
    const [targetBuzzerState, setTargetBuzzerState] = useState<number | null>(null);
    const [targetNoiseDetectionState, setTargetNoiseDetectionState] = useState<number | null>(null);
    const [targetAutoState, setTargetAutoState] = useState<boolean | null>(null);
    const [isBuzzerModeLoading, setIsBuzzerModeLoading] = useState(false);
    const [targetBuzzerMode, setTargetBuzzerMode] = useState<number | null>(null);
    const [buzzerVolume, setBuzzerVolume] = useState<number>(deviceData?.buzzerVolume || 255);
    const [isBuzzerVolumeLoading, setIsBuzzerVolumeLoading] = useState(false);
    const [targetBuzzerVolume, setTargetBuzzerVolume] = useState<number | null>(null);
    // refetch room whenever the configuration list on the device updates via MQTT
    React.useEffect(() => {
        // configurations array comes from deviceData; if it changes, refresh backend data
        queryClient.invalidateQueries({ queryKey: ["room", roomId] });
    }, [deviceData.configurations, queryClient, roomId]);

    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const dayModalRef = useRef<AppModalRef>(null);
    const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const daysToString = (days: string[]) => days.join(",");
    const stringToDays = (value: string) => (value ? value.split(",").map((d) => d.trim()) : []);
    const [showTime, setShowTime] = useState(false);
    const time = formState.time ? new Date(formState.time) : new Date();

    const { sendCommand } = useMqtt();

    React.useEffect(() => {
        if (targetRelayState !== null && deviceData?.relayState === targetRelayState) {
            setIsRelayLoading(false);
            setTargetRelayState(null);
        }
    }, [deviceData?.relayState, targetRelayState]);

    React.useEffect(() => {
        const currentBuzzer = deviceData?.buzzer === 1 ? 1 : 0;
        if (targetBuzzerState !== null && currentBuzzer === targetBuzzerState) {
            setIsBuzzerLoading(false);
            setTargetBuzzerState(null);
        }
    }, [deviceData?.buzzer, targetBuzzerState]);

    React.useEffect(() => {
        const currentNoiseDetection = deviceData?.noiseDetection === 1 ? 1 : 0;
        if (targetNoiseDetectionState !== null && currentNoiseDetection === targetNoiseDetectionState) {
            setIsNoiseDetectionLoading(false);
            setTargetNoiseDetectionState(null);
        }
    }, [deviceData?.noiseDetection, targetNoiseDetectionState]);

    React.useEffect(() => {
        if (targetAutoState !== null && deviceData?.autoMode === targetAutoState) {
            setIsAutoLoading(false);
            setTargetAutoState(null);
        }
    }, [deviceData?.autoMode, targetAutoState]);

    React.useEffect(() => {
        if (targetConfigId !== null && deviceData?.activeConfigId === targetConfigId) {
            setIsConfigLoading(false);
            setTargetConfigId(null);
        }
    }, [deviceData?.activeConfigId, targetConfigId]);

    React.useEffect(() => {
        const currentBuzzerMode = deviceData?.buzzerBlinkMode === 1 ? 1 : 0;
        if (targetBuzzerMode !== null && currentBuzzerMode === targetBuzzerMode) {
            setIsBuzzerModeLoading(false);
            setTargetBuzzerMode(null);
        }
    }, [deviceData?.buzzerBlinkMode, targetBuzzerMode]);

    React.useEffect(() => {
        if (
            deviceData?.buzzerVolume !== undefined &&
            targetBuzzerVolume !== null &&
            Math.abs(deviceData.buzzerVolume - targetBuzzerVolume) < 2
        ) {
            setIsBuzzerVolumeLoading(false);
            setTargetBuzzerVolume(null);
            setBuzzerVolume(deviceData.buzzerVolume);
        } else if (deviceData?.buzzerVolume !== undefined && targetBuzzerVolume === null) {
            setBuzzerVolume(deviceData.buzzerVolume);
        }
    }, [deviceData?.buzzerVolume, targetBuzzerVolume]);

    const handleRenameSubmit = async (newName: string) => {
        if (!selectedDevice || !newName.trim()) return;
        try {
            await api.put(`/devices/${selectedDevice.id}`, { name: newName.trim() });
            queryClient.invalidateQueries({ queryKey: ["room", roomId] });
            // API calls and toast success/error handling are typically done here
            // but we'll assume the component manages its own success state or uses a toast context
        } catch (error) {
            console.error("Failed to rename device", error);
        }
    };

    const handleRemoveFromRoom = async () => {
        if (!selectedDevice) return;
        try {
            await api.put(`/devices/${selectedDevice.id}`, { roomId: null });
            queryClient.invalidateQueries({ queryKey: ["room", roomId] });
            onBack(); // Go back to the list
        } catch (error) {
            console.error("Failed to remove device from room", error);
            toast.error("Failed to remove device");
        }
    };

    const handleSaveConfig = async () => {
        if (!selectedDevice) return;

        if (!formState.name.trim()) {
            toast.error("Configuration name is required.");
            return;
        }

        if (formState.sensor === "timer") {
            // ensure at least one of minutes/seconds is non-zero
            const mins = parseInt(formState.thresholdMinutes || "0", 10);
            const secs = parseInt(formState.thresholdSeconds || "0", 10);
            if (mins === 0 && secs === 0) {
                toast.error("Timer duration must be at least one second.");
                return;
            }
        } else {
            if (formState.threshold.trim() === "") {
                toast.error("Threshold value is required.");
                return;
            }
        }

        try {
            let thresholdValue: number | string = formState.threshold;
            if (formState.sensor === "timer") {
                const mins = parseInt(formState.thresholdMinutes || "0", 10);
                const secs = parseInt(formState.thresholdSeconds || "0", 10);
                thresholdValue = mins * 60 + secs; // store total seconds
            } else {
                thresholdValue = parseFloat(formState.threshold || "0");
            }

            const payload: any = {
                ...formState,
                threshold: thresholdValue,
                days: formState.sensor === "datetime" ? formState.days : null,
                time: formState.sensor === "datetime" ? formState.time : null,
            };

            if (editingConfigId) {
                await api.put(`/devices/${selectedDevice.id}/configurations/${editingConfigId}`, payload);
            } else {
                await api.post(`/devices/${selectedDevice.id}/configurations`, payload);
            }
            queryClient.invalidateQueries({ queryKey: ["room", roomId] });
            setIsFormVisible(false);
            setSelectedDays([]);
            dayModalRef.current?.close();
            setEditingConfigId(null);
            setFormState({
                name: "",
                sensor: "temperature",
                condition: ">=",
                threshold: "0",
                targetState: "on",
                days: "",
                time: "",
                thresholdMinutes: "0",
                thresholdSeconds: "0",
            });
        } catch (error) {
            console.error("Failed to save config", error);
        }
    };

    const handleDeleteConfig = async (configId: string) => {
        if (!selectedDevice) return;
        try {
            await api.delete(`/devices/${selectedDevice.id}/configurations/${configId}`);
            queryClient.invalidateQueries({ queryKey: ["room", roomId] });
        } catch (error) {
            console.error("Failed to delete config", error);
        }
    };

    const handleToggleAutoMode = async (enabled: boolean) => {
        if (!selectedDevice) return;
        setIsAutoLoading(true);
        setTargetAutoState(enabled);
        try {
            await api.put(`/devices/${selectedDevice.id}`, { autoMode: enabled });
            queryClient.invalidateQueries({ queryKey: ["room", roomId] });
        } catch (error) {
            console.error("Failed to toggle auto mode", error);
            setIsAutoLoading(false);
            setTargetAutoState(null);
        }
    };

    const handleSetActiveConfig = async (configId: string) => {
        if (!selectedDevice) return;
        setIsConfigLoading(true);
        setTargetConfigId(configId);
        try {
            await api.put(`/devices/${selectedDevice.id}`, { activeConfigId: configId, autoMode: true });
            queryClient.invalidateQueries({ queryKey: ["room", roomId] });
        } catch (error) {
            console.error("Failed to set active config", error);
            setIsConfigLoading(false);
            setTargetConfigId(null);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={"padding"} keyboardVerticalOffset={90}>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Button onclick={onBack} className="flex-row items-center mb-6" variant="none" layout="plain">
                    <IconSymbol library={Ionicons} name="chevron-back" size={24} color="#2563EB" />
                    <ThemedText type="link" className="font-medium text-lg ml-1">
                        Back to Devices
                    </ThemedText>
                </Button>

                <ThemedView className="items-center mb-8">
                    <ThemedView className="flex-row items-center justify-center mb-1">
                        <ThemedText type="subtitle" className="text-gray-400 text-sm">
                            {deviceData?.name}
                        </ThemedText>
                        <Button variant="none" onclick={() => renameModalRef.current?.open(deviceData?.name || "")}>
                            <IconSymbol library={Ionicons} name="pencil" size={16} color="#6799ffff" />
                        </Button>
                    </ThemedView>
                    <ThemedText className="text-gray-500">Manual & Auto Configuration</ThemedText>
                </ThemedView>

                {/* Relay Card */}
                <ThemedView className="mb-6 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50/30" bordered>
                    <ThemedView className="p-4 flex-row items-center justify-between border-b border-gray-100 bg-white">
                        <ThemedText type="defaultSemiBold">Relay Switch</ThemedText>
                        <SwitchWithLoading
                            value={isRelayLoading && targetRelayState !== null ? targetRelayState === "on" : isRelayOn}
                            onValueChange={() => {
                                if (autoMode) {
                                    toast.info("Disable auto mode to take manual control.");
                                    return;
                                }
                                setIsRelayLoading(true);
                                const nextState = isRelayOn ? "off" : "on";
                                setTargetRelayState(nextState);
                                sendCommand(deviceData?.id!, { type: "RELAY_SET", state: isRelayOn ? "off" : "on" });
                            }}
                            loading={isRelayLoading}
                            trackColor={{ true: "#22c55e", false: "#d1d5db" }}
                        />
                    </ThemedView>

                    <ThemedView className="p-4">
                        {/* Auto Mode Control */}
                        <ThemedView className="mb-4">
                            <ThemedView className="flex-row items-center justify-between mb-2">
                                <ThemedView>
                                    <ThemedText className="font-bold">Auto Mode</ThemedText>
                                    <ThemedText className="text-[10px] text-gray-500 max-w-[200px]">
                                        Control relay based on sensor conditions.
                                    </ThemedText>
                                </ThemedView>
                                <SwitchWithLoading
                                    value={autoMode}
                                    onValueChange={handleToggleAutoMode}
                                    loading={isAutoLoading}
                                    trackColor={{ true: "#22c55e", false: "#d1d5db" }}
                                    style={{ transform: [{ scale: 0.8 }] }}
                                />
                            </ThemedView>

                            {/* Configurations Section */}
                            <ThemedView className="mt-2 pt-4 border-t border-gray-100">
                                <ThemedView className="flex-row items-center justify-between mb-3">
                                    <ThemedText className="font-bold">Configurations</ThemedText>
                                    <Button
                                        onclick={() => {
                                            setEditingConfigId(null);
                                            setFormState({
                                                name: "",
                                                sensor: "temperature",
                                                condition: ">=",
                                                threshold: "0",
                                                targetState: "on",
                                                days: "",
                                                time: "",
                                                thresholdMinutes: "0",
                                                thresholdSeconds: "0",
                                            });
                                            setIsFormVisible(!isFormVisible);
                                            setSelectedDays([]);
                                            dayModalRef.current?.close();
                                        }}
                                        className={twMerge(
                                            "p-1 aspect-square border",
                                            isFormVisible
                                                ? darkThemed("border-red-400", "border-red-500")
                                                : darkThemed("border-gray-200", "border-gray-800"),
                                        )}
                                        variant="outline"
                                    >
                                        <IconSymbol
                                            name={isFormVisible ? "close" : "add"}
                                            size={24}
                                            color={
                                                isFormVisible
                                                    ? darkThemed("#ff7c7cff", "#ff0000ff")
                                                    : darkThemed("white", "black")
                                            }
                                        />
                                    </Button>
                                </ThemedView>

                                {isFormVisible && (
                                    <ThemedView className="flex gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                                        <ThemedTextInput
                                            className="flex-1"
                                            value={formState.name}
                                            onChangeText={(t) => setFormState({ ...formState, name: t })}
                                            placeholder="Config Name"
                                        />
                                        <ThemedView className="flex-row items-center justify-between gap-2">
                                            <ThemedView className="flex-row items-center gap-4">
                                                <ThemedText className="text-xs font-bold">TURN</ThemedText>
                                                <ThemedPicker
                                                    className="flex-1"
                                                    selectedValue={formState.targetState}
                                                    onValueChange={(t) =>
                                                        setFormState({ ...formState, targetState: t as string })
                                                    }
                                                >
                                                    <ThemedPicker.Item label="ON" value="on" color="#22c55e" />
                                                    <ThemedPicker.Item label="OFF" value="off" color="#ef4444" />
                                                </ThemedPicker>
                                                <ThemedText className="text-xs font-bold">WHEN</ThemedText>
                                            </ThemedView>
                                        </ThemedView>
                                        <ThemedPicker
                                            className="flex-1"
                                            selectedValue={formState.sensor}
                                            onValueChange={(t) => setFormState({ ...formState, sensor: t as string })}
                                        >
                                            <ThemedPicker.Item label="Temperature" value="temperature" />
                                            <ThemedPicker.Item label="Humidity" value="humidity" />
                                            <ThemedPicker.Item label="Motion" value="motion" />
                                            <ThemedPicker.Item label="Sound" value="sound" />
                                            <ThemedPicker.Item label="Light" value="ldr" />
                                            <ThemedPicker.Item label="DayTime" value="datetime" />
                                            <ThemedPicker.Item label="Timer" value="timer" />
                                        </ThemedPicker>
                                        <ThemedView className="flex-row gap-2">
                                            {formState.sensor === "datetime" ? (
                                                <ThemedView className="flex-1 gap-2">
                                                    <View className="flex-row gap-4 items-center">
                                                        <ThemedText className="text-xs font-bold">DAYS: </ThemedText>
                                                        <Button
                                                            variant="outline"
                                                            className="flex-1 h-12"
                                                            onclick={() => dayModalRef.current?.open()}
                                                        >
                                                            <ThemedText>
                                                                {selectedDays.length > 0 ? selectedDays.join(", ") : "Once"}
                                                            </ThemedText>
                                                        </Button>
                                                    </View>

                                                    <View className="flex-row gap-4 items-center">
                                                        <ThemedText className="text-xs font-bold">TIME: </ThemedText>
                                                        <Button
                                                            variant="outline"
                                                            className="h-12"
                                                            onclick={() => setShowTime(true)}
                                                        >
                                                            <ThemedText>
                                                                {time.toLocaleTimeString([], {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </ThemedText>
                                                        </Button>
                                                    </View>
                                                    {showTime && (
                                                        <DateTimePicker
                                                            value={time}
                                                            mode="time"
                                                            is24Hour={true}
                                                            display="default"
                                                            onChange={(event, selected) => {
                                                                setShowTime(false);
                                                                if (selected)
                                                                    setFormState({
                                                                        ...formState,
                                                                        time: selected.toLocaleTimeString(),
                                                                    });
                                                            }}
                                                        />
                                                    )}
                                                    <AppModal
                                                        ref={dayModalRef}
                                                        title="Select Week Days"
                                                        footerType={["CANCEL", "CONFIRM"]}
                                                        onSubmitOverride={async (setLoading) => {
                                                            setLoading(true);

                                                            setFormState({
                                                                ...formState,
                                                                days: daysToString(selectedDays),
                                                            });

                                                            setLoading(false);
                                                            dayModalRef.current?.close();
                                                        }}
                                                    >
                                                        <ThemedView className="gap-2">
                                                            {WEEK_DAYS.map((day) => {
                                                                const selected = selectedDays.includes(day);

                                                                return (
                                                                    <TouchableOpacity
                                                                        key={day}
                                                                        onPress={() => {
                                                                            setSelectedDays((prev) =>
                                                                                prev.includes(day)
                                                                                    ? prev.filter((d) => d !== day)
                                                                                    : [...prev, day],
                                                                            );
                                                                        }}
                                                                        className="flex-row items-center justify-between p-3 border rounded-xl"
                                                                    >
                                                                        <ThemedText>{day}</ThemedText>

                                                                        <View
                                                                            className={`w-5 h-5 rounded-full border ${
                                                                                selected
                                                                                    ? "bg-blue-600 border-blue-600"
                                                                                    : "border-gray-400"
                                                                            }`}
                                                                        />
                                                                    </TouchableOpacity>
                                                                );
                                                            })}
                                                        </ThemedView>
                                                    </AppModal>
                                                </ThemedView>
                                            ) : formState.sensor === "timer" ? (
                                                <ThemedView className="flex-1 flex-row gap-2 items-center">
                                                    <ThemedText className="text-gray-500">Wait</ThemedText>
                                                    <View className="flex-row flex-1">
                                                        <Picker
                                                            style={{ flex: 1 }}
                                                            selectedValue={formState.thresholdMinutes}
                                                            onValueChange={(val) =>
                                                                setFormState({ ...formState, thresholdMinutes: val.toString() })
                                                            }
                                                        >
                                                            {Array.from({ length: 60 }, (_, i) => (
                                                                <Picker.Item key={i} label={`${i}m`} value={i} />
                                                            ))}
                                                        </Picker>
                                                        <Picker
                                                            style={{ flex: 1 }}
                                                            selectedValue={formState.thresholdSeconds}
                                                            onValueChange={(val) =>
                                                                setFormState({ ...formState, thresholdSeconds: val.toString() })
                                                            }
                                                        >
                                                            {Array.from({ length: 60 }, (_, i) => (
                                                                <Picker.Item key={i} label={`${i}s`} value={i} />
                                                            ))}
                                                        </Picker>
                                                    </View>
                                                </ThemedView>
                                            ) : (
                                                <>
                                                    <ThemedPicker
                                                        className="flex-1"
                                                        selectedValue={formState.condition}
                                                        onValueChange={(t) =>
                                                            setFormState({ ...formState, condition: t as string })
                                                        }
                                                    >
                                                        <ThemedPicker.Item label=">=" value=">=" />
                                                        <ThemedPicker.Item label="<" value="<" />
                                                        <ThemedPicker.Item label="==" value="==" />
                                                    </ThemedPicker>
                                                    <ThemedTextInput
                                                        className="w-20 text-xs"
                                                        value={formState.threshold}
                                                        onChangeText={(t) => setFormState({ ...formState, threshold: t })}
                                                        keyboardType="numeric"
                                                        placeholder="Val"
                                                    />
                                                </>
                                            )}
                                        </ThemedView>
                                        {formState.sensor === "datetime" && formState.days && formState.time && (
                                            <ThemedText className="text-[10px] text-gray-400 italic text-center -mt-1">
                                                Will trigger at {formState.time} on {formState.days}
                                            </ThemedText>
                                        )}
                                        <Button label="Save" className="h-14" onclick={handleSaveConfig} />

                                        {/* Display current sensor value */}
                                        {formState.sensor !== "datetime" && formState.sensor !== "timer" && (
                                            <ThemedView className="mt-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                                <ThemedText className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                                                    Current {formState.sensor} Value
                                                </ThemedText>
                                                <ThemedView className="flex-row items-baseline justify-between">
                                                    <ThemedText className="text-lg font-bold text-blue-600">
                                                        {formState.sensor === "temperature" &&
                                                            `${(deviceData?.temperature ?? 0).toFixed(1)}°C`}
                                                        {formState.sensor === "humidity" &&
                                                            `${(deviceData?.humidity ?? 0).toFixed(1)}%`}
                                                        {formState.sensor === "motion" &&
                                                            `${deviceData?.motion === 1 ? "Motion Detected" : "No Motion"}`}
                                                        {formState.sensor === "sound" &&
                                                            (deviceData?.soundDisabled === 1
                                                                ? "Disabled (Buzzer Active)"
                                                                : `${(deviceData?.sound ?? 0).toFixed(0)} dB`)}
                                                        {formState.sensor === "ldr" && `${(deviceData?.ldr ?? 0).toFixed(0)}`}
                                                    </ThemedText>
                                                    {formState.sensor === "temperature" && deviceData?.tempTimestamp && (
                                                        <RelativeTimer
                                                            timestamp={deviceData.tempTimestamp}
                                                            simple={true}
                                                            className="text-[10px] text-gray-400"
                                                        />
                                                    )}
                                                    {formState.sensor === "humidity" && deviceData?.tempTimestamp && (
                                                        <RelativeTimer
                                                            timestamp={deviceData.tempTimestamp}
                                                            simple={true}
                                                            className="text-[10px] text-gray-400"
                                                        />
                                                    )}
                                                    {formState.sensor === "motion" && deviceData?.motionTimestamp && (
                                                        <RelativeTimer
                                                            timestamp={deviceData.motionTimestamp}
                                                            simple={true}
                                                            className="text-[10px] text-gray-400"
                                                        />
                                                    )}
                                                    {formState.sensor === "sound" && deviceData?.soundTimestamp && (
                                                        <RelativeTimer
                                                            timestamp={deviceData.soundTimestamp}
                                                            simple={true}
                                                            className="text-[10px] text-gray-400"
                                                        />
                                                    )}
                                                    {formState.sensor === "ldr" && deviceData?.ldrTimestamp && (
                                                        <RelativeTimer
                                                            timestamp={deviceData.ldrTimestamp}
                                                            simple={true}
                                                            className="text-[10px] text-gray-400"
                                                        />
                                                    )}
                                                </ThemedView>
                                            </ThemedView>
                                        )}
                                    </ThemedView>
                                )}

                                {configurations.map((config: any) => (
                                    <ThemedView
                                        key={config.id}
                                        className="flex-row items-center justify-between py-2 border-b border-gray-50"
                                    >
                                        <TouchableOpacity
                                            className="flex-row items-center flex-1"
                                            onPress={() => handleSetActiveConfig(config.id)}
                                            accessibilityRole="radio"
                                            accessibilityState={{ selected: activeConfigId === config.id }}
                                        >
                                            {isConfigLoading && targetConfigId === config.id ? (
                                                <ActivityIndicator size="small" color="#2563EB" />
                                            ) : (
                                                <IconSymbol
                                                    library={Ionicons}
                                                    name={activeConfigId === config.id ? "radio-button-on" : "radio-button-off"}
                                                    size={18}
                                                    color={activeConfigId === config.id ? "#2563EB" : "#9ca3af"}
                                                />
                                            )}
                                            <ThemedView className="flex-1 ml-2">
                                                <ThemedText className="text-xs font-bold">
                                                    {config.name} | {config.targetState?.toUpperCase() || "ON"}
                                                </ThemedText>
                                                <ThemedText className="text-[10px] text-gray-500">
                                                    {config.sensor === "datetime" ? (
                                                        `${config.days || ""} at ${config.time || ""}`
                                                    ) : config.sensor === "timer" ? (
                                                        <RelativeTimer
                                                            timestamp={Date.now() + (Number(config.threshold) || 0) * 1000}
                                                            simple={true}
                                                            className="text-xs"
                                                        />
                                                    ) : (
                                                        `${config.sensor} ${config.condition} ${config.threshold}`
                                                    )}
                                                </ThemedText>
                                                {config.sensor !== "datetime" && config.sensor !== "timer" && (
                                                    <ThemedView className="mt-1 flex-row items-baseline gap-2">
                                                        <ThemedText className="text-[11px] font-semibold text-blue-600">
                                                            {config.sensor === "temperature" &&
                                                                `${(deviceData?.temperature ?? 0).toFixed(1)}°C`}
                                                            {config.sensor === "humidity" &&
                                                                `${(deviceData?.humidity ?? 0).toFixed(1)}%`}
                                                            {config.sensor === "motion" &&
                                                                `${deviceData?.motion === 1 ? "Detected" : "None"}`}
                                                            {config.sensor === "sound" &&
                                                                (deviceData?.soundDisabled === 1
                                                                    ? "Disabled"
                                                                    : `${(deviceData?.sound ?? 0).toFixed(0)} dB`)}
                                                            {config.sensor === "ldr" && `${(deviceData?.ldr ?? 0).toFixed(0)}`}
                                                        </ThemedText>
                                                        {config.sensor === "temperature" && deviceData?.tempTimestamp && (
                                                            <RelativeTimer
                                                                timestamp={deviceData.tempTimestamp}
                                                                simple={true}
                                                                className="text-[9px] text-gray-400"
                                                            />
                                                        )}
                                                        {config.sensor === "humidity" && deviceData?.tempTimestamp && (
                                                            <RelativeTimer
                                                                timestamp={deviceData.tempTimestamp}
                                                                simple={true}
                                                                className="text-[9px] text-gray-400"
                                                            />
                                                        )}
                                                        {config.sensor === "motion" && deviceData?.motionTimestamp && (
                                                            <RelativeTimer
                                                                timestamp={deviceData.motionTimestamp}
                                                                simple={true}
                                                                className="text-[9px] text-gray-400"
                                                            />
                                                        )}
                                                        {config.sensor === "sound" && deviceData?.soundTimestamp && (
                                                            <RelativeTimer
                                                                timestamp={deviceData.soundTimestamp}
                                                                simple={true}
                                                                className="text-[9px] text-gray-400"
                                                            />
                                                        )}
                                                        {config.sensor === "ldr" && deviceData?.ldrTimestamp && (
                                                            <RelativeTimer
                                                                timestamp={deviceData.ldrTimestamp}
                                                                simple={true}
                                                                className="text-[9px] text-gray-400"
                                                            />
                                                        )}
                                                    </ThemedView>
                                                )}
                                            </ThemedView>
                                        </TouchableOpacity>
                                        <ThemedView className="flex-row gap-1">
                                            <Button
                                                variant="none"
                                                layout="plain"
                                                className="p-1"
                                                onclick={() => {
                                                    setEditingConfigId(config.id);
                                                    const base: any = {
                                                        name: config.name,
                                                        sensor: config.sensor,
                                                        condition: config.condition,
                                                        targetState: config.targetState || "on",
                                                        days: config.days || "",
                                                        time: config.time || "",
                                                    };
                                                    if (config.sensor === "timer") {
                                                        const secs = Number(config.threshold) || 0;
                                                        base.thresholdMinutes = Math.floor(secs / 60).toString();
                                                        base.thresholdSeconds = (secs % 60).toString();
                                                        base.threshold = ""; // not used
                                                    } else {
                                                        base.threshold = config.threshold.toString();
                                                        base.thresholdMinutes = "0";
                                                        base.thresholdSeconds = "0";
                                                    }
                                                    setFormState(base);
                                                    setIsFormVisible(true);
                                                    setSelectedDays(stringToDays(config.days));
                                                    dayModalRef.current?.close();
                                                }}
                                            >
                                                <IconSymbol library={Ionicons} name="pencil" size={14} color="#4b5563" />
                                            </Button>
                                            <Button
                                                variant="none"
                                                layout="plain"
                                                className="p-1"
                                                onclick={() => {
                                                    setConfigToDelete(config.id);
                                                    deleteConfigModalRef.current?.open();
                                                }}
                                            >
                                                <IconSymbol library={Ionicons} name="trash" size={14} color="#ef4444" />
                                            </Button>
                                        </ThemedView>
                                    </ThemedView>
                                ))}
                            </ThemedView>
                        </ThemedView>
                    </ThemedView>
                </ThemedView>

                <ThemedView className="mb-6 rounded-2xl overflow-hidden border border-gray-100" bordered>
                    <ThemedView className="p-4 flex-row items-center justify-between border-b border-gray-100">
                        <ThemedText type="defaultSemiBold">Buzzer</ThemedText>
                        <SwitchWithLoading
                            value={isBuzzerLoading && targetBuzzerState !== null ? targetBuzzerState === 1 : isBuzzerOn}
                            onValueChange={() => {
                                setIsBuzzerLoading(true);
                                const nextBuzzer = isBuzzerOn ? 0 : 1;
                                setTargetBuzzerState(nextBuzzer);
                                sendCommand(deviceData?.id!, { type: "BUZZER", state: nextBuzzer ? "ON" : "OFF" });
                            }}
                            loading={isBuzzerLoading}
                            trackColor={{ true: "#22c55e", false: "#d1d5db" }}
                        />
                    </ThemedView>
                    <ThemedView className="p-4 flex-row items-center justify-between">
                        <ThemedView className="w-3/4">
                            <ThemedText className="font-bold">Blink Mode</ThemedText>
                            <ThemedText className="text-[10px]">Pulse buzzer instead of a continuous sound.</ThemedText>
                        </ThemedView>
                        <SwitchWithLoading
                            value={
                                isBuzzerModeLoading && targetBuzzerMode !== null
                                    ? targetBuzzerMode === 1
                                    : deviceData?.buzzerBlinkMode === 1
                            }
                            onValueChange={() => {
                                setIsBuzzerModeLoading(true);
                                const isCurrentlyBlink = deviceData?.buzzerBlinkMode === 1;
                                const nextBuzzerMode = isCurrentlyBlink ? 0 : 1;
                                setTargetBuzzerMode(nextBuzzerMode);
                                sendCommand(deviceData?.id!, {
                                    type: "BUZZER_MODE",
                                    mode: nextBuzzerMode ? "BLINK" : "CONTINUOUS",
                                });
                            }}
                            loading={isBuzzerModeLoading}
                            trackColor={{ true: "#22c55e", false: "#d1d5db" }}
                            style={{ transform: [{ scale: 0.8 }] }}
                        />
                    </ThemedView>
                    <ThemedView className="p-4 border-t border-gray-100 gap-2">
                        <ThemedText className="text-[10px]">Volume </ThemedText>
                        <View
                            className="h-10 bg-gray-100 rounded-full overflow-hidden relative justify-center dark:bg-slate-800"
                            onLayout={(event) => {
                                const { width } = event.nativeEvent.layout;
                            }}
                            {...PanResponder.create({
                                onStartShouldSetPanResponder: () => true,
                                onMoveShouldSetPanResponder: () => true,
                                onPanResponderGrant: (evt: GestureResponderEvent) => {
                                    const { locationX } = evt.nativeEvent;
                                    const width = Dimensions.get("window").width - 64;
                                    const newVol = Math.max(0, Math.min(250, Math.round((locationX / width) * 250)));
                                    setBuzzerVolume(newVol);
                                },
                                onPanResponderMove: (evt: GestureResponderEvent) => {
                                    const { locationX } = evt.nativeEvent;
                                    const width = Dimensions.get("window").width - 64;
                                    const newVol = Math.max(0, Math.min(250, Math.round((locationX / width) * 250)));
                                    setBuzzerVolume(newVol);
                                },
                                onPanResponderRelease: (evt: GestureResponderEvent) => {
                                    const { locationX } = evt.nativeEvent;
                                    const width = Dimensions.get("window").width - 64;
                                    const finalVol = Math.max(0, Math.min(250, Math.round((locationX / width) * 250)));
                                    setIsBuzzerVolumeLoading(true);
                                    setTargetBuzzerVolume(finalVol);
                                    sendCommand(deviceData?.id!, {
                                        type: "SET_BUZZER_VOLUME",
                                        volume: finalVol,
                                    });
                                    api.put(`/devices/${deviceData?.id}`, { buzzerVolume: finalVol }).catch(console.error);
                                },
                            }).panHandlers}
                        >
                            <View
                                className="absolute left-0 top-0 bottom-0 bg-green-500/20"
                                style={{ width: `${(buzzerVolume / 250) * 100}%` }}
                            />
                            <View
                                className="absolute left-0 top-0 bottom-0 bg-green-500"
                                style={{ width: `${(buzzerVolume / 250) * 100}%`, opacity: 0.8 }}
                            />
                            <ThemedText className="self-center z-10 text-[10px] font-bold">
                                {Math.round((buzzerVolume / 250) * 100)}%
                            </ThemedText>
                        </View>
                    </ThemedView>
                </ThemedView>

                {/* Buzzer/Noise Detection Card */}
                <ThemedView className="mb-6 rounded-2xl overflow-hidden border border-gray-100" bordered>
                    <ThemedView className="p-4 flex-row items-center justify-between border-b border-gray-100">
                        <ThemedText type="defaultSemiBold">Noise Detection</ThemedText>
                        <SwitchWithLoading
                            value={
                                isNoiseDetectionLoading && targetNoiseDetectionState !== null
                                    ? targetNoiseDetectionState === 1
                                    : isNoiseDetectionOn
                            }
                            onValueChange={() => {
                                setIsNoiseDetectionLoading(true);
                                const nextNoiseDetection = isNoiseDetectionOn ? 0 : 1;
                                setTargetNoiseDetectionState(nextNoiseDetection);
                                sendCommand(deviceData?.id!, {
                                    type: "NOISE_DETECTION",
                                    state: nextNoiseDetection ? "ON" : "OFF",
                                });
                            }}
                            loading={isNoiseDetectionLoading}
                            trackColor={{ true: "#22c55e", false: "#d1d5db" }}
                        />
                    </ThemedView>

                    <ThemedView className="p-3">
                        <ThemedText className="text-[10px] text-gray-400 mb-1 uppercase font-bold">Sound Threshold</ThemedText>
                        <ThemedView className="flex-row items-stretch gap-2">
                            <ThemedTextInput
                                className="flex-1 bg-gray-50 text-xs"
                                placeholder="Threshold"
                                value={buzzerThreshold}
                                onChangeText={setBuzzerThreshold}
                                keyboardType="numeric"
                            />
                            <Button label="Update" onclick={onUpdateThreshold} className="h-auto" />
                        </ThemedView>
                        <ThemedText className="text-[10px] mt-2 italic">
                            Active when {">"} {buzzerThreshold}. Last detected: {(deviceData?.sound ?? 0).toFixed(0)}
                        </ThemedText>
                    </ThemedView>
                </ThemedView>

                {/* Danger Zone */}
                <ThemedView className="p-4 rounded-xl mb-12" bordered>
                    <ThemedText type="defaultSemiBold" className="mb-2">
                        Danger Zone
                    </ThemedText>
                    <Button
                        label={`Remove from Room`}
                        variant="danger"
                        className="mt-2"
                        onclick={() => removeFromRoomModalRef.current?.open()}
                    />
                </ThemedView>
            </ScrollView>

            <AppModal
                ref={renameModalRef}
                title="Rename Device"
                placeholder="Enter new name"
                submitLabel="Rename"
                onSubmit={handleRenameSubmit}
            />

            <AppModal
                ref={deleteConfigModalRef}
                title="Delete Configuration"
                footerType={["CANCEL", "DELETE"]}
                onSubmitOverride={async (setLoading) => {
                    if (configToDelete) {
                        setLoading(true);
                        await handleDeleteConfig(configToDelete);
                        setLoading(false);
                        deleteConfigModalRef.current?.close();
                    }
                }}
            >
                <ThemedText className="text-center">Are you sure you want to delete this configuration?</ThemedText>
            </AppModal>

            <AppModal
                ref={removeFromRoomModalRef}
                title="Remove Device"
                footerType={["CANCEL", "DELETE"]}
                submitLabel="Remove"
                onSubmitOverride={async (setLoading) => {
                    setLoading(true);
                    await handleRemoveFromRoom();
                    setLoading(false);
                    removeFromRoomModalRef.current?.close();
                }}
            >
                <ThemedText className="text-center">
                    Are you sure you want to remove {deviceData?.name} from this room?
                </ThemedText>
            </AppModal>
        </KeyboardAvoidingView>
    );
}
