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

interface BottomModalProps {
	style?: StyleProp<ViewStyle>;
	modalContentStyle?: StyleProp<ViewStyle>;
	fitToContents?: boolean;
	visible: boolean;
	onClose?: () => void;
	onOutsidePress?: () => void;
}

const BottomSheetAnimated = Animated.createAnimatedComponent(BottomSheet);

export function BottomModal(props: PropsWithChildren<BottomModalProps>) {
	const {
		visible = true,
		fitToContents = false,
		onClose,
		style,
		modalContentStyle,
		children,
		onOutsidePress: onOutsidePressProp,
	} = props;
	const [bottomSheetState, setBottomSheetState] = useState<BottomSheetState>('collapsed');
	const stateRef = useRef<BottomSheetState>('collapsed');

	useEffect(() => {
		if (!visible) {
			Keyboard.dismiss();
		}
		// 保证动画
		if (visible) {
			setTimeout(() => {
				setBottomSheetState('expanded');
				stateRef.current = 'expanded';
			}, 0);
		} else {
			setBottomSheetState('collapsed');
		}
	}, [visible]);

	const handler = useRef<NativeEventSubscription>(undefined);

	useEffect(() => {
		handler.current = BackHandler.addEventListener('hardwareBackPress', () => {
			console.info('BottomModal BackHandler');
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
	}, []);

	const onOutsidePress = () => {
		Keyboard.dismiss();
		setBottomSheetState('collapsed');
		onOutsidePressProp?.();
	};

	const onStateChanged = (event: BottomSheetOnStateChangedEvent) => {
		const { state } = event.nativeEvent;
		console.info('BottomModal onStateChanged', state);
		setBottomSheetState(state);

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
		},
		['onSlide'],
	);

	const animatedOverlayStyle = useAnimatedStyle(() => ({
		opacity: overlayOpacity.value,
	}));

	return (
		<View style={styles.container} pointerEvents="box-none">
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
				draggable={false}
				state={bottomSheetState}
				onStateChanged={onStateChanged}
				onSlide={onSlide}
				style={style}
				contentContainerStyle={modalContentStyle}
			>
				{children}
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
