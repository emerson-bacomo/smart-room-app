import { AppModal, AppModalRef } from "@/components/app-modal";
import { Button } from "@/components/button";
import { RoomItem } from "@/components/room-item";
import { ThemedSafeAreaView } from "@/components/themed-safe-area-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedTextInput } from "@/components/themed-text-input";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import api from "@/utilities/api";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useRef, useState } from "react";
import { FlatList, RefreshControl } from "react-native";

export type Room = {
    id: string;
    name: string;
};

export default function RoomsScreen() {
    const { user } = useAuth();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    const createRoomModalRef = useRef<AppModalRef>(null);

    const loadRooms = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.get("/rooms");
            setRooms(res.data);
        } catch (error) {
            console.error("Failed to load rooms:", error);
        }
    }, [user]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadRooms();
        setRefreshing(false);
    }, [loadRooms]);

    useFocusEffect(
        useCallback(() => {
            loadRooms();
        }, [loadRooms]),
    );

    const handleCreateRoom = async (name: string) => {
        await api.post("/rooms", { name });
        loadRooms();
    };

    const filteredRooms = rooms.filter((room) => room.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <ThemedSafeAreaView className="flex-1 px-5 pt-4">
            <ThemedView className="mb-8">
                <ThemedText type="subtitle">My Rooms</ThemedText>
            </ThemedView>

            <ThemedTextInput className="mb-10" placeholder="Search Rooms..." value={searchQuery} onChangeText={setSearchQuery} />

            <FlatList
                className="flex-1"
                data={filteredRooms}
                keyExtractor={(room) => room.id}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <ThemedView className="items-center p-10">
                        <ThemedText type="defaultSemiBold">No Rooms Found</ThemedText>
                        <ThemedText className="mt-2 text-center text-gray-400">
                            Tap the + button to create your first room.
                        </ThemedText>
                    </ThemedView>
                }
                renderItem={({ item }) => <RoomItem item={item} loadRooms={loadRooms} />}
            />

            <Button
                variant="cta"
                className="absolute bottom-8 right-8 h-14 w-14 rounded-full shadow-lg"
                onclick={() => createRoomModalRef.current?.open()}
            >
                <IconSymbol name="add" size={20} />
            </Button>

            <AppModal
                ref={createRoomModalRef}
                title="Create Room"
                placeholder="Room Name (e.g., Living Room)"
                onSubmit={handleCreateRoom}
            />
        </ThemedSafeAreaView>
    );
}
