import { withNavigationItem } from 'hybrid-navigation';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { NestedScrollView, NestedScrollViewHeader } from '@sdcx/nested-scroll';
import { FlatListPage } from '../../components/FlatListPage';
import { DemoSafeAreaView } from '../../components/DemoKit';

export function NestedScrollFlatList() {
	return (
		<DemoSafeAreaView edges={['top']}>
			<NestedScrollView style={styles.coordinator} bounces>
				<NestedScrollViewHeader
					stickyHeaderHeight={60}
					onScroll={e => console.log(e.nativeEvent)}
				>
					<Image
						source={require('assets/cover.webp')}
						style={styles.image}
						resizeMode="cover"
					/>
					<View style={[styles.text]} collapsable={false}>
						<Text>anchor</Text>
					</View>
				</NestedScrollViewHeader>
				<FlatListPage />
			</NestedScrollView>
		</DemoSafeAreaView>
	);
}

const styles = StyleSheet.create({
	coordinator: {
		backgroundColor: '#fff',
	},
	content: {
		backgroundColor: '#0000FF',
		justifyContent: 'center',
		alignItems: 'center',
	},
	image: {
		height: 160,
		width: '100%',
	},
	text: {
		height: 60,
		justifyContent: 'center',
		fontSize: 18,
		color: '#FFFFFF',
	},
});

export default withNavigationItem({})(NestedScrollFlatList);
