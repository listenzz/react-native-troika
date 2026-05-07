import React from 'react';
import { NavigationProps, withNavigationItem } from 'hybrid-navigation';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FastImage from 'react-native-fast-image';

interface Props extends NavigationProps {
	fileUri: string;
}

function ImageCropResultPage({ fileUri }: Props) {
	return (
		<SafeAreaView edges={['top', 'bottom']} style={styles.container}>
			<FastImage
				style={styles.image}
				source={{
					uri: fileUri,
					priority: FastImage.priority.normal,
				}}
				resizeMode={FastImage.resizeMode.contain}
			/>
		</SafeAreaView>
	);
}

export default withNavigationItem({})(ImageCropResultPage);

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'flex-start',
		alignItems: 'stretch',
		backgroundColor: '#eef',
	},
	image: {
		flex: 1,
	},
});
