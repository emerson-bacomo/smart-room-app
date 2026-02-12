import { View, type ViewProps } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";

export type ThemedViewProps = ViewProps & {
    bordered?: boolean;
    opposite?: boolean;
};

export function ThemedView({ style, bordered, opposite, ...otherProps }: ThemedViewProps) {
    const { background: backgroundColor, textInputBorder: borderColor } = useThemeColor(
        ["background", "textInputBorder"],
        undefined,
        opposite,
    );

    return <View style={[{ backgroundColor }, bordered && { borderColor, borderWidth: 1 }, style]} {...otherProps} />;
}
