import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LoremIpsum } from '../../components/LoremIpsum';
import BottomSheet from '@sdcx/bottom-sheet';
import { withNavigationItem } from 'hybrid-navigation';
import Contacts from '../../components/contacts/Contacts';
import { SafeAreaView } from 'react-native-safe-area-context';

const HEADER_HEIGHT = 50;

function BottomSheetFlashList() {
	return (
		<SafeAreaView edges={['top']} style={styles.container}>
			<ScrollView>
				<LoremIpsum />
				<LoremIpsum />
				<LoremIpsum />
			</ScrollView>
			<BottomSheet onSlide={e => console.log(e.nativeEvent)} style={styles.bottomSheet}>
				<View style={styles.header} />
				<Contacts />
			</BottomSheet>
		</SafeAreaView>
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
	},
	bottomSheet: {
		...StyleSheet.absoluteFillObject,
		top: 80,
		backgroundColor: '#ff9f7A',
	},
});

export default withNavigationItem({})(BottomSheetFlashList);
