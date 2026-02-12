import { Button, ButtonProps } from "@/components/button";
import { ThemedText } from "@/components/themed-text";
import { ThemedTextInput } from "@/components/themed-text-input";
import { ThemedView } from "@/components/themed-view";
import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Modal, TouchableWithoutFeedback, View } from "react-native";

export interface AppModalRef {
    open: (initialValue?: string) => void;
    close: () => void;
}

export type FooterAction = "CANCEL" | "CONFIRM" | "DELETE" | "CLOSE";

interface AppModalProps {
    title: string;
    placeholder?: string;
    submitLabel?: string;
    onSubmit?: (value: string) => Promise<void>;
    onSubmitOverride?: ButtonProps["onclick"];
    children?: React.ReactNode;
    footerType?: FooterAction | FooterAction[] | "NONE";
    submitVariant?: ButtonProps["variant"];
    onOpen?: () => void | Promise<void>;
}

export const AppModal = forwardRef<AppModalRef, AppModalProps>(
    (
        {
            title,
            placeholder,
            submitLabel = "Confirm",
            onSubmit,
            children,
            onSubmitOverride,
            footerType = ["CANCEL", "CONFIRM"],
            submitVariant = "cta",
            onOpen,
        },
        ref,
    ) => {
        const [visible, setVisible] = useState(false);
        const [value, setValue] = useState("");

        useImperativeHandle(ref, () => ({
            open: (initialValue = "") => {
                setValue(initialValue);
                setVisible(true);
                if (onOpen) {
                    onOpen();
                }
            },
            close: () => setVisible(false),
        }));

        const handleSubmit: ButtonProps["onclick"] = async (setLoading) => {
            if (!onSubmit) return;
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
            <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
                <TouchableWithoutFeedback onPress={() => setVisible(false)}>
                    <View className="flex-1 justify-center bg-black/40 px-6">
                        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                            <ThemedView className="rounded-xl p-6" bordered opposite>
                                <ThemedText type="subtitle" className="mb-4 text-center">
                                    {title}
                                </ThemedText>

                                {children ? (
                                    children
                                ) : (
                                    <ThemedTextInput
                                        className="mb-4"
                                        value={value}
                                        onChangeText={setValue}
                                        placeholder={placeholder}
                                        autoFocus
                                    />
                                )}

                                {footerType !== "NONE" && (
                                    <ThemedView className="flex-row justify-end gap-2 bg-transparent">
                                        {(Array.isArray(footerType) ? footerType : [footerType]).map((action, index) => {
                                            if (action === "CANCEL" || action === "CLOSE") {
                                                return (
                                                    <Button
                                                        key={index}
                                                        label={action === "CLOSE" ? "Close" : "Cancel"}
                                                        variant="none"
                                                        className="bg-gray-500"
                                                        labelClassName="text-white"
                                                        onclick={() => setVisible(false)}
                                                    />
                                                );
                                            }

                                            if (action === "CONFIRM" || action === "DELETE") {
                                                return (
                                                    <Button
                                                        key={index}
                                                        label={action === "DELETE" ? "Delete" : submitLabel}
                                                        variant={action === "DELETE" ? "danger" : submitVariant}
                                                        onclick={onSubmitOverride ?? handleSubmit}
                                                    />
                                                );
                                            }

                                            return null;
                                        })}
                                    </ThemedView>
                                )}
                            </ThemedView>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        );
    },
);

AppModal.displayName = "AppModal";
