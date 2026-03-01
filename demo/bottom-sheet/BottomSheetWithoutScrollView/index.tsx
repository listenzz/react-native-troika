import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LoremIpsum } from '../../components/LoremIpsum';
import BottomSheet, { BottomSheetState, BottomSheetOnStateChangedEvent } from '@sdcx/bottom-sheet';
import { withNavigationItem } from 'hybrid-navigation';

import Button from './Button';
import { useToast } from 'react-native-toast-hybrid';

const HEADER_HEIGHT = 50;

function BottomSheetWithoutScrollView() {
	const [bottomSheetState, setBottomSheetState] = useState<BottomSheetState>('expanded');

	const onStateChanged = (e: BottomSheetOnStateChangedEvent) => {
		console.log(e.nativeEvent);
		setBottomSheetState(e.nativeEvent.state);
	};

	const toast = useToast();

	return (
		<View style={styles.container}>
			<ScrollView>
				<View style={styles.toolbar}>
					<Button
						text="expand"
						onPress={() => {
							setBottomSheetState('expanded');
						}}
					/>
				</View>
				<LoremIpsum />
				<LoremIpsum />
				<LoremIpsum />
			</ScrollView>
			<BottomSheet
				fitToContents
				peekHeight={200}
				state={bottomSheetState}
				onStateChanged={onStateChanged}
				style={styles.bottomSheet}
			>
				<View
					style={styles.header}
					onTouchCancel={() => console.log('touch cancel')}
					onTouchEnd={() => console.log('touch end')}
					onTouchMove={() => {
						console.log('touch move');
						toast.text('touch move');
					}}
				>
					<Button
						text="collapse"
						onPress={() => {
							console.log('collapse');
							setBottomSheetState('collapsed');
						}}
					/>
					<Button
						text="expand"
						onPress={() => {
							console.log('expand');
							setBottomSheetState('expanded');
						}}
					/>

					<Button
						text="hide"
						onPress={() => {
							console.log('hide');
							setBottomSheetState('hidden');
						}}
					/>
				</View>
				<LoremIpsum words={200} />
			</BottomSheet>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#eef',
	},
	header: {
		height: HEADER_HEIGHT,
		backgroundColor: 'coral',
		paddingHorizontal: 16,
		flexDirection: 'row',
	},
	toolbar: {
		height: HEADER_HEIGHT,
		backgroundColor: 'cadetblue',
		paddingHorizontal: 16,
		flexDirection: 'row',
	},
	bottomSheet: {
		backgroundColor: '#ff9f7A',
	},
});

export default withNavigationItem({
	titleItem: {
		title: 'BottomSheet without ScrollView',
	},
})(BottomSheetWithoutScrollView);
