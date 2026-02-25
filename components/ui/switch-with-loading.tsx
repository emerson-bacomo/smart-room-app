import React from "react";
import { ActivityIndicator, Switch, View, StyleProp, ViewStyle } from "react-native";

interface SwitchWithLoadingProps {
    value: boolean;
    onValueChange: (val: boolean) => void;
    loading?: boolean;
    disabled?: boolean;
    trackColor?: { true: string; false: string };
    /** apply tailwind classnames to the container view */
    className?: string;
    style?: StyleProp<ViewStyle>;
}

export function SwitchWithLoading({
    value,
    onValueChange,
    loading = false,
    disabled = false,
    trackColor,
    className,
    style,
}: SwitchWithLoadingProps) {
    const combinedDisabled = disabled || loading;

    return (
        <View className={className ?? "flex-row items-center gap-2"} style={style}>
            {loading && <ActivityIndicator size="small" color="#2563EB" />}
            <Switch value={value} onValueChange={onValueChange} disabled={combinedDisabled} trackColor={trackColor} />
        </View>
    );
}
