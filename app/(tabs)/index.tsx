import { AppModal, AppModalRef } from "@/components/app-modal";
import { Button } from "@/components/button";
import { RoomItem } from "@/components/room-item";
import { JoinRoomModal } from "@/components/room/share-room-modal";
import { ThemedSafeAreaView } from "@/components/themed-safe-area-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedTextInput } from "@/components/themed-text-input";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/hooks/use-auth";
import api from "@/utilities/api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useRef, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl } from "react-native";

export type Room = {
    id: string;
    name: string;
};

export default function RoomsScreen() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");

    const createRoomModalRef = useRef<AppModalRef>(null);
    const joinRoomModalRef = useRef<AppModalRef>(null);

    const {
        data: rooms = [],
        isLoading,
        isRefetching,
        refetch,
    } = useQuery<Room[]>({
        queryKey: ["rooms"],
        queryFn: async ({ signal }) => {
            const res = await api.get("/rooms", { signal });
            return res.data;
        },
        enabled: !!user,
    });

    const toast = useToast();

    const handleCreateRoom = async (name: string) => {
        try {
            await api.post("/rooms", { name });
            queryClient.invalidateQueries({ queryKey: ["rooms"] });
            toast.success("Room created successfully");
        } catch (err) {
            toast.error("Failed to create room");
        }
    };

    const handleJoinSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ["rooms"] });
    };

    const filteredRooms = rooms.filter((room) => room.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <ThemedSafeAreaView className="flex-1 px-5 pt-4">
            <ThemedView className="mb-8 flex-row justify-between items-center">
                <ThemedText type="subtitle">My Rooms</ThemedText>
                <Button
                    variant="none"
                    className="px-3 py-2 border rounded-lg"
                    style={{ borderColor: "#0a7ea4" }}
                    onclick={() => joinRoomModalRef.current?.open()}
                >
                    <ThemedText type="link" style={{ fontSize: 14 }}>
                        Join Room
                    </ThemedText>
                </Button>
            </ThemedView>

            <ThemedTextInput className="mb-10" placeholder="Search Rooms..." value={searchQuery} onChangeText={setSearchQuery} />

            {(() => {
                if (isLoading && !isRefetching) {
                    return (
                        <ThemedView className="flex-1 items-center justify-center">
                            <ActivityIndicator size="large" color="#007AFF" />
                        </ThemedView>
                    );
                }

                return (
                    <FlatList
                        className="flex-1"
                        data={filteredRooms}
                        keyExtractor={(room) => room.id}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
                        ListEmptyComponent={
                            <ThemedView className="items-center p-10">
                                <ThemedText type="defaultSemiBold">No Rooms Found</ThemedText>
                                <ThemedText className="mt-2 text-center" style={{ opacity: 0.6 }}>
                                    Tap the + button to create your first room.
                                </ThemedText>
                            </ThemedView>
                        }
                        renderItem={({ item }) => (
                            <RoomItem item={item} loadRooms={() => queryClient.invalidateQueries({ queryKey: ["rooms"] })} />
                        )}
                    />
                );
            })()}

            <Button
                variant="cta"
                className="absolute bottom-8 right-8 h-14 w-14 rounded-full"
                style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4.65,
                    elevation: 8,
                }}
                onclick={() => createRoomModalRef.current?.open()}
            >
                <IconSymbol library={MaterialIcons} name="add" size={20} />
            </Button>

            <AppModal
                ref={createRoomModalRef}
                title="Create Room"
                placeholder="Room Name (e.g., Living Room)"
                onSubmit={handleCreateRoom}
            />

            <JoinRoomModal modalRef={joinRoomModalRef} onJoinSuccess={handleJoinSuccess} />
        </ThemedSafeAreaView>
    );
}
