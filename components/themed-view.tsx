import { View, type ViewProps } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";

export type ThemedViewProps = ViewProps;

export function ThemedView({ style, ...otherProps }: ThemedViewProps) {
    const themedStyle = useThemeColor("background", "backgroundColor");

    return <View style={[themedStyle, style]} {...otherProps} />;
}
