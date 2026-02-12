import { Room } from "@/app/(tabs)/index";
import { AppModal, AppModalRef } from "@/components/app-modal";
import { Button } from "@/components/button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useToast } from "@/context/toast-context";
import api from "@/utilities/api";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Menu, MenuItem } from "react-native-material-menu";

interface RoomItemProps {
    item: Room;
    loadRooms: () => void;
}

export const RoomItem: React.FC<RoomItemProps> = ({ item, loadRooms }) => {
    const [menuVisible, setMenuVisible] = useState(false);
    const renameModalRef = useRef<AppModalRef>(null);
    const deleteModalRef = useRef<AppModalRef>(null);
    const toast = useToast();
    const router = useRouter();

    const handleDeleteConfirm = async () => {
        try {
            await api.delete(`/rooms/${item.id}`);
            loadRooms();
            toast.success("Room deleted successfully");
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete Room");
        }
    };

    const handleRename = async (newName: string) => {
        try {
            await api.put(`/rooms/${item.id}`, { name: newName });
            loadRooms();
            toast.success("Room renamed successfully");
        } catch (err) {
            console.error(err);
            toast.error("Failed to rename Room");
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
                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
            </Button>

            <Menu
                visible={menuVisible}
                onRequestClose={() => setMenuVisible(false)}
                anchor={
                    <Button variant="none" layout="plain" onclick={() => setMenuVisible(true)} className="p-2">
                        <ThemedText className="text-xl" style={{ opacity: 0.6 }}>
                            ⋮
                        </ThemedText>
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
                        deleteModalRef.current?.open();
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

            <AppModal ref={deleteModalRef} title="Delete Room" footerType="DELETE" onSubmitOverride={handleDeleteConfirm}>
                <ThemedText className="mb-4 text-center">
                    Are you sure you want to delete <ThemedText type="defaultSemiBold">"{item.name}"</ThemedText>?
                </ThemedText>
            </AppModal>
        </ThemedView>
    );
};
