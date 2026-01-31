import { Room } from "@/app/rooms";
import React, { useState } from "react";
import { Alert, Modal, Pressable, Text, TextInput, View } from "react-native";
import { Menu, MenuItem } from "react-native-material-menu";

interface RoomItemProps {
    item: Room;
    loadRooms: () => void;
}

export const RoomItem: React.FC<RoomItemProps> = ({ item, loadRooms }) => {
    const [menuVisible, setMenuVisible] = useState(false);

    const [renameModalVisible, setRenameModalVisible] = useState(false);
    const [renameRoomName, setRenameRoomName] = useState("");

    const handleDelete = async () => {
        Alert.alert("Delete Room", `Are you sure you want to delete "${item.name}"?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        loadRooms();
                    } catch (err) {
                        console.error(err);
                        Alert.alert("Error", "Failed to delete Room");
                    }
                },
            },
        ]);
    };

    const openRenameModal = () => {
        setRenameRoomName(item.name);
        setRenameModalVisible(true);
    };

    const handleRename = async () => {
        const newName = renameRoomName.trim();
        if (!newName) return;

        try {
            // dbRenameRoom(db, item.id, newName);
            setRenameModalVisible(false);
            loadRooms();
        } catch (err: any) {
            console.error(err);
            Alert.alert("Error", err.message || "Failed to rename Room");
        }
    };

    return (
        <View className="mb-3 flex-row items-center justify-between rounded-lg bg-gray-200 p-4">
            <Pressable className="flex-1">
                <Text className={`text-base text-black`}>{item.name}</Text>
            </Pressable>

            <Menu
                visible={menuVisible}
                onRequestClose={() => setMenuVisible(false)}
                anchor={
                    <Pressable onPress={() => setMenuVisible(true)} className="p-2">
                        <Text className="text-xl">⋮</Text>
                    </Pressable>
                }
            >
                <MenuItem
                    onPress={() => {
                        setMenuVisible(false);
                        handleDelete();
                    }}
                >
                    Delete
                </MenuItem>
                <MenuItem
                    onPress={() => {
                        setMenuVisible(false);
                        openRenameModal();
                    }}
                >
                    Rename
                </MenuItem>
            </Menu>

            {/* Rename Modal */}
            <Modal visible={renameModalVisible} transparent animationType="fade">
                <View className="flex-1 justify-center bg-black/40 px-6">
                    <View className="rounded-xl bg-white p-6">
                        <Text className="mb-3 text-lg font-bold text-black">Rename Room</Text>

                        <TextInput
                            className="mb-4 rounded-lg border border-gray-300 px-3 py-2"
                            value={renameRoomName}
                            onChangeText={setRenameRoomName}
                            placeholder="Enter new Room name"
                        />

                        <View className="flex-row justify-end gap-2">
                            <Pressable onPress={() => setRenameModalVisible(false)} className="rounded-lg bg-gray-300 px-4 py-2">
                                <Text>Cancel</Text>
                            </Pressable>

                            <Pressable onPress={handleRename} className="rounded-lg bg-blue-600 px-4 py-2">
                                <Text className="text-white">Rename</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};
