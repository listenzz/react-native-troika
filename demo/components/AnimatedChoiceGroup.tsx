import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
	Pressable,
	StyleSheet,
	Text,
	View,
	type LayoutRectangle,
	type StyleProp,
	type TextStyle,
	type ViewStyle,
} from 'react-native';
import Animated, {
	cancelAnimation,
	Easing,
	interpolateColor,
	type SharedValue,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { demoTheme } from './DemoKit';

// Demo theme adapter; animation and controlled-selection behavior match mower_app.
const d = {
	color: {
		bg: demoTheme.colors.background,
		ink: demoTheme.colors.text,
		iconAux: demoTheme.colors.text,
		brand: demoTheme.colors.violet,
		textPrimary: demoTheme.colors.text,
		textSecondary: demoTheme.colors.muted,
		white: demoTheme.colors.surface,
		disabled: demoTheme.colors.subtle,
	},
	typography: {
		bodyLgRegular: { fontSize: 16, lineHeight: 22 },
		titleMd: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
		bodyMd: { fontSize: 15, lineHeight: 20, fontWeight: '500' as const },
	},
};

interface Choice<T extends string | number> {
	value: T;
	label: string;
	testID?: string;
	disabled?: boolean;
	onDisabledPress?: () => void;
}

interface Props<T extends string | number> {
	value: T;
	options: readonly Choice<T>[];
	onChange: (value: T) => void;
	variant?: 'tabs' | 'segments';
	/** 可选紫色内收胶囊，默认深色整宽胶囊。 */
	inset?: boolean;
	style?: StyleProp<ViewStyle>;
	optionStyle?: StyleProp<ViewStyle>;
	labelStyle?: StyleProp<TextStyle>;
	testID?: string;
}

const TIMING = { duration: 220, easing: Easing.out(Easing.cubic) };

/** 只对父级已接受的选择做动画，不延迟业务切换，也不缓存表单值。 */
export default function AnimatedChoiceGroup<T extends string | number>({
	value,
	options,
	onChange,
	variant = 'segments',
	inset = false,
	style,
	optionStyle,
	labelStyle,
	testID,
}: Props<T>) {
	const [layouts, setLayouts] = useState<Record<string, LayoutRectangle>>({});
	const selected = layouts[String(value)];
	const initialized = useRef(false);
	const reduceMotion = useReducedMotion();
	const left = useSharedValue(0);
	const width = useSharedValue(0);
	const tabs = variant === 'tabs';

	useLayoutEffect(() => {
		if (!selected) return;
		const nextWidth = tabs ? 24 : selected.width;
		const nextLeft = selected.x + (selected.width - nextWidth) / 2;
		if (!initialized.current || reduceMotion) {
			left.value = nextLeft;
			width.value = nextWidth;
			initialized.current = true;
		} else {
			// 连续反向切换从当前显示位置继续，不排队、不等待上一段结束。
			left.value = withTiming(nextLeft, TIMING);
			width.value = withTiming(nextWidth, TIMING);
		}
	}, [selected, tabs, reduceMotion, left, width]);
	useEffect(
		() => () => {
			cancelAnimation(left);
			cancelAnimation(width);
		},
		[left, width],
	);
	const indicatorStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: left.value }],
		width: width.value,
	}));

	return (
		<View
			testID={testID}
			style={[tabs ? styles.tabs : styles.segments, !tabs && inset && styles.inset, style]}
		>
			<Animated.View
				testID={testID ? `${testID}-indicator` : undefined}
				pointerEvents="none"
				style={[
					styles.indicator,
					tabs ? styles.underline : styles.pill,
					!tabs && inset && styles.insetPill,
					indicatorStyle,
				]}
			/>
			{options.map(option => {
				const active = option.value === value;
				return (
					<Pressable
						key={option.value}
						testID={option.testID}
						accessibilityRole="tab"
						accessibilityState={{ selected: active, disabled: !!option.disabled }}
						onLayout={({ nativeEvent: { layout } }) =>
							setLayouts(previous => {
								const key = String(option.value);
								const old = previous[key];
								return old?.x === layout.x && old?.width === layout.width
									? previous
									: { ...previous, [key]: layout };
							})
						}
						onPress={() => {
							if (option.disabled) {
								option.onDisabledPress?.();
								return;
							}
							if (!active) onChange(option.value);
						}}
						style={({ pressed }) => [
							tabs ? styles.tab : styles.segment,
							!tabs && inset && styles.insetSegment,
							optionStyle,
							pressed && !option.disabled && styles.pressed,
						]}
					>
						{tabs ? (
							<Text
								style={[
									styles.tabText,
									labelStyle,
									active && styles.activeTabText,
									option.disabled && styles.disabledText,
								]}
							>
								{option.label}
							</Text>
						) : (
							<SegmentLabel
								left={left}
								width={width}
								layout={layouts[String(option.value)]}
								active={active}
								disabled={option.disabled}
								style={labelStyle}
							>
								{option.label}
							</SegmentLabel>
						)}
						{tabs && <View style={styles.lineSpace} />}
					</Pressable>
				);
			})}
		</View>
	);
}

