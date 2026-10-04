import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    type SharedValue,
} from 'react-native-reanimated';
import { demoTheme } from '../DemoKit';

interface PageIndicatorProps {
    labels: readonly string[];
    /** 受控页码，与轮播、Previous/Next 共用同一个值。 */
    index: number;
    /** 轮播的实时页进度，例如 0.5 表示第一页与第二页之间；不以 index 替代手势进度。 */
    progress: SharedValue<number>;
    /** 不传时只展示进度，不增加翻页操作。 */
    onChange?: (index: number) => void;
    activeColor?: string;
    inactiveColor?: string;
    style?: StyleProp<ViewStyle>;
    testID?: string;
}

/** 公共分页点：宽度和颜色直接跟随轮播进度，页码与翻页操作仍由调用方负责。 */
export default function PageIndicator({
    labels,
    index,
    progress,
    onChange,
    activeColor = demoTheme.colors.indigo,
    inactiveColor = demoTheme.colors.line,
    style,
    testID,
}: PageIndicatorProps) {
    return (
        <View testID={testID} style={[styles.row, style]}>
            {labels.map((label, i) => (
                <PageDot
                    key={i}
                    label={label}
                    page={i}
                    selected={index === i}
                    progress={progress}
                    lastPage={labels.length - 1}
                    onChange={onChange}
                    activeColor={activeColor}
                    inactiveColor={inactiveColor}
                    id={testID && `${testID}-${i}`}
                />
            ))}
        </View>
    );
}

function PageDot({
    label,
    page,
    selected,
    progress,
    lastPage,
    onChange,
    activeColor,
    inactiveColor,
    id,
}: {
    label: string;
    page: number;
    selected: boolean;
    progress: SharedValue<number>;
    lastPage: number;
    onChange?: (index: number) => void;
    activeColor: string;
    inactiveColor: string;
    id?: string;
}) {
    const animatedStyle = useAnimatedStyle(() => {
        const position = Math.max(0, Math.min(lastPage, progress.value));
        const emphasis = Math.max(0, 1 - Math.abs(position - page));
        return {
            width: 4 + 8 * emphasis,
            backgroundColor: interpolateColor(
                emphasis,
                [0, 1],
                [inactiveColor, activeColor]
            ),
        };
    });
    const dot = <Animated.View style={[styles.dot, animatedStyle]} />;

    if (!onChange) {
        return <View testID={id}>{dot}</View>;
    }
    return (
        <Pressable
            testID={id}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            onPress={() => {
                if (!selected) onChange(page);
            }}
            hitSlop={10}>
            {dot}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: 4, justifyContent: 'center' },
    dot: { height: 4, borderRadius: 2 },
});
