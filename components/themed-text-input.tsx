import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";
import { TextInput, type TextInputProps } from "react-native";

export function ThemedTextInput({ style, placeholderTextColor, ...rest }: TextInputProps) {
    const {
        text: color,
        textInputBorder: borderColor,
        textInputPlaceholder: placeholderColor,
        backgroundColor,
    } = useThemeColor(["backgroundColor", "text", "textInputBorder", "textInputPlaceholder"]);

    return (
        <TextInput
            style={[
                {
                    backgroundColor,
                    color,
                    borderColor,
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                },
                style,
            ]}
            placeholderTextColor={placeholderTextColor || placeholderColor}
            {...rest}
        />
    );
}
