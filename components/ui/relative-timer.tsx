import { formatRelativeTime } from "@/utilities/time";
import React, { useEffect, useState } from "react";
import { StyleProp, TextStyle } from "react-native";
import { ThemedText } from "../themed-text";

interface RelativeTimerProps {
    timestamp: string | number | Date | undefined;
    style?: StyleProp<TextStyle>;
    className?: string;
    /**
     * If true, shows only the highest component (e.g., 1h instead of 1h 2m)
     * For now, our formatRelativeTime is quite simple, but we can expand it.
     */
    simple?: boolean;
}

export function RelativeTimer({ timestamp, style, className, simple = false }: RelativeTimerProps) {
    const [displayText, setDisplayText] = useState(() => formatRelativeTime(timestamp));

    useEffect(() => {
        // Initial sync
        setDisplayText(formatRelativeTime(timestamp));

        const interval = setInterval(() => {
            setDisplayText(formatRelativeTime(timestamp));
        }, 1000);

        return () => clearInterval(interval);
    }, [timestamp]);

    return (
        <ThemedText style={style} className={className}>
            {displayText}
        </ThemedText>
    );
}
