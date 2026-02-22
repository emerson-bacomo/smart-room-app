import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolView } from "expo-symbols";
import { cssInterop } from "nativewind";
import React from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

// https://icons.expo.fyi/Index

// Register MaterialIcons (fallback) with NativeWind to support className (specifically for text-color)
cssInterop(MaterialIcons, {
    className: {
        target: "style",
        nativeStyleToProp: {
            color: true,
        },
    },
});

cssInterop(SymbolView, {
    className: {
        target: "style",
        nativeStyleToProp: {
            color: "tintColor",
        },
    },
});

interface IconSymbolProps {
    name: string;
    size?: number;
    color?: string | OpaqueColorValue;
    style?: StyleProp<TextStyle>;
    library?: any;
    className?: string;
}

export function IconSymbol({ name, size, color, style, library, className }: IconSymbolProps) {
    const colorScheme = useColorScheme();
    const iconColor = color ?? (colorScheme === "dark" ? "white" : "black");

    // If size is provided, use it. If not, use containerSize (auto-fill). Fallback to 16.
    const finalSize = size ?? 24;
    const SelectedLibrary = library || MaterialIcons;

    if (!library) {
        return <MaterialIcons name={name as any} size={finalSize} color={iconColor} style={style} className={className} />;
    }

    return <SelectedLibrary name={name as any} size={finalSize} color={iconColor} style={style} className={className} />;
}
