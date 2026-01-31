import { Button, ButtonProps } from "@/components/button";
import { ThemedText } from "@/components/themed-text";
import { ThemedTextInput } from "@/components/themed-text-input";
import { ThemedView } from "@/components/themed-view";
import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Modal, View } from "react-native";

export interface AppModalRef {
    open: (initialValue?: string) => void;
    close: () => void;
}

interface AppModalProps {
    title: string;
    placeholder?: string;
    submitLabel?: string;
    onSubmit: (value: string) => Promise<void>;
}

export const AppModal = forwardRef<AppModalRef, AppModalProps>(
    ({ title, placeholder, submitLabel = "Create", onSubmit }, ref) => {
        const [visible, setVisible] = useState(false);
        const [value, setValue] = useState("");

        useImperativeHandle(ref, () => ({
            open: (initialValue = "") => {
                setValue(initialValue);
                setVisible(true);
            },
            close: () => setVisible(false),
        }));

        const handleSubmit: ButtonProps["onclick"] = async (setLoading) => {
            if (!value.trim()) return;
            setLoading(true);
            try {
                await onSubmit(value.trim());
                setVisible(false);
                setValue("");
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        if (!visible) return null;

        return (
            <Modal visible={visible} transparent animationType="fade">
                <View className="flex-1 justify-center bg-black/40 px-6">
                    <ThemedView className="rounded-xl p-6">
                        <ThemedText type="subtitle" className="mb-4">
                            {title}
                        </ThemedText>

                        <ThemedTextInput
                            className="mb-4"
                            value={value}
                            onChangeText={setValue}
                            placeholder={placeholder}
                            autoFocus
                        />

                        <ThemedView className="flex-row justify-end gap-2 bg-transparent">
                            <Button
                                label="Cancel"
                                variant="none"
                                className="bg-gray-500"
                                labelClassName="text-white"
                                onclick={() => setVisible(false)}
                            />

                            <Button label={submitLabel} variant="cta" onclick={handleSubmit} />
                        </ThemedView>
                    </ThemedView>
                </View>
            </Modal>
        );
    },
);

AppModal.displayName = "AppModal";
