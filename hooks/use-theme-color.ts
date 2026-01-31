import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function useThemeColor(
    colorNames: keyof typeof Colors.light | (keyof typeof Colors.light)[],
    styleKey?: string,
): Record<string, any> {
    const theme = useColorScheme() ?? "light";

    const themeConfig = Colors[theme];

    // If it's an array, build a style object
    if (Array.isArray(colorNames)) {
        return colorNames.reduce((acc, key) => {
            // Logic: if key is 'background', CSS property is 'backgroundColor'
            const styleKey = key === "background" ? "backgroundColor" : key;

            return {
                ...acc,
                [styleKey]: themeConfig[key as keyof typeof Colors.light],
            };
        }, {});
    }

    return { [styleKey || "colorName"]: themeConfig[colorNames as keyof typeof Colors.light] };
}
