import React, { PropsWithChildren, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
	cancelAnimation,
	Easing,
	SharedValue,
	useAnimatedReaction,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

/** idle: measure before opening; paused: preserve geometry during native motion. */
export type ContentHeightPhase = 'idle' | 'paused' | 'expanded';

interface Props extends PropsWithChildren {
	maxHeight: number;
	enabled: boolean;
	phase: SharedValue<ContentHeightPhase>;
	onReady?: () => void;
}

/** One live subtree, measured independently of the animated viewport. */
export function AnimatedContentHeight({ children, maxHeight, enabled, phase, onReady }: Props) {
	const ready = useRef(false);
	const measurement = useSharedValue({ height: 0, width: 0, limit: 0 });
	const viewportHeight = useSharedValue(0);
	const appliedSize = useSharedValue({ width: 0, limit: 0 });

	useAnimatedReaction(
		() => ({ measurement: measurement.value, phase: phase.value, enabled }),
		(current, previous) => {
			if (current.phase === 'paused') {
				cancelAnimation(viewportHeight);
				return;
			}
			const next = current.measurement;
			if (next.width <= 0 || next.limit <= 0) return;
			// Window/constraint changes must fit immediately, not animate stale geometry.
			const resized =
				appliedSize.value.width !== next.width || appliedSize.value.limit !== next.limit;
			if (
				!resized &&
				previous?.measurement.height === next.height &&
				previous.phase === current.phase &&
				previous.enabled === current.enabled
			) {
				return;
			}
			appliedSize.value = { width: next.width, limit: next.limit };
			viewportHeight.value =
				current.enabled && current.phase === 'expanded' && !resized
					? withTiming(next.height, { duration: 220, easing: Easing.out(Easing.cubic) })
					: next.height;
		},
	);
	const viewportStyle = useAnimatedStyle(() => ({ height: viewportHeight.value }));

	return (
		<Animated.View style={[styles.viewport, viewportStyle]}>
			<View
				testID="animated-content-measurement"
				collapsable={false}
				style={[styles.content, { maxHeight }]}
				onLayout={event => {
					const { height, width } = event.nativeEvent.layout;
					measurement.value = {
						height: Math.min(height, maxHeight),
						width,
						limit: maxHeight,
					};
					if (!ready.current && width > 0 && maxHeight > 0) {
						ready.current = true;
						onReady?.();
					}
				}}
			>
				{children}
			</View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	viewport: { flexShrink: 0, overflow: 'hidden' },
	content: { position: 'absolute', left: 0, right: 0, top: 0 },
});