// Text contrast follows the pill's actual position, including interrupted motion.
// Switching the selected style immediately briefly puts white text on the bare track.
function SegmentLabel({
	left,
	width,
	layout,
	active,
	disabled,
	style,
	children,
}: React.PropsWithChildren<{
	left: SharedValue<number>;
	width: SharedValue<number>;
	layout?: LayoutRectangle;
	active: boolean;
	disabled?: boolean;
	style?: StyleProp<TextStyle>;
}>) {
	const animatedStyle = useAnimatedStyle(() => {
		let covered = active ? 1 : 0;
		if (layout && width.value > 0) {
			const center = layout.x + layout.width / 2;
			const distanceInside = Math.min(center - left.value, left.value + width.value - center);
			covered = Math.max(0, Math.min(1, distanceInside / Math.max(1, layout.width / 4)));
		}
		return {
			color: disabled
				? d.color.disabled
				: interpolateColor(covered, [0, 1], [d.color.textPrimary, d.color.white]),
		};
	});
	return (
		<Animated.Text style={[styles.segmentText, style, animatedStyle]}>{children}</Animated.Text>
	);
}

/** 同一个内容容器只改变透明度，避免为装饰动画重新挂载地图或表单。 */
export function ChoiceTransition({
	selectionKey,
	children,
	style,
}: React.PropsWithChildren<{
	selectionKey: string | number;
	style?: StyleProp<ViewStyle>;
}>) {
	const previous = useRef(selectionKey);
	const opacity = useSharedValue(1);
	const reduceMotion = useReducedMotion();
	useEffect(() => {
		if (previous.current === selectionKey) return;
		previous.current = selectionKey;
		opacity.value = reduceMotion ? 1 : 0.55;
		opacity.value = withTiming(1, { duration: 160 });
	}, [selectionKey, opacity, reduceMotion]);
	useEffect(() => () => cancelAnimation(opacity), [opacity]);
	const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
	return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
	tabs: { flexDirection: 'row', gap: 4, height: 48 },
	segments: { flexDirection: 'row', borderRadius: 100, backgroundColor: d.color.bg },
	inset: { padding: 4 },
	indicator: { position: 'absolute', left: 0 },
	underline: { bottom: 10, height: 2, borderRadius: 11, backgroundColor: d.color.ink },
	pill: { top: 0, bottom: 0, borderRadius: 100, backgroundColor: d.color.iconAux },
	insetPill: { top: 4, bottom: 4, backgroundColor: d.color.brand },
	tab: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
	segment: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center' },
	insetSegment: { height: 36 },
	tabText: { ...d.typography.bodyLgRegular, color: d.color.textSecondary },
	activeTabText: { ...d.typography.titleMd, color: d.color.textPrimary },
	segmentText: { ...d.typography.bodyMd, color: d.color.textPrimary },
	disabledText: { color: d.color.disabled },
	lineSpace: { height: 2, marginTop: 2 },
	pressed: { opacity: 0.7 },
});
