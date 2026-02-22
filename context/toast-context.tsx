import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = "success" | "error" | "info";

interface ToastOptions {
    message: string;
    type?: ToastType;
    duration?: number;
}

interface ToastContextType {
    show: (options: ToastOptions) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState("");
    const [type, setType] = useState<ToastType>("info");
    const translateY = useRef(new Animated.Value(-100)).current;
    const insets = useSafeAreaInsets();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const show = useCallback(
        ({ message, type = "info", duration = 3000 }: ToastOptions) => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            setMessage(message);
            setType(type);
            setVisible(true);

            Animated.spring(translateY, {
                toValue: insets.top + 10,
                useNativeDriver: true,
                tension: 40,
                friction: 7,
            }).start();

            timerRef.current = setTimeout(() => {
                hide();
            }, duration);
        },
        [insets.top, translateY],
    );

    const success = useCallback(
        (message: string, duration?: number) => {
            show({ message, type: "success", duration });
        },
        [show],
    );

    const error = useCallback(
        (message: string, duration?: number) => {
            show({ message, type: "error", duration });
        },
        [show],
    );

    const info = useCallback(
        (message: string, duration?: number) => {
            show({ message, type: "info", duration });
        },
        [show],
    );

    const hide = useCallback(() => {
        Animated.timing(translateY, {
            toValue: -150,
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            setVisible(false);
        });
    }, [translateY]);

    const getIcon = () => {
        switch (type) {
            case "success":
                return "checkmark-circle";
            case "error":
                return "alert-circle";
            default:
                return "information-circle";
        }
    };

    const getIconColor = () => {
        switch (type) {
            case "success":
                return "#22c55e";
            case "error":
                return "#ef4444";
            default:
                return "#3b82f6";
        }
    };

    return (
        <ToastContext.Provider value={{ show, success, error, info }}>
            {children}
            {visible && (
                <Animated.View style={[styles.toastContainer, { transform: [{ translateY }] }]}>
                    <TouchableOpacity onPress={hide} activeOpacity={1}>
                        <ThemedView className="flex-row items-center p-4 rounded-2xl shadow-lg border" bordered>
                            <IconSymbol library={Ionicons} name={getIcon() as any} size={24} color={getIconColor()} />
                            <ThemedText className="ml-3 font-medium flex-1" numberOfLines={2}>
                                {message}
                            </ThemedText>
                        </ThemedView>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
}

const styles = StyleSheet.create({
    toastContainer: {
        position: "absolute",
        left: 20,
        right: 20,
        zIndex: 9999,
    },
});
