import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function useThemeColor(
    colorNames: keyof typeof Colors.light | (keyof typeof Colors.light)[],
    styleKey?: string,
    opposite?: boolean,
): Record<string, any> {
    let theme = useColorScheme() ?? "light";
    if (opposite) {
        theme = theme === "light" ? "dark" : "light";
    }

    const themeConfig = Colors[theme];

    // If it's an array, build a style object
    if (Array.isArray(colorNames)) {
        return colorNames.reduce(
            (acc, key) => ({
                ...acc,
                [key]: themeConfig[key as keyof typeof Colors.light],
            }),
            {},
        );
    }

    return { [styleKey || colorNames]: themeConfig[colorNames as keyof typeof Colors.light] };
}
