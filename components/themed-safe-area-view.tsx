import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";
import { SafeAreaView, type SafeAreaViewProps } from "react-native-safe-area-context";

export function ThemedSafeAreaView({ style, ...otherProps }: SafeAreaViewProps) {
    const themedStyle = useThemeColor("backgroundColor");

    return <SafeAreaView style={[themedStyle, style]} {...otherProps} />;
}
