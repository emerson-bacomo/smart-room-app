import { cva, type VariantProps } from "class-variance-authority";
import React, { useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleProp, Text, TextStyle, View, ViewStyle } from "react-native";
import { twMerge } from "tailwind-merge";

const buttonCVA = cva("relative rounded-lg", {
    variants: {
        layout: {
            default: "flex-row items-center justify-center px-4 py-2",
            plain: "",
        },
        variant: {
            cta: "bg-blue-500",
            outline: "border border-gray-400",
            danger: "bg-red-500",
            none: "",
        },
        hoverScale: {
            normal: "",
            104: "",
            big: "",
            bigger: "",
        },
        height: {
            none: "h-10",
            tall: "h-12",
        },
    },
    defaultVariants: {
        layout: "default",
        variant: "cta",
        hoverScale: "normal",
        height: "none",
    },
});

export interface ButtonProps extends React.PropsWithChildren<VariantProps<typeof buttonCVA>> {
    label?: string;
    icon?: ReactNode;
    onclick?: (setLoading: React.Dispatch<React.SetStateAction<boolean>>) => void;
    style?: StyleProp<ViewStyle>;
    labelStyle?: StyleProp<TextStyle>;
    className?: string;
    labelClassName?: string;
    disabled?: boolean;
    toggleColorClassName?: string;
    toggleValue?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    icon,
    label,
    children,
    layout,
    variant,
    hoverScale,
    height,
    onclick,
    labelStyle,
    className,
    labelClassName,
    toggleColorClassName = "bg-white/30",
    toggleValue,
    ...props
}) => {
    const [isLoading, setLoading] = useState(false);

    const handlePress = () => {
        onclick?.(setLoading);
    };

    return (
        <Pressable
            className={twMerge(
                buttonCVA({ layout, variant, hoverScale, height }),
                toggleValue && toggleColorClassName,
                className,
            )}
            disabled={isLoading}
            onPress={handlePress}
            {...props}
        >
            {icon && <View className={twMerge(label && "mr-2")}>{icon}</View>}

            {label && (
                <Text style={labelStyle} className={twMerge("text-white", labelClassName)}>
                    {label}
                </Text>
            )}

            {children}

            {isLoading && (
                <View className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-black/30">
                    <ActivityIndicator color="white" />
                </View>
            )}
        </Pressable>
    );
};
