import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

type Props = {
    children: React.ReactNode;
    expanded: boolean;
    duration?: number;
};

export default function Collapsible({ children, expanded, duration = 300 }: Props) {
    const [contentHeight, setContentHeight] = useState(0);
    const height = useSharedValue(0);

    const onLayout = (event: any) => {
        const onLayoutHeight = event.nativeEvent.layout.height;
        if (onLayoutHeight > 0 && Math.round(onLayoutHeight) !== Math.round(contentHeight)) {
            setContentHeight(onLayoutHeight);
        }
    };

    useEffect(() => {
        height.value = withTiming(expanded ? contentHeight : 0, {
            duration,
            easing: Easing.inOut(Easing.ease),
        });
    }, [contentHeight, duration, expanded, height]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            height: height.value,
        };
    });

    return (
        <Animated.View style={[styles.overflowHidden, animatedStyle]}>
            <View style={styles.absoluteContainer} onLayout={onLayout}>
                {children}
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overflowHidden: {
        overflow: 'hidden',
    },
    absoluteContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
});
