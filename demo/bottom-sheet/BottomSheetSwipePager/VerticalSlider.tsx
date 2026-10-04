import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { demoTheme } from '../../components/DemoKit';

const TRAVEL = 120;
const THUMB = 24;

/** 普通纵向 Pan，不需要了解外层是否有 BottomSheet。 */
export default function VerticalSlider() {
	const [value, setValue] = useState(50);
	const position = useSharedValue(TRAVEL / 2);
	const pan = Gesture.Pan().onChange(event => {
		position.value = Math.max(0, Math.min(TRAVEL, position.value + event.changeY));
		runOnJS(setValue)(Math.round(100 * (1 - position.value / TRAVEL)));
	});
	const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateY: position.value }] }));
	return (
		<View style={styles.slider}>
			<Text style={styles.label}>纵向滑块</Text>
			<GestureDetector gesture={pan}>
				<View testID="ordinary-vertical-slider" style={styles.touchArea} collapsable={false}>
					<View pointerEvents="none" style={styles.track} />
					<Animated.View pointerEvents="none" style={[styles.thumb, thumbStyle]} />
				</View>
			</GestureDetector>
			<Text testID="ordinary-slider-value" style={styles.label}>{value}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	slider: { width: 72, alignItems: 'center', gap: 8 },
	label: { color: demoTheme.colors.muted, fontSize: 13 },
	touchArea: { width: 64, height: TRAVEL + THUMB, alignItems: 'center' },
	track: { position: 'absolute', top: THUMB / 2, bottom: THUMB / 2, width: 8,
		borderRadius: 4, backgroundColor: demoTheme.colors.line },
	thumb: { width: THUMB, height: THUMB, borderRadius: THUMB / 2,
		backgroundColor: demoTheme.colors.blue },
});
