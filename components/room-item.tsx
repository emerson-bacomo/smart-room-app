import { Room } from "@/app/(tabs)/index";
import { AppModal, AppModalRef } from "@/components/app-modal";
import { Button } from "@/components/button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import api from "@/utilities/api";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { toast } from "sonner-native";
import { IconSymbol } from "./ui/icon-symbol";

interface RoomItemProps {
    item: Room;
    loadRooms: () => void;
}

export const RoomItem: React.FC<RoomItemProps> = ({ item, loadRooms }) => {
    const [menuVisible, setMenuVisible] = useState(false);
    const renameModalRef = useRef<AppModalRef>(null);
    const deleteModalRef = useRef<AppModalRef>(null);
    const router = useRouter();
    const menuModalRef = useRef<AppModalRef>(null);

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
                className="flex-1 justify-start px-3"
                onclick={() =>
                    router.push({
                        pathname: "/rooms/[id]",
                        params: { id: item.id },
                    })
                }
                label={item.name}
                useThemedText
                labelClassName="font-semibold text-lg"
            />

            <Button variant="none" onclick={() => menuModalRef.current?.open()} className="p-2">
                <IconSymbol name="ellipsis-vertical-sharp" library={Ionicons} size={16} />
            </Button>

            <AppModal ref={menuModalRef} title={item.name} footerType="NONE">
                <ThemedView className="gap-2">
                    <Button
                        label="Rename Room"
                        variant="a-bit-white"
                        labelClassName="text-lg"
                        onclick={() => {
                            menuModalRef.current?.close();
                            renameModalRef.current?.open(item.name);
                        }}
                    />
                    <Button
                        label="Delete Room"
                        variant="danger"
                        labelClassName="text-lg"
                        onclick={() => {
                            menuModalRef.current?.close();
                            deleteModalRef.current?.open();
                        }}
                    />
                </ThemedView>
            </AppModal>

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
