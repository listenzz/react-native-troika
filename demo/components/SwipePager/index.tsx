import React from 'react';
import { Dimensions, LayoutChangeEvent, PixelRatio, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    cancelAnimation,
    Easing,
    runOnJS,
    useAnimatedReaction,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming,
    type SharedValue,
} from 'react-native-reanimated';

import { hapticTick } from './haptic';
import {
    EDGE_RESISTANCE,
    PAGER_PEEK,
    PAGER_SWIPE_SLOP,
    resolveTargetPage,
    resolvePagerAxis,
    snapOffset,
} from './swipePagerGesture';

const PIXEL_RATIO = PixelRatio.get();
const PAGER_SNAP_TIMING = { duration: 280, easing: Easing.bezier(0.25, 1, 0.5, 1) };

interface SwipePagerProps {
    pageCount: number;
    /** cards 保留相邻卡片露出及内容高度；pages 裁切整页，调用方提供容器高度。 */
    variant?: 'cards' | 'pages';
    /** 可选受控目标页；按钮、分页点修改 index 即可带动画切换。 */
    index?: number;
    /** 非受控用法的初页；仅在挂载时生效。 */
    initialIndex?: number;
    /** cards 模式的相邻页露出、两端留白与卡片间距；pages 模式统一为 0。 */
    peek?: number;
    pageInset?: number;
    pageGap?: number;
    /** pages 模式离场缩放比例；默认 1，不缩放。无间隙图卡可传 0.94。 */
    inactivePageScale?: number;
    /** 手势选中另一页时回调；拖动进度与程序跳页不重复回调。 */
    onPageSelected?: (index: number) => void;
    /** 与内容同源的实时页进度，涵盖拖动、吸附、按钮切换及取消回弹。 */
    progress?: SharedValue<number>;
    haptic?: boolean;
    style?: StyleProp<ViewStyle>;
    testID?: string;
    renderPage: (index: number, pageWidth: number) => React.ReactNode;
}

/**
 * 共用 Pan + Reanimated 位移驱动卡片和整页轮播。默认保留首页几何：
 * 页宽 P = 容器宽 − peek − 2 × pageInset，停靠步长 P + pageGap − peek。
 * 跟手、分页点和吸附动画共用 UI 线程位移；业务页码仅在松手选页时同步。
 */
