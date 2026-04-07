import React, { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Stop } from 'react-native-svg';

type GradientProgressRingProps = {
    size: number;
    strokeWidth: number;
    progressPercent: number;
    trackColor: string;
    startColor: string;
    endColor: string;
    children?: React.ReactNode;
};

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

export function GradientProgressRing({
    size,
    strokeWidth,
    progressPercent,
    trackColor,
    startColor,
    endColor,
    children,
}: GradientProgressRingProps) {
    const gradientId = useId().replace(/[:]/g, '');
    const clampedProgress = clamp(progressPercent, 0, 100);
    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - clampedProgress / 100);

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <Defs>
                    <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={startColor} />
                        <Stop offset="100%" stopColor={endColor} />
                    </LinearGradient>
                </Defs>

                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={trackColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                />

                <G rotation="-90" origin={`${center}, ${center}`}>
                    <Circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke={`url(#${gradientId})`}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset={dashOffset}
                        fill="none"
                    />
                </G>
            </Svg>

            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    content: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
