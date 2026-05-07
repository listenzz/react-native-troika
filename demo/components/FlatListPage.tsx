import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { demoTheme } from './DemoKit';

const FLATLIST_DATA = Array(40)
	.fill(Math.random() + '')
	.map((item, index) => ({
		id: item + index,
		title: `index: ${index} `,
	}));

const generateFlatlistItem = (index: number, extra: string) => ({
	id: Math.random() + '' + index,
	title: `${extra} index ${index}`,
});

export function useDemoFlatlistData() {
	const [flatlistData, setFlatlistData] = useState(FLATLIST_DATA);
	return {
		flatlistData,
		addFlatlistRefreshItem: () =>
			setFlatlistData(data => [generateFlatlistItem(data.length, 'refresh'), ...data]),
		addFlatlistLoadMoreItem: () =>
			setFlatlistData([
				...flatlistData,
				generateFlatlistItem(flatlistData.length, 'load more'),
			]),
	};
}

export function FlatListPage({ data = FLATLIST_DATA }: { data?: { id: string; title: string }[] }) {
	const renderItem = ({ item }: { item: { title: string } }) => <Item title={item.title} />;

	return (
		<FlatList
			onLayout={e => console.log('flatlist', e.nativeEvent.layout.height)}
			style={styles.list}
			contentContainerStyle={styles.listContent}
			data={data}
			renderItem={renderItem}
			keyExtractor={item => item.id}
			nestedScrollEnabled
		/>
	);
}
const Item = ({ title }: { title: string }) => {
	const [clickCount, setClickCount] = useState(0);
	return (
		<TouchableHighlight
			style={styles.touchable}
			onPress={() => setClickCount(v => v + 1)}
			underlayColor="#F2F4F7"
		>
			<View style={styles.item}>
				<View style={styles.mark} />
				<Text style={styles.title} numberOfLines={1}>
					{title}
				</Text>
				<Text style={styles.count}>{clickCount}</Text>
			</View>
		</TouchableHighlight>
	);
};

const styles = StyleSheet.create({
	list: {
		backgroundColor: demoTheme.colors.background,
	},
	listContent: {
		flexGrow: 1,
		paddingVertical: 8,
	},
	touchable: {
		borderRadius: 8,
		marginVertical: 6,
		marginHorizontal: 16,
	},
	item: {
		minHeight: 60,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: demoTheme.colors.surface,
		borderRadius: 8,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: demoTheme.colors.line,
		paddingHorizontal: 16,
	},
	mark: {
		width: 8,
		height: 32,
		borderRadius: 4,
		backgroundColor: demoTheme.colors.cyan,
		marginRight: 12,
	},
	title: {
		flex: 1,
		color: demoTheme.colors.text,
		fontSize: 17,
		lineHeight: 22,
		fontWeight: '700',
		letterSpacing: 0,
	},
	count: {
		color: demoTheme.colors.muted,
		fontSize: 14,
		lineHeight: 20,
		fontWeight: '700',
		letterSpacing: 0,
		marginLeft: 12,
	},
});
