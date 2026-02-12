import { Button } from "@/components/button";
import { ThemedText } from "@/components/themed-text";
import { ThemedTextInput } from "@/components/themed-text-input";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import React from "react";
import { SwitchDevice, SwitchToggle } from "./switch-list";

interface DeviceControlProps {
    selectedDevice: SwitchDevice | null;
    selectedSwitch: SwitchToggle | null;
    xyz: { x: string; y: string; z: string };
    setXyz: React.Dispatch<React.SetStateAction<{ x: string; y: string; z: string }>>;
    onBack: () => void;
    onToggleSwitch: (deviceId: string, switchId: string, currentState: boolean) => void;
    onCalibration: () => void;
}

export function DeviceControl({
    selectedDevice,
    selectedSwitch,
    xyz,
    setXyz,
    onBack,
    onToggleSwitch,
    onCalibration,
}: DeviceControlProps) {
    return (
        <ThemedView className="flex-1">
            <Button onclick={onBack} className="flex-row items-center mb-6" variant="none" layout="plain">
                <IconSymbol name="chevron.left" size={24} color="#2563EB" />
                <ThemedText type="link" className="font-medium text-lg ml-1">
                    Back to Devices
                </ThemedText>
            </Button>

            <ThemedView className="items-center mb-8">
                <ThemedText type="subtitle" className="mb-1 text-gray-400 text-sm uppercase">
                    {selectedDevice?.name}
                </ThemedText>
                <ThemedText type="subtitle" className="mb-1">
                    {selectedSwitch?.name}
                </ThemedText>
                <ThemedText className="text-gray-500">Calibration & Control</ThemedText>
            </ThemedView>

            {/* On/Off States */}
            <ThemedView className="flex-row gap-4 mb-6">
                <Button
                    variant="none"
                    layout="plain"
                    className="flex-1 p-6 rounded-xl items-center border"
                    style={{
                        backgroundColor: selectedSwitch?.isOn ? "#dcfce7" : "#f3f4f6",
                        borderColor: selectedSwitch?.isOn ? "#bbf7d0" : "#e5e7eb",
                    }}
                    onclick={() => onToggleSwitch(selectedDevice?.id!, selectedSwitch?.id!, false)}
                >
                    <ThemedText className={`${selectedSwitch?.isOn ? "text-green-800" : "text-gray-400"} font-bold text-xl`}>
                        ON
                    </ThemedText>
                </Button>
                <Button
                    variant="none"
                    layout="plain"
                    className="flex-1 p-6 rounded-xl items-center border"
                    style={{
                        backgroundColor: !selectedSwitch?.isOn ? "#fee2e2" : "#f3f4f6",
                        borderColor: !selectedSwitch?.isOn ? "#fecaca" : "#e5e7eb",
                    }}
                    onclick={() => onToggleSwitch(selectedDevice?.id!, selectedSwitch?.id!, true)}
                >
                    <ThemedText className={`${!selectedSwitch?.isOn ? "text-red-800" : "text-gray-400"} font-bold text-xl`}>
                        OFF
                    </ThemedText>
                </Button>
            </ThemedView>

            <ThemedView className="gap-4 p-4 rounded-xl mb-6" bordered>
                <ThemedView className="flex-row gap-2">
                    <ThemedTextInput
                        className="flex-1 bg-white"
                        placeholder="X"
                        value={xyz.x}
                        onChangeText={(val) => setXyz((prev) => ({ ...prev, x: val }))}
                        keyboardType="numeric"
                    />
                    <ThemedTextInput
                        className="flex-1 bg-white"
                        placeholder="Y"
                        value={xyz.y}
                        onChangeText={(val) => setXyz((prev) => ({ ...prev, y: val }))}
                        keyboardType="numeric"
                    />
                    <ThemedTextInput
                        className="flex-1 bg-white"
                        placeholder="Z"
                        value={xyz.z}
                        onChangeText={(val) => setXyz((prev) => ({ ...prev, z: val }))}
                        keyboardType="numeric"
                    />
                </ThemedView>
                <Button label="Update Calibration (.local)" onclick={onCalibration} />
            </ThemedView>
        </ThemedView>
    );
}
