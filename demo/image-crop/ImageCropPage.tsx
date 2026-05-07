import React, { useCallback, useRef } from 'react';
import { NavigationProps, withNavigationItem } from 'hybrid-navigation';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ImageCropView, { ObjectRect, OnCropEvent, ImageCropViewInstance } from '@sdcx/image-crop';
import { DemoButton, demoTheme } from '../components/DemoKit';

interface Props extends NavigationProps {
	fileUri: string;
	cropStyle?: 'circular' | 'default';
	objectRect?: ObjectRect;
}

function ImageCropPage({ fileUri, cropStyle, objectRect, navigator }: Props) {
	const cropViewRef = useRef<ImageCropViewInstance>(null);

	const handleCropPress = useCallback(() => {
		console.log('裁剪确认');
		cropViewRef.current?.crop();
	}, []);

	const onCropped = useCallback(
		({ nativeEvent }: OnCropEvent) => {
			console.log('RN获取到剪切成功的uri = ', nativeEvent.uri);
			navigator.redirectTo('ImageCropResultPage', {
				fileUri: nativeEvent.uri,
			});
		},
		[navigator],
	);

	return (
		<View style={styles.container}>
			<SafeAreaView edges={['top']} style={styles.topSafeArea} />
			<ImageCropView
				ref={cropViewRef}
				style={styles.cropView}
				fileUri={fileUri}
				cropStyle={cropStyle}
				onCrop={onCropped}
				objectRect={objectRect}
			/>
			<SafeAreaView edges={['bottom']} style={styles.actionBar}>
				<DemoButton
					title="确认裁剪"
					accentColor={demoTheme.colors.rose}
					onPress={handleCropPress}
				/>
			</SafeAreaView>
		</View>
	);
}

export default withNavigationItem({})(ImageCropPage);

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'flex-start',
		alignItems: 'stretch',
	},
	topSafeArea: {
		backgroundColor: '#000000',
	},
	cropView: {
		flex: 1,
	},
	actionBar: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: demoTheme.colors.surface,
	},
});
