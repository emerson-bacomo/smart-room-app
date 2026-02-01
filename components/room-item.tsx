import { Room } from "@/app/(tabs)/index";
import { AppModal, AppModalRef } from "@/components/app-modal";
import { Button } from "@/components/button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import api from "@/utilities/api";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Alert } from "react-native";
import { Menu, MenuItem } from "react-native-material-menu";

interface RoomItemProps {
    item: Room;
    loadRooms: () => void;
}

export const RoomItem: React.FC<RoomItemProps> = ({ item, loadRooms }) => {
    const [menuVisible, setMenuVisible] = useState(false);
    const renameModalRef = useRef<AppModalRef>(null);
    const router = useRouter();

    const handleDelete = async () => {
        Alert.alert("Delete Room", `Are you sure you want to delete "${item.name}"?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await api.delete(`/rooms/${item.id}`);
                        loadRooms();
                    } catch (err) {
                        console.error(err);
                        Alert.alert("Error", "Failed to delete Room");
                    }
                },
            },
        ]);
    };

    const handleRename = async (newName: string) => {
        try {
            await api.put(`/rooms/${item.id}`, { name: newName });
            loadRooms();
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to rename Room");
        }
    };

    return (
        <ThemedView className="mb-3 flex-row items-center justify-between rounded-lg p-4">
            <Button
                variant="none"
                layout="plain"
                className="flex-1"
                onclick={() =>
                    router.push({
                        pathname: "/rooms/[id]",
                        params: { id: item.id },
                    })
                }
            >
                <ThemedText type="defaultSemiBold" className="text-black">
                    {item.name}
                </ThemedText>
            </Button>

            <Menu
                visible={menuVisible}
                onRequestClose={() => setMenuVisible(false)}
                anchor={
                    <Button variant="none" layout="plain" onclick={() => setMenuVisible(true)} className="p-2">
                        <ThemedText className="text-xl text-gray-600">⋮</ThemedText>
                    </Button>
                }
            >
                <MenuItem
                    onPress={() => {
                        setMenuVisible(false);
                        renameModalRef.current?.open(item.name);
                    }}
                >
                    Rename
                </MenuItem>
                <MenuItem
                    textStyle={{ color: "red" }}
                    onPress={() => {
                        setMenuVisible(false);
                        handleDelete();
                    }}
                >
                    Delete
                </MenuItem>
            </Menu>

            <AppModal
                ref={renameModalRef}
                title="Rename Room"
                placeholder="New Name"
                submitLabel="Rename"
                onSubmit={handleRename}
            />
        </ThemedView>
    );
};
