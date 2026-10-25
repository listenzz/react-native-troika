import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Keyboard, type LayoutChangeEvent } from 'react-native';
import { useRekeyboard } from '../useRekeyboard';

type MockAnimation = { to: number; callback?: (finished: boolean) => void };
const mockAnimations = new Map<MockSharedValue, MockAnimation & { from: number }>();

class MockSharedValue {
	current: number | boolean;
	constructor(value: number | boolean) {
		this.current = value;
	}
	get value() {
		return this.current;
	}
	set value(next: number | boolean | MockAnimation) {
		mockAnimations.delete(this);
		if (typeof next === 'object') {
			mockAnimations.set(this, { ...next, from: Number(this.current) });
		} else {
			this.current = next;
		}
	}
}

jest.mock('react-native-reanimated', () => ({
	Easing: { ease: 'ease', inOut: (easing: unknown) => easing },
	useSharedValue: (value: number | boolean) =>
		require('react').useRef(new MockSharedValue(value)).current,
	useAnimatedStyle: (update: () => unknown) => update,
	interpolate: (value: number, input: number[], output: number[]) => {
		const progress = Math.max(0, Math.min(1, (value - input[0]) / (input[1] - input[0])));
		return output[0] + (output[1] - output[0]) * progress;
	},
	withTiming: (to: number, _config: unknown, callback?: (finished: boolean) => void) => ({
		to,
		callback,
	}),
}));

let hook: ReturnType<typeof useRekeyboard>;
let tree: ReactTestRenderer;

function Harness() {
	hook = useRekeyboard({ bottom: 34 });
	return null;
}

function advanceAnimations(progress: number) {
	for (const [shared, animation] of [...mockAnimations]) {
		shared.current = animation.from + (animation.to - animation.from) * progress;
		if (progress === 1) {
			mockAnimations.delete(shared);
			animation.callback?.(true);
		}
	}
}

function translateY() {
	return (hook.mainStyle as unknown as () => { transform: [{ translateY: number }] })()
		.transform[0].translateY;
}

function layout(height: number): LayoutChangeEvent {
	return { nativeEvent: { layout: { height, width: 390, x: 0, y: 0 } } } as LayoutChangeEvent;
}

beforeEach(() => {
	mockAnimations.clear();
	jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
	act(() => {
		tree = create(<Harness />);
	});
	hook.onEmojiLayout(layout(334));
	hook.onToolboxLayout(layout(234));
});

afterEach(() => {
	act(() => tree.unmount());
	jest.restoreAllMocks();
});

it('tracks the keyboard frame while subtracting the bottom safe area only once', () => {
	expect(translateY()).toBe(0);
	hook.onStatusChanged({ height: 300, shown: true, transitioning: true });
	hook.onPositionChanged({ position: 100 });
	expect(translateY()).toBeCloseTo(-66);
	hook.onPositionChanged({ position: 300 });
	expect(translateY()).toBeCloseTo(-266);
	hook.onStatusChanged({ height: 300, shown: false, transitioning: true });
	hook.onPositionChanged({ position: 150 });
	expect(translateY()).toBeCloseTo(-116);
	hook.onPositionChanged({ position: 0 });
	expect(translateY()).toBe(0);
});

it('can close a panel during a keyboard-to-panel transition without jumping', () => {
	hook.onStatusChanged({ height: 300, shown: true, transitioning: false });
	hook.onPositionChanged({ position: 300 });
	hook.showPanel('toolbox');
	hook.onStatusChanged({ height: 300, shown: false, transitioning: false });
	hook.onPositionChanged({ position: 0 });
	advanceAnimations(0.5);
	const beforeClosing = translateY();
	expect(beforeClosing).toBeCloseTo(-233);
	hook.hidePanel('toolbox');
	expect(translateY()).toBeCloseTo(beforeClosing);
	advanceAnimations(1);
	expect(translateY()).toBe(0);
});

it('switches between panels and back to the keyboard without resetting the input bar', () => {
	hook.showPanel('emoji');
	advanceAnimations(1);
	expect(translateY()).toBeCloseTo(-300);
	hook.showPanel('toolbox');
	expect(translateY()).toBeCloseTo(-300);
	advanceAnimations(1);
	expect(translateY()).toBeCloseTo(-200);
	hook.onStatusChanged({ height: 300, shown: true, transitioning: true });
	hook.onPositionChanged({ position: 0 });
	expect(translateY()).toBeCloseTo(-200);
	hook.onPositionChanged({ position: 300 });
	expect(translateY()).toBeCloseTo(-266);
});
