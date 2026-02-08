import { AppModal, AppModalRef } from "@/components/app-modal";
import { Button, ButtonProps } from "@/components/button";
import { ThemedText } from "@/components/themed-text";
import { ThemedTextInput } from "@/components/themed-text-input";
import { ThemedView } from "@/components/themed-view";
import React from "react";
import { Camera } from "./camera-section";

interface CameraModalsProps {
    cameraGridModalRef: React.RefObject<AppModalRef | null>;
    addCameraModalRef: React.RefObject<AppModalRef | null>;
    cameras: Camera[];
    selectedCamera: Camera | null;
    setSelectedCamera: (cam: Camera) => void;
    newCamId: string;
    setNewCamId: (val: string) => void;
    newCamPassword: string;
    setNewCamPassword: (val: string) => void;
    handleAddCamera: ButtonProps["onclick"];
}

export function CameraModals({
    cameraGridModalRef,
    addCameraModalRef,
    cameras,
    selectedCamera,
    setSelectedCamera,
    newCamId,
    setNewCamId,
    newCamPassword,
    setNewCamPassword,
    handleAddCamera,
}: CameraModalsProps) {
    return (
        <>
            <AppModal ref={cameraGridModalRef} title="Select Camera" hideButtons>
                <ThemedView className="gap-2">
                    {cameras.map((cam) => (
                        <Button
                            key={cam.id}
                            label={cam.name}
                            variant={selectedCamera?.id === cam.id ? "cta" : "none"}
                            className={selectedCamera?.id === cam.id ? "" : "bg-gray-100"}
                            labelClassName={selectedCamera?.id === cam.id ? "" : "text-black"}
                            onclick={() => {
                                setSelectedCamera(cam);
                                cameraGridModalRef.current?.close();
                            }}
                        />
                    ))}
                    {cameras.length === 0 && (
                        <ThemedText className="text-center text-gray-500 py-4">No cameras linked to this room.</ThemedText>
                    )}
                </ThemedView>
            </AppModal>

            <AppModal ref={addCameraModalRef} title="Link New Camera">
                <ThemedTextInput
                    placeholder="Camera ID (External ID)"
                    value={newCamId}
                    onChangeText={setNewCamId}
                    className="mb-4"
                    autoCapitalize="none"
                />
                <ThemedTextInput
                    placeholder="Camera Password"
                    value={newCamPassword}
                    onChangeText={setNewCamPassword}
                    secureTextEntry
                    className="mb-4"
                />
                <Button label="Link Camera" onclick={handleAddCamera} />
            </AppModal>
        </>
    );
}
