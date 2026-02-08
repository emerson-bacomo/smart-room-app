import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { Pressable, View } from "react-native";

interface SettedUpDevicesSectionProps {
    devices: any[];
    isLoading: boolean;
    onRefresh: () => void;
    onAction: (device: any) => void;
}

export function SettedUpDevicesSection({ devices, isLoading, onRefresh, onAction }: SettedUpDevicesSectionProps) {
    return (
        <>
            <View className="flex-row items-center justify-between mb-4 mt-8">
                <View className="flex-1">
                    <ThemedText type="subtitle">Setted Up Devices</ThemedText>
                    <ThemedText className="text-gray-400 mt-1">Devices already managed by you</ThemedText>
                </View>
                <Pressable
                    onPress={onRefresh}
                    disabled={isLoading}
                    className="bg-white/10 p-2 rounded-full border border-white/10"
                >
                    <IconSymbol library={MaterialIcons} name="refresh" size={18} color="#6366f1" />
                </Pressable>
            </View>

            <View>
                {devices.length === 0
                    ? !isLoading && (
                          <ThemedView className="p-8 items-center border border-white/5 rounded-2xl">
                              <ThemedText className="text-gray-500 italic">No devices setted up yet.</ThemedText>
                          </ThemedView>
                      )
                    : devices.map((item) => (
                          <View
                              key={item.id}
                              className="flex-row items-center p-5 mb-3 rounded-2xl bg-white/5 border border-white/10"
                          >
                              <View className="w-10 h-10 rounded-full bg-indigo-500/20 items-center justify-center mr-4">
                                  <IconSymbol library={Feather} name="cpu" size={20} color="#6366f1" />
                              </View>
                              <View className="flex-1">
                                  <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                                  <ThemedText className="text-xs text-gray-500">
                                      {item.room ? `Room: ${item.room.name}` : "Not Assigned"}
                                  </ThemedText>
                              </View>
                              <Pressable onPress={() => onAction(item)} className="p-2">
                                  <IconSymbol library={Ionicons} name="ellipsis-vertical" size={20} color="#4b5563" />
                              </Pressable>
                          </View>
                      ))}
            </View>
        </>
    );
}
