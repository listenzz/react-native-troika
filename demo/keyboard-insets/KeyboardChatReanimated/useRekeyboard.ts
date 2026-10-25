import { useCallback } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Keyboard } from 'react-native';
import {
	Easing,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { KeyboardPositionPayload, KeyboardStatusPayload } from '@sdcx/keyboard-insets';

export type KeyboardPanel = 'emoji' | 'toolbox';

const TARGET_NONE = 0;
const TARGET_KEYBOARD = 1;
const TARGET_EMOJI = 2;
const TARGET_TOOLBOX = 3;
const PANEL_DURATION = 200;
const PANEL_EASING = Easing.inOut(Easing.ease);

interface UseRekeyboardOptions {
	bottom: number;
}

function keyboardHeightAtPosition(
	position: number,
	keyboardHeight: number,
	previousHeight: number,
) {
	'worklet';

	if (keyboardHeight <= 0) {
		return 0;
	}

	return interpolate(position, [0, keyboardHeight], [previousHeight, keyboardHeight], 'clamp');
}

export function useRekeyboard({ bottom }: UseRekeyboardOptions) {
	const position = useSharedValue(0);
	const height = useSharedValue(0);
	const shown = useSharedValue(false);
	const transitioning = useSharedValue(false);

	const activeTarget = useSharedValue(TARGET_NONE);
	const previousHeight = useSharedValue(0);
	const panelPosition = useSharedValue(0);

	const emojiHeight = useSharedValue(0);
	const emojiProgress = useSharedValue(0);
	const toolboxHeight = useSharedValue(0);
	const toolboxProgress = useSharedValue(0);

	const onStatusChanged = useCallback(
		(e: KeyboardStatusPayload) => {
			'worklet';

			const wasShown = shown.value;
			height.value = e.height;
			shown.value = e.shown;
			transitioning.value = e.transitioning;

			if (e.shown) {
				if (!wasShown) {
					if (
						activeTarget.value === TARGET_EMOJI ||
						activeTarget.value === TARGET_TOOLBOX
					) {
						previousHeight.value = panelPosition.value;
						panelPosition.value = previousHeight.value;
					} else {
						previousHeight.value = 0;
					}

					emojiProgress.value = 0;
					toolboxProgress.value = 0;
				}

				activeTarget.value = TARGET_KEYBOARD;
				return;
			}

			if (activeTarget.value === TARGET_KEYBOARD) {
				activeTarget.value = TARGET_NONE;
				previousHeight.value = 0;
			}
		},
		[
			activeTarget,
			emojiProgress,
			height,
			panelPosition,
			previousHeight,
			shown,
			toolboxProgress,
			transitioning,
		],
	);

	const onPositionChanged = useCallback(
		(e: KeyboardPositionPayload) => {
			'worklet';
			position.value = e.position;
		},
		[position],
	);

	const currentRaisedHeight = useCallback(() => {
		const target = activeTarget.value;

		if (target === TARGET_KEYBOARD || target === TARGET_NONE) {
			return keyboardHeightAtPosition(
				position.value,
				height.value,
				target === TARGET_KEYBOARD ? previousHeight.value : 0,
			);
		}

		return panelPosition.value;
	}, [activeTarget, height, panelPosition, position, previousHeight]);

	const showPanel = useCallback(
		(target: KeyboardPanel) => {
			const raisedHeight = currentRaisedHeight();
			panelPosition.value = raisedHeight;
			previousHeight.value = 0;

			emojiProgress.value = 0;
			toolboxProgress.value = 0;

			if (target === 'emoji') {
				activeTarget.value = TARGET_EMOJI;
				panelPosition.value = withTiming(emojiHeight.value, {
					duration: PANEL_DURATION,
					easing: PANEL_EASING,
				});
				emojiProgress.value = withTiming(1, {
					duration: PANEL_DURATION,
					easing: PANEL_EASING,
				});
			} else {
				activeTarget.value = TARGET_TOOLBOX;
				panelPosition.value = withTiming(toolboxHeight.value, {
					duration: PANEL_DURATION,
					easing: PANEL_EASING,
				});
				toolboxProgress.value = withTiming(1, {
					duration: PANEL_DURATION,
					easing: PANEL_EASING,
				});
			}

			Keyboard.dismiss();
		},
		[
			activeTarget,
			currentRaisedHeight,
			emojiHeight,
			emojiProgress,
			panelPosition,
			previousHeight,
			toolboxHeight,
			toolboxProgress,
		],
	);

	const hidePanel = useCallback(
		(target: KeyboardPanel) => {
			if (
				(target === 'emoji' && activeTarget.value !== TARGET_EMOJI) ||
				(target === 'toolbox' && activeTarget.value !== TARGET_TOOLBOX)
			) {
				return;
			}

			previousHeight.value = 0;
			panelPosition.value = withTiming(0, {
				duration: PANEL_DURATION,
				easing: PANEL_EASING,
			});

			if (target === 'emoji') {
				emojiProgress.value = withTiming(
					0,
					{ duration: PANEL_DURATION, easing: PANEL_EASING },
					finished => {
						if (finished && activeTarget.value === TARGET_EMOJI && !shown.value) {
							activeTarget.value = TARGET_NONE;
						}
					},
				);
			} else {
				toolboxProgress.value = withTiming(
					0,
					{ duration: PANEL_DURATION, easing: PANEL_EASING },
					finished => {
						if (finished && activeTarget.value === TARGET_TOOLBOX && !shown.value) {
							activeTarget.value = TARGET_NONE;
						}
					},
				);
			}
		},
		[activeTarget, emojiProgress, panelPosition, previousHeight, shown, toolboxProgress],
	);

	const mainStyle = useAnimatedStyle(() => {
		const target = activeTarget.value;
		let raisedHeight = 0;

		if (target === TARGET_KEYBOARD) {
			raisedHeight = keyboardHeightAtPosition(
				position.value,
				height.value,
				previousHeight.value,
			);
		} else if (target === TARGET_EMOJI || target === TARGET_TOOLBOX) {
			raisedHeight = panelPosition.value;
		} else {
			// Keep following the native keyboard while it animates out.
			raisedHeight = keyboardHeightAtPosition(position.value, height.value, 0);
		}

		return {
			transform: [{ translateY: Math.min(0, bottom - raisedHeight) }],
		};
	}, [bottom]);

	const emojiStyle = useAnimatedStyle(() => ({
		opacity: emojiProgress.value > 0 ? 1 : 0,
		transform: [{ translateY: emojiHeight.value * (1 - emojiProgress.value) }],
	}));

	const toolboxStyle = useAnimatedStyle(() => ({
		opacity: toolboxProgress.value > 0 ? 1 : 0,
		transform: [{ translateY: toolboxHeight.value * (1 - toolboxProgress.value) }],
	}));

	const onEmojiLayout = useCallback(
		(event: LayoutChangeEvent) => {
			emojiHeight.value = event.nativeEvent.layout.height;
		},
		[emojiHeight],
	);

	const onToolboxLayout = useCallback(
		(event: LayoutChangeEvent) => {
			toolboxHeight.value = event.nativeEvent.layout.height;
		},
		[toolboxHeight],
	);

	const keyboard = {
		position,
		height,
		shown,
		transitioning,
	};

	return {
		keyboard,
		mainStyle,
		emojiStyle,
		toolboxStyle,
		onEmojiLayout,
		onToolboxLayout,
		onPositionChanged,
		onStatusChanged,
		showPanel,
		hidePanel,
	};
}
