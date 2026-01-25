import { dbCreateRoom, Room } from "@/db/rooms";
import { alertAsync } from "@/Utilities/AlertUtils";
import * as SQLite from "expo-sqlite";
import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Alert, Modal, Pressable, Text, TextInput, View } from "react-native";

interface CreateRoomModalProps {
    rooms: Room[];
    onCreated?: (Room: Room) => void;
}

export interface CreateRoomModalRef {
    open: () => void;
    close: () => void;
}

export const CreateRoomModal = forwardRef<CreateRoomModalRef, CreateRoomModalProps>(({ rooms, onCreated }, ref) => {
    const [visible, setVisible] = useState(false);
    const [RoomName, setRoomName] = useState("");
    const db = SQLite.useSQLiteContext();

    // Expose open/close methods via ref
    useImperativeHandle(ref, () => ({
        open: () => {
            setRoomName(`Room ${rooms.length + 1}`);
            setVisible(true);
        },
        close: () => setVisible(false),
    }));

    const handleCreate = async () => {
        const name = RoomName.trim() || `Room ${rooms.length + 1}`;

        try {
            const Room = dbCreateRoom(db, {
                name,
            });

            if (!Room) {
                await alertAsync("Error", "Could not create Room.");
                return;
            }

            await alertAsync("Room Created", `Room "${Room.name}" created successfully.`);
            onCreated?.(Room);
            setVisible(false);
        } catch (err) {
            console.error("Failed to create Room:", err);
            Alert.alert("Error", "Failed to create Room");
        }
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent>
            <View className="flex-1 justify-center bg-black/40 px-6">
                <View className="rounded-xl bg-white p-6">
                    <Text className="mb-2 text-lg font-bold text-black">Create Room</Text>

                    <TextInput
                        className="mb-4 rounded-lg border border-gray-300 px-3 py-2"
                        value={RoomName}
                        onChangeText={setRoomName}
                        placeholder="Enter Room name"
                    />

                    <View className="flex-row justify-end gap-2">
                        <Pressable onPress={() => setVisible(false)} className="rounded-lg bg-gray-300 px-4 py-2">
                            <Text>Cancel</Text>
                        </Pressable>

                        <Pressable onPress={handleCreate} className="rounded-lg bg-blue-600 px-4 py-2">
                            <Text className="text-white">Create</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
});

CreateRoomModal.displayName = "CreateRoomModal";
