import { useRef, type ComponentType } from 'react';

/** Jest 没有 UI worklet 运行时；保留真实分页组件及其受控交互，仅替代动画驱动。 */
export default {
    View: 'AnimatedView',
    createAnimatedComponent: <T extends object>(component: ComponentType<T>) => component,
};
export const useSharedValue = <T>(value: T) => useRef({ value }).current;
export const useAnimatedStyle = jest.fn((factory: () => unknown) => factory());
export const withTiming = jest.fn((value: number) => value);
export const interpolateColor = jest.fn((value: number, _input: number[], output: string[]) =>
    output[value === 0 ? 0 : 1]
);
export const useEvent = (handler: (event: object) => void, events: string[]) =>
    (event: { nativeEvent?: object }) => handler({
        ...(event.nativeEvent ?? event),
        eventName: events[0],
    });

export const Easing = { bezier: jest.fn() };
export const cancelAnimation = jest.fn();
export const runOnJS = (callback: unknown) => callback;
export const useAnimatedReaction = jest.fn();

export const useDerivedValue = (factory: () => number) => {
    const latest = useRef(factory);
    latest.current = factory;
    return useRef({ get value() { return latest.current(); } }).current;
};
