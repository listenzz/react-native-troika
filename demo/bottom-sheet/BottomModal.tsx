import BottomSheet, {
	BottomSheetOnSlideEvent,
	BottomSheetOnStateChangedEvent,
	BottomSheetState,
} from '@sdcx/bottom-sheet';
import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';
import {
	BackHandler,
	Keyboard,
	NativeEventSubscription,
	Pressable,
	StyleProp,
	StyleSheet,
	View,
	ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useEvent, useSharedValue } from 'react-native-reanimated';

import { BottomSheetContent } from './BottomSheetContent';
import { ContentHeightPhase } from './AnimatedContentHeight';

interface BottomModalProps {
	style?: StyleProp<ViewStyle>;
	modalContentStyle?: StyleProp<ViewStyle>;
	fitToContents?: boolean;
	animateContentHeight?: boolean;
	footer?: React.ReactNode;
	background?: React.ReactNode;
	visible: boolean;
	draggable?: boolean;
	onClose?: () => void;
	onOutsidePress?: () => void;
}

const BottomSheetAnimated = Animated.createAnimatedComponent(BottomSheet);

export function BottomModal(props: PropsWithChildren<BottomModalProps>) {
	const {
		visible = true,
		draggable = false,
		fitToContents = false,
		animateContentHeight = false,
		footer,
		background,
		onClose,
		style,
		modalContentStyle,
		children,
		onOutsidePress: onOutsidePressProp,
	} = props;
	const [bottomSheetState, setBottomSheetState] = useState<BottomSheetState>('collapsed');
	const stateRef = useRef<BottomSheetState>('collapsed');

	const [availableHeight, setAvailableHeight] = useState(0);
	const [contentReady, setContentReady] = useState(false);
	const heightPhase = useSharedValue<ContentHeightPhase>('idle');
	const transition = fitToContents && animateContentHeight;
	const ready = availableHeight > 0 && (!transition || contentReady);
	const close = () => {
		heightPhase.value = 'paused';
		Keyboard.dismiss();
		setBottomSheetState('collapsed');
	};
	useEffect(() => {
		if (!visible) {
			heightPhase.value = 'paused';
			Keyboard.dismiss();
			setBottomSheetState('collapsed');
			return;
		}
		if (!ready) return;
		heightPhase.value = 'idle';
		let second: number | undefined;
		const first = requestAnimationFrame(() => {
			second = requestAnimationFrame(() => {
				heightPhase.value = 'paused';
				setBottomSheetState('expanded');
				stateRef.current = 'expanded';
			});
		});
		return () => {
			cancelAnimationFrame(first);
			if (second !== undefined) cancelAnimationFrame(second);
		};
	}, [visible, ready, heightPhase]);

	const handler = useRef<NativeEventSubscription>(undefined);

	useEffect(() => {
		handler.current = BackHandler.addEventListener('hardwareBackPress', () => {
			console.info('BottomModal BackHandler');
			heightPhase.value = 'paused';
			setBottomSheetState('collapsed');
			return true;
		});

		return () => {
			if (handler.current) {
				handler.current.remove();
				handler.current = undefined;
				console.info('BottomModal BackHandler removed');
			}
		};
	}, [heightPhase]);

	const onOutsidePress = () => {
		close();
		onOutsidePressProp?.();
	};

	const onStateChanged = (event: BottomSheetOnStateChangedEvent) => {
		const { state } = event.nativeEvent;
		console.info('BottomModal onStateChanged', state);
		if (state === 'expanded' && !visible) {
			close();
			return;
		}
		setBottomSheetState(state);
		heightPhase.value = state === 'expanded' ? 'expanded' : 'idle';

		if (stateRef.current === state) {
			console.log('BottomModal stateRef.current === state');
			return;
		}

		if (state === 'collapsed' && stateRef.current === 'expanded') {
			console.info('BottomModal onClose');
			onClose?.();
			if (handler.current) {
				handler.current.remove();
				handler.current = undefined;
				console.info('BottomModal BackHandler removed');
			}
		}
		stateRef.current = state;
	};

	const overlayOpacity = useSharedValue(0);

	const onSlide = useEvent<BottomSheetOnSlideEvent>(
		event => {
			'worklet';
			const { progress } = event;
			overlayOpacity.value = 1 - progress;
			if (progress > 0 && heightPhase.value === 'expanded') heightPhase.value = 'paused';
		},
		['onSlide'],
	);

	const animatedOverlayStyle = useAnimatedStyle(() => ({
		opacity: overlayOpacity.value,
	}));

	return (
		<View
			style={styles.container}
			pointerEvents="box-none"
			onLayout={event => setAvailableHeight(event.nativeEvent.layout.height)}
		>
			<Animated.View
				style={[styles.overlay, animatedOverlayStyle]}
				pointerEvents={visible ? 'auto' : 'none'}
			>
				<Pressable
					testID="bottom-modal-overlay"
					style={StyleSheet.absoluteFill}
					onPress={onOutsidePress}
				/>
			</Animated.View>
			<BottomSheetAnimated
				fitToContents={fitToContents}
				peekHeight={0}
				draggable={draggable}
				state={bottomSheetState}
				onStateChanged={onStateChanged}
				onSlide={onSlide}
				style={style}
				contentContainerStyle={modalContentStyle}
			>
				<BottomSheetContent
					availableHeight={availableHeight}
					contentStyle={modalContentStyle}
					animate={transition}
					phase={heightPhase}
					footer={footer}
					background={background}
					onReady={() => setContentReady(true)}
				>
					{children}
				</BottomSheetContent>
			</BottomSheetAnimated>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	overlay: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		backgroundColor: '#00000077',
	},
});
