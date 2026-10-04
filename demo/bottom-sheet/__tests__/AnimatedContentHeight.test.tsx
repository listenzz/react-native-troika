import React from 'react';
import { StyleSheet, View } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { SharedValue, withTiming, cancelAnimation } from 'react-native-reanimated';
import { AnimatedContentHeight, ContentHeightPhase } from '../AnimatedContentHeight';
import { BottomSheetContent, contentHeightLimit } from '../BottomSheetContent';

let mockReaction: () => void;
let mockHeight: { value: number };
let mockSharedIndex = 0;
jest.mock('react-native-reanimated', () => ({
	__esModule: true,
	default: { View: 'AnimatedView' },
	Easing: { out: (value: unknown) => value, cubic: 'cubic' },
	useSharedValue: (initial: unknown) => {
		const value = require('react').useRef({ value: initial }).current;
		if (mockSharedIndex++ % 3 === 1) mockHeight = value;
		return value;
	},
	useAnimatedStyle: (fn: () => object) => fn(),
	useAnimatedReaction: (
		prepare: () => unknown,
		react: (next: unknown, prev: unknown) => void,
	) => {
		const previous = require('react').useRef(null);
		mockReaction = () => {
			const next = prepare();
			react(next, previous.current);
			previous.current = next;
		};
	},
	withTiming: jest.fn((height: number) => height),
	cancelAnimation: jest.fn(),
}));
let tree: ReactTestRenderer;
let phase: SharedValue<ContentHeightPhase>;
const measure = (height: number, width = 375) =>
	act(() => {
		tree.root.findByProps({ testID: 'animated-content-measurement' }).props.onLayout({
			nativeEvent: { layout: { height, width } },
		});
		mockReaction();
	});
const render = (maxHeight = 600, enabled = true) => (
	<AnimatedContentHeight maxHeight={maxHeight} enabled={enabled} phase={phase}>
		<View testID="live-content" />
	</AnimatedContentHeight>
);
beforeEach(() => {
	jest.clearAllMocks();
	mockSharedIndex = 0;
	phase = { value: 'idle' } as SharedValue<ContentHeightPhase>;
	act(() => {
		tree = create(render());
	});
});
afterEach(() => act(() => tree.unmount()));

it('首测直接布局，展开后增长和反向缩小从当前高度继续，重复测量不重启', () => {
	measure(200);
	expect(mockHeight.value).toBe(200);
	expect(withTiming).not.toHaveBeenCalled();
	phase.value = 'expanded';
	mockReaction();
	jest.mocked(withTiming).mockClear();
	measure(500);
	expect(withTiming).toHaveBeenLastCalledWith(500, expect.objectContaining({ duration: 220 }));
	mockHeight.value = 320; // An in-flight presentation frame.
	measure(240);
	expect(withTiming).toHaveBeenLastCalledWith(240, expect.anything());
	const count = jest.mocked(withTiming).mock.calls.length;
	measure(240);
	expect(withTiming).toHaveBeenCalledTimes(count);
});

it('拖拽/退场保留当前高度，期间仍记录目标，恢复后继续', () => {
	measure(200);
	phase.value = 'expanded';
	mockReaction();
	measure(500);
	mockHeight.value = 320;
	phase.value = 'paused';
	mockReaction();
	expect(cancelAnimation).toHaveBeenCalledWith(mockHeight);
	measure(240);
	expect(mockHeight.value).toBe(320);
	phase.value = 'expanded';
	mockReaction();
	expect(withTiming).toHaveBeenLastCalledWith(240, expect.anything());
});

it('窗口/限高变化立即适配，禁用动画立即就位，不重挂内容', () => {
	measure(500);
	const body = tree.root.findByProps({ testID: 'live-content' });
	phase.value = 'expanded';
	mockReaction();
	jest.mocked(withTiming).mockClear();
	act(() => tree.update(render(400)));
	measure(400, 700);
	expect(mockHeight.value).toBe(400);
	expect(withTiming).not.toHaveBeenCalled();
	act(() => tree.update(render(400, false)));
	measure(250, 700);
	expect(mockHeight.value).toBe(250);
	expect(withTiming).not.toHaveBeenCalled();
	expect(tree.root.findByProps({ testID: 'live-content' })).toBe(body);
});

it('footer 与背景在裁切区外，限高扣除固定底栏、padding 和边框', () => {
	expect(
		contentHeightLimit(800, { maxHeight: '80%', paddingVertical: 12, borderWidth: 1 }, 100),
	).toBe(514);
	expect(contentHeightLimit(800, { maxHeight: 1000, paddingBottom: 34 }, 100)).toBe(666);
	expect(contentHeightLimit(80, {}, 100)).toBe(0);
	act(() =>
		tree.update(
			<BottomSheetContent
				availableHeight={800}
				contentStyle={{ maxHeight: 640 }}
				animate
				phase={phase}
				footer={<View testID="footer" />}
				background={<View testID="background" />}
			>
				<View testID="body" />
			</BottomSheetContent>,
		),
	);
	const viewport = tree.root.findByType(AnimatedContentHeight);
	expect(viewport.findAllByProps({ testID: 'footer' })).toHaveLength(0);
	const footer = tree.root.findByProps({ testID: 'footer' }).parent!;
	act(() => footer.props.onLayout({ nativeEvent: { layout: { height: 100 } } }));
	expect(viewport.props.maxHeight).toBe(540);
	expect(StyleSheet.flatten(footer.props.style).flexShrink).toBe(0);
});
