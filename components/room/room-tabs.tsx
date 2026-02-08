import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";
import { Button } from "../button";

interface RoomTabsProps {
    activeTab: "switches" | "sensors";
    setActiveTab: (tab: "switches" | "sensors") => void;
}

export function RoomTabs({ activeTab, setActiveTab }: RoomTabsProps) {
    const tabStyle = {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    };

    const { color: textColor } = useThemeColor("text", "color");
    const { color: textOppositeColor } = useThemeColor("text", "color", true);

    return (
        <ThemedView className="flex-row mb-4 gap-2">
            <Button
                label="Switches"
                variant="none"
                onclick={() => setActiveTab("switches")}
                className="flex-1"
                toggleColorClassName="bg-white"
                toggleValue={activeTab === "switches"}
                labelStyle={{
                    color: activeTab === "switches" ? textOppositeColor : textColor,
                }}
            />
            <Button
                label="Sensors"
                variant="none"
                onclick={() => setActiveTab("sensors")}
                className="flex-1"
                toggleColorClassName="bg-white"
                toggleValue={activeTab === "sensors"}
                labelStyle={{
                    color: activeTab === "sensors" ? textOppositeColor : textColor,
                }}
            />

            {/* <Pressable
                onPress={() => setActiveTab("switches")}
                className={`flex-1 py-2 rounded-lg items-center ${activeTab === "switches" ? "bg-white" : ""}`}
                style={activeTab === "switches" ? tabStyle : undefined}
            >
                <ThemedText className={activeTab === "switches" ? "font-semibold" : "text-gray-500"}>Switches</ThemedText>
            </Pressable>
            <Pressable
                onPress={() => setActiveTab("sensors")}
                className={`flex-1 py-2 rounded-lg items-center ${activeTab === "sensors" ? "bg-white" : ""}`}
                style={activeTab === "sensors" ? tabStyle : undefined}
            >
                <ThemedText className={activeTab === "sensors" ? "font-semibold" : "text-gray-500"}>Sensors</ThemedText>
            </Pressable> */}
        </ThemedView>
    );
}
