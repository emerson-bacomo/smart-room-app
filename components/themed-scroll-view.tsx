import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";
import { ScrollView, type ScrollViewProps } from "react-native";

export type ThemedScrollViewProps = ScrollViewProps;

export function ThemedScrollView({ style, contentContainerStyle, ...otherProps }: ThemedScrollViewProps) {
    const themedStyle = useThemeColor("backgroundColor");

    return <ScrollView style={[themedStyle, style]} contentContainerStyle={contentContainerStyle} {...otherProps} />;
}
