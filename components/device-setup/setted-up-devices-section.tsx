import { AppModal, AppModalRef } from "@/components/app-modal";
import { Button } from "@/components/button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/hooks/use-auth";
import api from "@/utilities/api";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

export function SettedUpDevicesSection() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const toast = useToast();

    const renameModalRef = useRef<AppModalRef>(null);
    const roomsModalRef = useRef<AppModalRef>(null);
    const actionModalRef = useRef<AppModalRef>(null);
    const [selectedDevice, setSelectedDevice] = useState<any>(null);

    const {
        data: devices = [],
        isLoading: loadingDevices,
        isRefetching: refetchingDevices,
        refetch: refreshDevices,
    } = useQuery({
        queryKey: ["devices"],
        queryFn: async ({ signal }) => {
            const res = await api.get("/devices", { signal });
            return res.data;
        },
        enabled: !!user,
    });

    const {
        data: rooms = [],
        isLoading: loadingRooms,
        isRefetching: refetchingRooms,
        refetch: refreshRooms,
    } = useQuery({
        queryKey: ["rooms"],
        queryFn: async ({ signal }) => {
            const res = await api.get("/rooms", { signal });
            return res.data;
        },
        enabled: !!user,
    });

    const onRefresh = useCallback(() => {
        refreshDevices();
        refreshRooms();
    }, [refreshDevices, refreshRooms]);

    const isLoading = loadingDevices || loadingRooms;
    const isRefetching = refetchingDevices || refetchingRooms;

    useFocusEffect(
        useCallback(() => {
            onRefresh();
        }, [onRefresh]),
    );

    const handleRenameSubmit = async (newName: string) => {
        if (!selectedDevice) return;
        try {
            await api.put(`/devices/${selectedDevice.id}`, { name: newName });
            queryClient.invalidateQueries({ queryKey: ["devices"] });
            toast.success("Device renamed successfully");
        } catch (err) {
            toast.error("Failed to rename device");
        }
    };

    const handleRename = (device: any) => {
        setSelectedDevice(device);
        renameModalRef.current?.open(device.name || "");
    };

    const handleRoomAssign = async (roomId: string | null) => {
        if (!selectedDevice) return;
        try {
            await api.put(`/devices/${selectedDevice.id}`, { roomId });
            queryClient.invalidateQueries({ queryKey: ["devices"] });
            roomsModalRef.current?.close();
            toast.success(roomId ? "Device assigned to room" : "Device unassigned");
        } catch (err) {
            toast.error("Failed to update room assignment");
        }
    };

    const handleAddToRoom = (device: any) => {
        setSelectedDevice(device);
        if (rooms.length === 0) {
            toast.info("Please create a room first in the Home tab.");
            return;
        }
        roomsModalRef.current?.open();
    };

    const onAction = (item: any) => {
        setSelectedDevice(item);
        actionModalRef.current?.open();
    };

    return (
        <>
            <View className="flex-row items-center justify-between mb-4 mt-8">
                <View className="flex-1">
                    <ThemedText type="subtitle">Setted Up Devices</ThemedText>
                    <ThemedText className="mt-1" style={{ opacity: 0.5 }}>
                        Devices already managed by you
                    </ThemedText>
                </View>
                <Pressable
                    onPress={() => onRefresh()}
                    disabled={isRefetching}
                    className="p-2 rounded-full border"
                    style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(0,0,0,0.05)" }}
                >
                    {isRefetching ? (
                        <ActivityIndicator size={18} color="#6366f1" />
                    ) : (
                        <IconSymbol library={MaterialIcons} name="refresh" size={18} color="#6366f1" />
                    )}
                </Pressable>
            </View>

            <View>
                {devices.length === 0
                    ? !isLoading && (
                          <ThemedView className="p-8 items-center rounded-2xl" bordered>
                              <ThemedText className="italic" style={{ opacity: 0.5 }}>
                                  No devices setted up yet.
                              </ThemedText>
                          </ThemedView>
                      )
                    : devices.map((item: any) => (
                          <ThemedView key={item.id} className="flex-row items-center p-5 mb-3 rounded-2xl" bordered>
                              <View className="w-10 h-10 rounded-full bg-indigo-500/20 items-center justify-center mr-4">
                                  <IconSymbol library={Feather} name="cpu" size={20} color="#6366f1" />
                              </View>
                              <View className="flex-1">
                                  <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                                  <ThemedText className="text-xs" style={{ opacity: 0.5 }}>
                                      {item.room ? `Room: ${item.room.name}` : "Not Assigned"}
                                  </ThemedText>
                              </View>
                              <Pressable onPress={() => onAction(item)} className="p-2">
                                  <IconSymbol library={Ionicons} name="ellipsis-vertical" size={20} color="#4b5563" />
                              </Pressable>
                          </ThemedView>
                      ))}
            </View>

            {/* Modals */}
            <AppModal
                ref={renameModalRef}
                title="Rename Device"
                placeholder="Enter new name"
                submitLabel="Rename"
                onSubmit={handleRenameSubmit}
            />

            <AppModal ref={roomsModalRef} title="Assign to Room" footerType="CLOSE">
                <ScrollView className="max-h-80">
                    <ThemedView className="gap-2 bg-transparent">
                        {rooms.map((r: any) => (
                            <Button
                                key={r.id}
                                label={r.name}
                                variant="none"
                                className="bg-white/10 p-4 rounded-xl border border-white/10"
                                onclick={() => handleRoomAssign(r.id)}
                            />
                        ))}
                        <Button label="Unassign" variant="danger" className="mt-2" onclick={() => handleRoomAssign(null)} />
                    </ThemedView>
                </ScrollView>
            </AppModal>

            <AppModal ref={actionModalRef} title="Device Settings" footerType="CLOSE">
                <ThemedView className="gap-3 bg-transparent">
                    <Button
                        label="Rename Device"
                        variant="none"
                        className="bg-white/10 p-4 rounded-xl border border-white/10"
                        onclick={() => {
                            actionModalRef.current?.close();
                            handleRename(selectedDevice);
                        }}
                    />
                    <Button
                        label={selectedDevice?.roomId ? "Move Room" : "Add to Room"}
                        variant="none"
                        className="bg-white/10 p-4 rounded-xl border border-white/10"
                        onclick={() => {
                            actionModalRef.current?.close();
                            handleAddToRoom(selectedDevice);
                        }}
                    />
                </ThemedView>
            </AppModal>
        </>
    );
}
