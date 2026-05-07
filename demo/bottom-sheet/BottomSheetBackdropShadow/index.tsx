import React, { useMemo, useRef } from 'react';
import { Animated, PixelRatio, ScrollView, StyleSheet, View } from 'react-native';
import { LoremIpsum } from '../../components/LoremIpsum';
import BottomSheet, { BottomSheetOnSlideEvent } from '@sdcx/bottom-sheet';
import { withNavigationItem } from 'hybrid-navigation';
import DropShadow from 'react-native-drop-shadow';
import PrimaryButton from '../../components/PrimaryButton';
import { useToast } from 'react-native-toast-hybrid';
import { SafeAreaView } from 'react-native-safe-area-context';

const HEADER_HEIGHT = 50;

const AnimatedBottomSheet = Animated.createAnimatedComponent(BottomSheet);

function BottomSheetBackdropShadow() {
	const toast = useToast();
	const offset = useRef(new Animated.Value(1)).current;

	const backdropStyle = {
		opacity: offset.interpolate({
			inputRange: [0, 1],
			outputRange: [1, 0],
		}),
	};

	const onSlide = useMemo(
		() =>
			Animated.event<BottomSheetOnSlideEvent>(
				[
					{
						nativeEvent: {
							progress: offset,
						},
					},
				],
				{
					useNativeDriver: true,
				},
			),
		[offset],
	);

	return (
		<SafeAreaView edges={['top']} style={styles.container}>
			<ScrollView>
				<LoremIpsum />
				<LoremIpsum />
				<LoremIpsum />
			</ScrollView>
			<Animated.View
				style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
				pointerEvents="box-none"
			/>
			<AnimatedBottomSheet fitToContents peekHeight={200} onSlide={onSlide}>
				<DropShadow style={styles.shadow}>
					<View style={styles.header} />
				</DropShadow>
				<View style={styles.content}>
					<PrimaryButton
						text="按钮"
						onPress={() => {
							toast.info('点击按钮');
							console.log('点击按钮');
						}}
						style={styles.button}
					/>
					<LoremIpsum words={100} />
				</View>
			</AnimatedBottomSheet>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#eef',
	},
	backdrop: {
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	shadow: {
		shadowRadius: 16,
		shadowColor: '#000',
		shadowOpacity: 0.4,
		shadowOffset: {
			width: 0,
			height: 0,
		},
	},
	header: {
		height: PixelRatio.roundToNearestPixel(HEADER_HEIGHT),
		backgroundColor: 'coral',
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
	},
	content: {
		backgroundColor: '#ff9f7A',
	},
	button: {
		marginTop: 16,
		marginHorizontal: 32,
	},
});

export default withNavigationItem({})(BottomSheetBackdropShadow);
