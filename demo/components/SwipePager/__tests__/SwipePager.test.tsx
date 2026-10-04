import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { StyleSheet, View } from 'react-native';
import { runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import SwipePager from '../index';

jest.mock('react-native-drop-shadow', () => ({ __esModule: true, default: 'DropShadow' }));
jest.mock('../haptic', () => ({ hapticTick: jest.fn() }));
jest.mock('react-native-gesture-handler', () => ({
    GestureDetector: 'GestureDetector',
    Gesture: {
        Pan: () => ({
            enabled: jest.fn().mockReturnThis(),
            manualActivation: jest.fn().mockReturnThis(),
            onTouchesDown: jest.fn().mockReturnThis(),
            onTouchesMove: jest.fn().mockReturnThis(),
            onStart: jest.fn().mockReturnThis(),
            onUpdate: jest.fn().mockReturnThis(),
            onEnd: jest.fn().mockReturnThis(),
            onFinalize: jest.fn().mockReturnThis(),
        }),
    },
}));
jest.mock('react-native-reanimated', () => ({
    __esModule: true,
    ...require('../testUtils/pageIndicatorAnimationMock'),
    Easing: { bezier: jest.fn() },
    cancelAnimation: jest.fn(),
    runOnJS: jest.fn((callback: unknown) => callback),
    useAnimatedReaction: jest.fn(),
}));

let tree: ReactTestRenderer;
let progress: SharedValue<number>;
const selected = jest.fn();
type PagerProps = Partial<React.ComponentProps<typeof SwipePager>>;
function Fixture(props: PagerProps = {}) {
    progress = useSharedValue(0);
    return <SwipePager pageCount={2} pageInset={12} pageGap={12} progress={progress}
        onPageSelected={selected}
        renderPage={(index, width) => <View testID={`page-${index}`} style={{ width }} />}
        {...props} />;
}
function update(props: PagerProps) {
    act(() => tree.update(<Fixture {...props} />));
    frame();
}
function layout(width: number) {
    const container = tree.root.findAll(node => typeof node.props.onLayout === 'function')[0];
    act(() => container.props.onLayout({ nativeEvent: { layout: { width } } }));
    frame();
}
const rowStyle = () => jest.mocked(useAnimatedStyle).mock.calls
    .map(([factory]) => factory()).reverse().find(style =>
        Array.isArray(style.transform) && style.transform.some(item => 'translateX' in item));
const scales = () => jest.mocked(useAnimatedStyle).mock.calls
    .flatMap(([factory]) => {
        const transform = factory().transform;
        return Array.isArray(transform) ? transform.flatMap(item =>
            'scale' in item && typeof item.scale === 'number' ? [item.scale] : []) : [];
    }).slice(-2);
const pan = () => tree.root.findByType('GestureDetector' as React.ElementType).props.gesture;
function frame() {
    const [prepare, react] = jest.mocked(useAnimatedReaction).mock.calls.at(-1)!;
    act(() => react(prepare(), null));
}
function gesture(name: string, translationX = 0, velocityX = 0) {
    act(() => pan()[name].mock.calls.at(-1)[0]({ translationX, velocityX }));
    frame();
}
beforeEach(() => {
    jest.clearAllMocks();
    act(() => { tree = create(<Fixture />); });
    layout(375);
});
afterEach(() => act(() => tree.unmount()));

it('reports fractional pan progress before release and follows reversal and cancellation', () => {
    gesture('onStart');
    gesture('onUpdate', -160.5);
    expect(progress.value).toBe(0.5); // 330pt card + 12pt gap - 21pt peek = 321pt step.
    gesture('onUpdate', -64.2);
    expect(progress.value).toBeCloseTo(0.2);
    expect(selected).not.toHaveBeenCalled();
    gesture('onFinalize');
    expect(progress.value).toBe(0);
    expect(selected).not.toHaveBeenCalled();
});

it('shares the snap destination and keeps end overscroll within the indicator range', () => {
    gesture('onStart');
    gesture('onUpdate', 100);
    expect(progress.value).toBe(0);
    gesture('onUpdate', -200);
    gesture('onEnd', -200);
    gesture('onFinalize');
    expect(progress.value).toBe(1);
    expect(selected).toHaveBeenLastCalledWith(1);
    gesture('onStart');
    gesture('onUpdate', -100);
    expect(progress.value).toBe(1);
    gesture('onFinalize');
    expect(progress.value).toBe(1);
});

it('full pages fill the measured viewport and buttons animate the same progress without reselecting', () => {
    update({ variant: 'pages', index: 0, pageCount: 3, style: { height: 200 }, testID: 'pager' });
    const viewport = tree.root.findAllByType(View).find(node => node.props.testID === 'pager')!;
    expect(StyleSheet.flatten(viewport.props.style)).toMatchObject({ height: 200, overflow: 'hidden' });
    expect(StyleSheet.flatten(tree.root.findAllByProps({ testID: 'page-0' })[0].props.style).width).toBe(375);
    gesture('onStart');
    gesture('onUpdate', -187.5);
    expect(progress.value).toBe(0.5);
    gesture('onFinalize');
    jest.mocked(withTiming).mockClear();
    update({ variant: 'pages', index: 2, pageCount: 3 });
    expect(withTiming).toHaveBeenCalledWith(-750, expect.objectContaining({ duration: 280 }));
    expect(progress.value).toBe(2);
    expect(selected).not.toHaveBeenCalled();
    update({ variant: 'pages', index: 0, pageCount: 3 });
    expect(progress.value).toBe(0);
});

it('opens at the requested page, keeps it on resize, and clamps when pages are removed', () => {
    act(() => tree.unmount());
    act(() => { tree = create(<Fixture variant="pages" initialIndex={2} pageCount={3} />); });
    layout(319);
    expect(progress.value).toBe(2);
    expect(rowStyle()).toEqual({ transform: [{ translateX: -638 }] });
    layout(420);
    expect(progress.value).toBe(2);
    expect(rowStyle()).toEqual({ transform: [{ translateX: -840 }] });
    update({ variant: 'pages', initialIndex: 0, pageCount: 3 });
    expect(progress.value).toBe(2); // initialIndex is mount-only.
    update({ variant: 'pages', pageCount: 1 });
    expect(progress.value).toBe(0);
    expect(pan().enabled).toHaveBeenLastCalledWith(false);
    expect(selected).not.toHaveBeenCalled();
});

it('parent echoes and unrelated rerenders keep the active gesture and snap animation intact', () => {
    update({ variant: 'pages', index: 0 });
    const originalPan = pan();
    gesture('onStart');
    gesture('onUpdate', -200);
    gesture('onEnd', -200);
    expect(selected).toHaveBeenCalledTimes(1);
    expect(selected).toHaveBeenLastCalledWith(1);
    jest.mocked(withTiming).mockClear();
    update({ variant: 'pages', index: 1, onPageSelected: next => selected(next) });
    expect(pan()).toBe(originalPan);
    expect(withTiming).not.toHaveBeenCalled();
    gesture('onStart');
    gesture('onUpdate', 75);
    update({ variant: 'pages', index: 1 });
    expect(progress.value).toBeCloseTo(0.8);
    expect(pan()).toBe(originalPan);
    gesture('onFinalize');
    expect(progress.value).toBe(1);
});

it('an interrupted button animation can reverse from its current position', () => {
    update({ variant: 'pages', index: 0 });
    // Simulate the animation halfway through; the next pan must use the displayed offset.
    jest.mocked(withTiming).mockImplementationOnce(() => -187.5);
    update({ variant: 'pages', index: 1 });
    expect(progress.value).toBe(0.5);
    gesture('onStart');
    gesture('onUpdate', 112.5);
    expect(progress.value).toBeCloseTo(0.2);
    gesture('onEnd', 112.5);
    expect(progress.value).toBe(0);
    expect(selected).toHaveBeenLastCalledWith(0);
});

it.each(['new drag', 'button', 'resize'] as const)('ignores a queued release superseded by %s', change => {
    update({ variant: 'pages', index: 0, pageCount: 3 });
    let release: (() => void) | undefined;
    jest.mocked(runOnJS).mockImplementationOnce(callback => (...args: unknown[]) => {
        release = () => callback(...args);
    });
    gesture('onStart');
    gesture('onUpdate', -220);
    gesture('onEnd', -220);
    if (change === 'new drag') {
        gesture('onStart');
        gesture('onUpdate', 100);
    } else if (change === 'button') {
        update({ variant: 'pages', index: 2, pageCount: 3 });
    } else {
        layout(500);
    }
    const currentProgress = progress.value;
    act(() => release?.());
    frame();
    expect(progress.value).toBe(currentProgress);
    expect(selected).not.toHaveBeenCalled();
});

it('a button can take over a drag without a late update or cancellation undoing it', () => {
    update({ variant: 'pages', index: 0, pageCount: 3 });
    gesture('onStart');
    gesture('onUpdate', -80);
    update({ variant: 'pages', index: 2, pageCount: 3 });
    gesture('onUpdate', -180);
    gesture('onEnd', -180);
    gesture('onFinalize');
    expect(progress.value).toBe(2);
    expect(selected).not.toHaveBeenCalled();
});

it('gapless illustration cards scale continuously with pan, reversal, cancellation and button animation', () => {
    update({ variant: 'pages', index: 0, inactivePageScale: 0.94 });
    expect(scales()).toEqual([1, 0.94]);
    gesture('onStart');
    gesture('onUpdate', -187.5);
    expect(progress.value).toBe(0.5);
    expect(scales()).toEqual([0.97, 0.97]);
    gesture('onUpdate', -75);
    expect(scales()).toEqual([0.988, 0.952]);
    gesture('onFinalize');
    expect(scales()).toEqual([1, 0.94]);
    jest.mocked(withTiming).mockImplementationOnce(() => -187.5);
    update({ variant: 'pages', index: 1, inactivePageScale: 0.94 });
    expect(scales()).toEqual([0.97, 0.97]);
    layout(400); // Settling / resizing restores the selected card to its full dimensions.
    expect(scales()).toEqual([0.94, 1]);
    gesture('onStart');
    gesture('onUpdate', -100);
    expect(scales()).toEqual([0.94, 1]);
});

it('full-page carousels with existing gutters do not scale unless opted in', () => {
    update({ variant: 'pages' });
    gesture('onStart');
    gesture('onUpdate', -187.5);
    expect(scales()).toEqual([1, 1]);
});

it('closing the carousel invalidates a queued page selection', () => {
    let release: (() => void) | undefined;
    jest.mocked(runOnJS).mockImplementationOnce(callback => (...args: unknown[]) => {
        release = () => callback(...args);
    });
    gesture('onStart');
    gesture('onUpdate', -200);
    gesture('onEnd', -200);
    act(() => tree.unmount());
    act(() => release?.());
    expect(selected).not.toHaveBeenCalled();
});

it.each([
    [24, 16, 'horizontal'], [-24, -16, 'horizontal'],
    [16, 24, 'vertical'], [-16, -24, 'vertical'], [20, 20, 'vertical'],
] as const)('locks the dominant axis for diagonal movement (%s, %s)', (x, y, axis) => {
    const manager = { activate: jest.fn(), fail: jest.fn() };
    const touch = (dx: number, dy: number) => ({
        numberOfTouches: 1, allTouches: [{ absoluteX: 100 + dx, absoluteY: 200 + dy }],
    });
    const down = pan().onTouchesDown.mock.calls.at(-1)[0];
    const move = pan().onTouchesMove.mock.calls.at(-1)[0];
    act(() => down(touch(0, 0)));
    act(() => move(touch(4, 3), manager));
    expect(manager.activate).not.toHaveBeenCalled();
    expect(manager.fail).not.toHaveBeenCalled();
    act(() => move(touch(x, y), manager));
    expect(manager.activate).toHaveBeenCalledTimes(axis === 'horizontal' ? 1 : 0);
    expect(manager.fail).toHaveBeenCalledTimes(axis === 'vertical' ? 1 : 0);
    // Later cross-axis motion must not hand an active touch stream to the other owner.
    act(() => move(touch(y * 3, x * 3), manager));
    expect(manager.activate).toHaveBeenCalledTimes(axis === 'horizontal' ? 1 : 0);
    expect(manager.fail).toHaveBeenCalledTimes(axis === 'vertical' ? 1 : 0);
    expect(selected).not.toHaveBeenCalled();
    // The next touch starts a fresh decision, including vertical -> horizontal transitions.
    act(() => down(touch(0, 0)));
    act(() => move(touch(30, 1), manager));
    expect(manager.activate).toHaveBeenCalledTimes(axis === 'horizontal' ? 2 : 1);
});
