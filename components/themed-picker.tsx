import { Picker, type PickerProps } from "@react-native-picker/picker";
import React from "react";
import { twMerge } from "tailwind-merge";

import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

export type ThemedPickerProps = PickerProps & {
    className?: string;
};

export function ThemedPicker({ style, className, ...rest }: ThemedPickerProps) {
    const {
        text: color,
        textInputBorder: borderColor,
        backgroundColor,
    } = useThemeColor(["backgroundColor", "text", "textInputBorder"]);

    return (
        <ThemedView
            style={[
                {
                    backgroundColor,
                    borderColor,
                    borderWidth: 1,
                    borderRadius: 12,
                },
            ]}
            className={twMerge("rounded-xl overflow-hidden justify-center", className)}
        >
            <Picker style={[{ color }, style]} dropdownIconColor={color} {...rest} />
        </ThemedView>
    );
}

ThemedPicker.Item = Picker.Item;
