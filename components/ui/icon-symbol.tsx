import { useColorScheme } from "@/hooks/use-color-scheme";
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
import EvilIcons from "@expo/vector-icons/EvilIcons";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Fontisto from "@expo/vector-icons/Fontisto";
import Foundation from "@expo/vector-icons/Foundation";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Octicons from "@expo/vector-icons/Octicons";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import Zocial from "@expo/vector-icons/Zocial";
import { SymbolView, SymbolWeight } from "expo-symbols";
import { cssInterop } from "nativewind";
import React, { useState } from "react";
import { OpaqueColorValue, Platform, type StyleProp, type TextStyle, View } from "react-native";

// https://icons.expo.fyi/Index

const ICON_LIBRARIES = {
    MaterialIcons,
    Ionicons,
    FontAwesome,
    FontAwesome5,
    FontAwesome6,
    MaterialCommunityIcons,
    Feather,
    Octicons,
    AntDesign,
    Entypo,
    EvilIcons,
    Fontisto,
    Foundation,
    SimpleLineIcons,
    Zocial,
};

// Register each library with NativeWind to support className (specifically for text-color)
Object.values(ICON_LIBRARIES).forEach((lib) => {
    cssInterop(lib, {
        className: {
            target: "style",
            nativeStyleToProp: {
                color: true,
            },
        },
    });
});

cssInterop(SymbolView, {
    className: {
        target: "style",
        nativeStyleToProp: {
            color: "tintColor",
        },
    },
});

export type IconLibraryName = keyof typeof ICON_LIBRARIES;

interface IconSymbolProps {
    name: string;
    size?: number;
    color?: string | OpaqueColorValue;
    style?: StyleProp<TextStyle>;
    library?: IconLibraryName;
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
    library?: IconLibraryName,
    style?: StyleProp<TextStyle>,
    className?: string,
) {
    let SelectedLibrary = library ? ICON_LIBRARIES[library] : null;

    if (!SelectedLibrary) {
        // Mapping for common SF Symbol names to Vector Icons fallback
        const mapping: Record<string, { lib: IconLibraryName; name: string }> = {
            "video.fill": { lib: "MaterialIcons", name: "videocam" },
            "switch.2": { lib: "MaterialCommunityIcons", name: "unfold-more-horizontal" },
            "chevron.left": { lib: "MaterialIcons", name: "chevron-left" },
            "chevron.right": { lib: "MaterialIcons", name: "chevron-right" },
            "chevron.up": { lib: "MaterialIcons", name: "expand-less" },
            "chevron.down": { lib: "MaterialIcons", name: "expand-more" },
            "xmark.circle.fill": { lib: "MaterialIcons", name: "cancel" },
        };

        if (mapping[name]) {
            const mapped = mapping[name];
            const Lib = ICON_LIBRARIES[mapped.lib];
            return <Lib name={mapped.name as any} size={size} color={color} style={style} className={className} />;
        }

        // Search in libraries
        for (const libName of Object.keys(ICON_LIBRARIES) as IconLibraryName[]) {
            const lib = ICON_LIBRARIES[libName];
            if ((lib as any).glyphMap && name in (lib as any).glyphMap) {
                SelectedLibrary = lib;
                break;
            }
        }
    }

    const FinalLibrary = SelectedLibrary || MaterialIcons;
    return <FinalLibrary name={name as any} size={size} color={color} style={style} className={className} />;
}
