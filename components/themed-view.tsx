import { View, type ViewProps } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";

export type ThemedViewProps = ViewProps & {
    bordered?: boolean;
    opposite?: boolean;
};

export function ThemedView({ style, bordered, opposite, ...otherProps }: ThemedViewProps) {
    const { backgroundColor, textInputBorder: borderColor } = useThemeColor(
        ["backgroundColor", "textInputBorder"],
        undefined,
        opposite,
    );

    return <View style={[{ backgroundColor }, bordered && { borderColor, borderWidth: 1 }, style]} {...otherProps} />;
}
