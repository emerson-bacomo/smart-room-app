import { cssInterop } from "nativewind";
import Svg, { Defs, LinearGradient, Path, Rect, Stop, SvgProps } from "react-native-svg";

type Props = {
    className?: string;
} & SvgProps;

cssInterop(Svg, {
    className: {
        target: "style",
    },
});

export function BaselineNoteAdd({ className, ...props }: Props) {
    return (
        <Svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
            <Path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8zm2 14h-3v3h-2v-3H8v-2h3v-3h2v3h3zm-3-7V3.5L18.5 9z" />
        </Svg>
    );
}

export function WhiteKey({ className, ...props }: Props) {
    return (
        <Svg className={className} {...props} viewBox="0 0 40 120" preserveAspectRatio="none">
            <Defs>
                <LinearGradient id="whiteGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#FFFFFF" />
                    <Stop offset="0.9" stopColor="#F2F2F2" />
                    <Stop offset="1" stopColor="#D4D4D4" />
                </LinearGradient>
            </Defs>
            <Rect
                x="0.5"
                y="0.5"
                width="39"
                height="119"
                rx="2"
                fill="url(#whiteGrad)"
                stroke="#E0E0E0"
            />
            <Path d="M1 112 H39 V117 Q39 119 37 119 H3 Q1 119 1 117 Z" fill="#BDBDBD" />
        </Svg>
    );
}

export function BlackKey({ className, ...props }: Props) {
    return (
        <Svg className={className} {...props} viewBox="0 0 24 80" preserveAspectRatio="none">
            <Defs>
                <LinearGradient id="blackGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#444444" />
                    <Stop offset="0.1" stopColor="#222222" />
                    <Stop offset="0.9" stopColor="#111111" />
                    <Stop offset="1" stopColor="#000000" />
                </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="24" height="78" rx="2" fill="url(#blackGrad)" />
            <Rect x="2" y="1" width="20" height="2" rx="1" fill="#666666" fillOpacity="0.3" />
            <Path d="M0 74 H24 V78 Q24 80 22 80 H2 Q0 80 0 78 Z" fill="#000000" />
        </Svg>
    );
}
