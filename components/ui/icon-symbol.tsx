import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolView, SymbolWeight } from "expo-symbols";
import { cssInterop } from "nativewind";
import React, { useState } from "react";
import { OpaqueColorValue, Platform, type StyleProp, type TextStyle, View } from "react-native";

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
    weight?: SymbolWeight;
    className?: string;
}

export function IconSymbol({ name, size, color, style, library, weight, className }: IconSymbolProps) {
    const [containerSize, setContainerSize] = useState<number | null>(null);
    const colorScheme = useColorScheme();
    const iconColor = color ?? (colorScheme === "dark" ? "white" : "black");

    const handleLayout = (event: any) => {
        if (size) return;
        const { width, height } = event.nativeEvent.layout;
        const smallestDim = Math.min(width, height);
        if (smallestDim > 0) {
            setContainerSize(smallestDim);
        }
    };

    // If size is provided, use it. If not, use containerSize (auto-fill). Fallback to 24.
    const finalSize = size ?? containerSize ?? 24;

    const iconElement = (() => {
        // On iOS, if the name contains a dot, it's likely an SF Symbol
        if (Platform.OS === "ios" && (name.includes(".") || library === undefined)) {
            if (name.includes(".") || name.includes(".fill")) {
                return (
                    <SymbolView
                        name={name as any}
                        size={finalSize}
                        tintColor={iconColor as any}
                        fallback={renderVectorIcon(name, finalSize, iconColor, library)}
                        style={style as any}
                        weight={weight}
                        className={className}
                    />
                );
            }
        }
        return renderVectorIcon(name, finalSize, iconColor, library, style, className);
    })();

    if (!size) {
        return (
            <View
                onLayout={handleLayout}
                className={`flex-1 items-center justify-center ${className || ""}`}
                style={style as any}
            >
                {iconElement}
            </View>
        );
    }

    return iconElement;
}

function renderVectorIcon(
    name: string,
    size: number,
    color: string | OpaqueColorValue,
    library?: any,
    style?: StyleProp<TextStyle>,
    className?: string,
) {
    const SelectedLibrary = library || MaterialIcons;

    // Mapping for common SF Symbol names to Vector Icons fallback when no library is provided
    if (!library) {
        const mapping: Record<string, { name: string }> = {
            "video.fill": { name: "videocam" },
            "switch.2": { name: "unfold-more-horizontal" },
            "chevron.left": { name: "chevron-left" },
            "chevron.right": { name: "chevron-right" },
            "chevron.up": { name: "expand-less" },
            "chevron.down": { name: "expand-more" },
            "xmark.circle.fill": { name: "cancel" },
        };

        if (mapping[name]) {
            return (
                <MaterialIcons name={mapping[name].name as any} size={size} color={color} style={style} className={className} />
            );
        }
    }

    return <SelectedLibrary name={name as any} size={size} color={color} style={style} className={className} />;
}
