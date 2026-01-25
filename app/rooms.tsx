import { BaselineNoteAdd } from "@/assets/images/icons";
import { CreateRoomModal, CreateRoomModalRef } from "@/components/CreateRoomModal";
import { RoomItem } from "@/components/RoomItem";
import { Room, dbGetRooms } from "@/db/rooms";
import { useFocusEffect } from "@react-navigation/native";
import * as SQLite from "expo-sqlite";
import React, { useCallback, useRef, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const Rooms: React.FC = () => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    const db = SQLite.useSQLiteContext();

    const createRoomModalRef = useRef<CreateRoomModalRef>(null);

    const loadRooms = useCallback(() => {
        dbGetRooms(db, setRooms);
    }, [db]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        loadRooms();
        setRefreshing(false);
    }, [loadRooms]);

    useFocusEffect(
        useCallback(() => {
            loadRooms();
        }, [loadRooms]),
    );

    const filteredRooms = rooms.filter((room) => room.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <SafeAreaView className="flex flex-1 flex-col gap-2 bg-white px-5">
            <TextInput
                className="rounded-lg border border-gray-300 p-3"
                placeholder="Search Rooms..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            <FlatList
                className="flex-1"
                data={filteredRooms}
                keyExtractor={(Room) => Room.id.toString()}
                contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
                refreshing={refreshing}
                onRefresh={onRefresh}
                ListEmptyComponent={
                    <View className="flex-1 items-center p-10">
                        {searchQuery.length > 0 ? (
                            <>
                                <Text className="text-lg font-bold text-gray-500">No matches for &quot;{searchQuery}&quot;</Text>
                                <Text className="mt-2 text-center text-gray-400">
                                    Try checking your spelling or use a different keyword.
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text className="text-lg font-bold text-gray-500">No Rooms Found</Text>
                                <Text className="mt-2 text-center text-gray-400">
                                    Tap the &quot;Add&quot; button to start importing piano videos.
                                </Text>
                            </>
                        )}
                    </View>
                }
                renderItem={({ item }) => <RoomItem item={item} loadRooms={loadRooms} />}
            />

            <Pressable
                onPress={() => createRoomModalRef.current?.open()}
                className="absolute bottom-8 right-8 h-14 w-14 items-center justify-center rounded-full bg-blue-700 shadow-lg"
            >
                <BaselineNoteAdd className="size-7 text-white" />
            </Pressable>

            <CreateRoomModal ref={createRoomModalRef} rooms={rooms} onCreated={loadRooms} />
        </SafeAreaView>
    );
};