export default function SwipePager({
    pageCount,
    variant = 'cards',
    index,
    initialIndex = 0,
    peek: cardPeek = PAGER_PEEK,
    pageInset: cardInset = 0,
    pageGap: cardGap = 0,
    inactivePageScale = 1,
    onPageSelected,
    progress,
    haptic = true,
    style,
    testID,
    renderPage,
}: SwipePagerProps) {
    const fullPage = variant === 'pages';
    const peek = fullPage ? 0 : cardPeek;
    const pageInset = fullPage ? 0 : cardInset;
    const pageGap = fullPage ? 0 : cardGap;
    const lastPage = Math.max(0, pageCount - 1);
    const firstIndex = React.useRef(Math.max(0, Math.min(index ?? initialIndex, lastPage))).current;
    const [containerWidth, setContainerWidth] = React.useState(() => Dimensions.get('window').width);
    const pageWidth = Math.max(0, containerWidth - peek - pageInset * 2);
    const pageWidthValue = useSharedValue(pageWidth);
    const pageIndexValue = useSharedValue(firstIndex);
    const translate = useSharedValue(-snapOffset(firstIndex, pageWidth, peek, pageGap));
    const gestureStart = useSharedValue(0);
    const touchStart = useSharedValue({ x: 0, y: 0 });
    const axisResolved = useSharedValue(false);
    const gesturePage = useSharedValue(firstIndex);
    const gestureActive = useSharedValue(false);
    // 防止已排队的 JS 松手回调覆盖新手势、按钮翻页或旋转后的停靠点。
    const gestureEpoch = useSharedValue(0);

    const position = useDerivedValue(() => {
        const step = pageWidthValue.value + pageGap - peek;
        return step > 0 ? Math.max(0, Math.min(lastPage, -translate.value / step)) : 0;
    });
    useAnimatedReaction(
        () => position.value,
        value => {
            if (progress) progress.value = value;
        }
    );

    const selectedRef = React.useRef(onPageSelected);
    selectedRef.current = onPageSelected;
    const hapticRef = React.useRef(haptic);
    hapticRef.current = haptic;

    const onLayout = (e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width);

    const finishGesture = React.useCallback(
        (translationX: number, velocityX: number, origin: number, epoch: number) => {
            if (epoch !== gestureEpoch.value) return;
            const width = pageWidthValue.value;
            const target = resolveTargetPage({
                pageIndex: origin,
                pageCount,
                translationX,
                velocityX,
                pageWidth: width,
                pixelRatio: PIXEL_RATIO,
            });
            const changed = target !== pageIndexValue.value;
            pageIndexValue.value = target;
            translate.value = withTiming(-snapOffset(target, width, peek, pageGap), PAGER_SNAP_TIMING);
            if (changed) {
                if (hapticRef.current) hapticTick();
                selectedRef.current?.(target);
            }
        },
        [pageCount, peek, pageGap, pageWidthValue, pageIndexValue, translate, gestureEpoch]
    );

    // 实测、旋转或页数变化后直接对齐，避免继承旧尺寸下的动画目标。
    React.useEffect(() => {
        gestureEpoch.value += 1;
        gestureActive.value = false;
        cancelAnimation(translate);
        pageWidthValue.value = pageWidth;
        pageIndexValue.value = Math.min(pageIndexValue.value, lastPage);
        translate.value = -snapOffset(pageIndexValue.value, pageWidth, peek, pageGap);
        return () => {
            gestureEpoch.value += 1;
            gestureActive.value = false;
            cancelAnimation(translate);
        };
    }, [pageWidthValue, pageIndexValue, pageWidth, lastPage, peek, pageGap, translate, gestureEpoch, gestureActive]);

    React.useEffect(() => {
        if (index === undefined) return;
        const target = Math.max(0, Math.min(index, lastPage));
        // 父层回写手势选页时不重启动画，也不打断正在进行的下一次手势。
        if (target === pageIndexValue.value) return;
        gestureEpoch.value += 1;
        gestureActive.value = false;
        cancelAnimation(translate);
        pageIndexValue.value = target;
        translate.value = withTiming(-snapOffset(target, pageWidthValue.value, peek, pageGap), PAGER_SNAP_TIMING);
    }, [index, lastPage, peek, pageGap, pageWidthValue, pageIndexValue, translate, gestureEpoch, gestureActive]);

    const pan = React.useMemo(
        () => Gesture.Pan()
            .enabled(pageCount > 1)
            .manualActivation(true)
            .onTouchesDown(event => {
                if (event.numberOfTouches !== 1) return;
                const touch = event.allTouches[0];
                if (!touch) return;
                touchStart.value = { x: touch.absoluteX, y: touch.absoluteY };
                axisResolved.value = false;
            })
            .onTouchesMove((event, manager) => {
                if (axisResolved.value) return;
                const touch = event.allTouches[0];
                if (!touch) return;
                const axis = resolvePagerAxis(
                    touch.absoluteX - touchStart.value.x,
                    touch.absoluteY - touchStart.value.y,
                    PAGER_SWIPE_SLOP
                );
                if (axis === 'pending') return;
                axisResolved.value = true;
                if (axis === 'horizontal') manager.activate();
                else manager.fail();
            })
            .onStart(() => {
                // 仅横向手势激活才打断吸附；普通点击和纵向滚动不受影响。
                cancelAnimation(translate);
                gestureEpoch.value += 1;
                gestureActive.value = true;
                gestureStart.value = translate.value;
                const step = pageWidthValue.value + pageGap - peek;
                gesturePage.value = step > 0
                    ? Math.max(0, Math.min(lastPage, Math.round(-translate.value / step)))
                    : 0;
            })
            .onUpdate(evt => {
                if (!gestureActive.value) return;
                const min = -lastPage * (pageWidthValue.value + pageGap - peek);
                const raw = gestureStart.value + evt.translationX;
                const clamped = Math.min(0, Math.max(min, raw));
                translate.value = clamped + (raw - clamped) * EDGE_RESISTANCE;
            })
            .onEnd(evt => {
                if (!gestureActive.value) return;
                gestureActive.value = false;
                const step = pageWidthValue.value + pageGap - peek;
                runOnJS(finishGesture)(
                    gestureStart.value + evt.translationX + gesturePage.value * step,
                    evt.velocityX,
                    gesturePage.value,
                    gestureEpoch.value
                );
            })
            .onFinalize(() => {
                if (!gestureActive.value) return;
                gestureActive.value = false;
                translate.value = withTiming(
                    -pageIndexValue.value * (pageWidthValue.value + pageGap - peek),
                    PAGER_SNAP_TIMING
                );
            }),
        [finishGesture, gestureActive, gestureEpoch, gesturePage, gestureStart,
            pageWidthValue, pageIndexValue, pageCount, lastPage, peek, pageGap, translate,
            touchStart, axisResolved]
    );

    const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translate.value }] }));

    return (
        <GestureDetector gesture={pan}>
            <View onLayout={onLayout} testID={testID} style={[fullPage && styles.viewport, style]}>
                {pageWidth > 0 && (
                    <Animated.View
                        style={[styles.row, fullPage && styles.fillHeight,
                            { paddingHorizontal: pageInset, gap: pageGap }, rowStyle]}
                        collapsable={false}>
                        {Array.from({ length: pageCount }).map((_, i) => fullPage ? (
                            <FullPage key={i} index={i} width={pageWidth}
                                position={position} inactiveScale={inactivePageScale}>
                                {renderPage(i, pageWidth)}
                            </FullPage>
                        ) : <React.Fragment key={i}>{renderPage(i, pageWidth)}</React.Fragment>)}
                    </Animated.View>
                )}
            </View>
        </GestureDetector>
    );
}

/** 缩放仅改变呈现，不参与布局和停靠几何；静止的当前图卡保持原尺寸。 */
function FullPage({
    index, width, position, inactiveScale, children,
}: {
    index: number;
    width: number;
    position: SharedValue<number>;
    inactiveScale: number;
    children: React.ReactNode;
}) {
    const animatedStyle = useAnimatedStyle(() => {
        const distance = Math.min(1, Math.abs(position.value - index));
        const minScale = Math.max(0, Math.min(1, inactiveScale));
        return { transform: [{ scale: 1 - distance * (1 - minScale) }] };
    });
    return (
        <Animated.View style={[styles.fullPage, { width }, animatedStyle]}>
            {children}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    viewport: { overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'stretch' },
    fillHeight: { height: '100%' },
    fullPage: { height: '100%', flexShrink: 0 },
});
