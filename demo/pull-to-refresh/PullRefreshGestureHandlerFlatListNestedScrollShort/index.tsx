import { withNavigationItem } from 'hybrid-navigation';
import React, { useRef, useState } from 'react';
import { Image, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { GestureHandlerRootView, FlatList } from 'react-native-gesture-handler';
import { NestedScrollView, NestedScrollViewHeader } from '@sdcx/nested-scroll';
import { PullToRefresh } from '@sdcx/pull-to-refresh';
import { LottiePullToRefreshFooter } from '../PullToRefresh/LottiePullToRefreshFooter';
import { DemoSafeAreaView, demoTheme } from '../../components/DemoKit';

// 故意只放 3 条数据，内容高度小于视口（短列表）。此时内部 RNGH FlatList 没有滚动范围，
// 用来验证在 NestedScrollView > PullToRefresh > GestureHandlerFlatList 嵌套结构下：
// 1. 短列表依然可以下拉刷新；
// 2. 短列表依然可以上拉加载更多；
// 3. 上拉（overscroll）后内容能够正常回弹；
// 4. RNGH 列表项的点击事件不受影响。参见 issue #85。
const SHORT_FLATLIST_DATA = Array(3)
	.fill(Math.random() + '')
	.map((item, index) => ({
		id: item + index,
		title: `index: ${index} `,
	}));

const generateFlatlistItem = (index: number, extra: string) => ({
	id: Math.random() + '' + index,
	title: `${extra} index ${index}`,
});

function useShortFlatlistData() {
	const [flatlistData, setFlatlistData] = useState(SHORT_FLATLIST_DATA);
	return {
		flatlistData,
		addFlatlistRefreshItem: () =>
			setFlatlistData(data => [generateFlatlistItem(data.length, 'refresh'), ...data]),
		addFlatlistLoadMoreItem: () =>
			setFlatlistData(data => [...data, generateFlatlistItem(data.length, 'load more')]),
	};
}

export function PullRefreshGestureHandlerFlatListNestedScrollShort() {
	const [refreshing, setRefreshing] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const { flatlistData, addFlatlistRefreshItem, addFlatlistLoadMoreItem } =
		useShortFlatlistData();
	const pendingAction = useRef<ReturnType<typeof setTimeout> | null>(null);

	const clearPendingAction = () => {
		if (pendingAction.current) {
			clearTimeout(pendingAction.current);
		}
	};

	const beginRefresh = async () => {
		setRefreshing(true);
		pendingAction.current = setTimeout(() => {
			addFlatlistRefreshItem();
			endRefresh();
		}, 1500);
	};

	const endRefresh = () => {
		clearPendingAction();
		setRefreshing(false);
	};

	const loadMore = () => {
		setLoadingMore(true);
		pendingAction.current = setTimeout(() => {
			addFlatlistLoadMoreItem();
			endLoadMore();
		}, 1500);
	};

	const endLoadMore = () => {
		clearPendingAction();
		setLoadingMore(false);
	};

	const renderItem = ({ item }: { item: { title: string } }) => <Item title={item.title} />;

	return (
		<DemoSafeAreaView edges={['top']}>
			<NestedScrollView style={styles.coordinator}>
				<NestedScrollViewHeader stickyHeaderBeginIndex={1}>
					<Image
						source={require('assets/cover.webp')}
						style={styles.image}
						resizeMode="cover"
					/>
					<View style={[styles.text]} collapsable={false}>
						<Text>anchor</Text>
					</View>
				</NestedScrollViewHeader>
				<PullToRefresh
					style={styles.refresh}
					refreshing={refreshing}
					onRefresh={beginRefresh}
					footer={
						<LottiePullToRefreshFooter
							manual
							refreshing={loadingMore}
							onRefresh={loadMore}
						/>
					}
				>
					<GestureHandlerRootView style={styles.root}>
						<FlatList
							style={styles.list}
							contentContainerStyle={styles.listContent}
							data={flatlistData}
							renderItem={renderItem}
							keyExtractor={item => item.id}
							nestedScrollEnabled
						/>
					</GestureHandlerRootView>
				</PullToRefresh>
			</NestedScrollView>
		</DemoSafeAreaView>
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

export default withNavigationItem({})(PullRefreshGestureHandlerFlatListNestedScrollShort);

const styles = StyleSheet.create({
	coordinator: {
		flex: 1,
		backgroundColor: '#fff',
	},
	refresh: {
		flex: 1,
	},
	image: {
		height: 160,
		width: '100%',
	},
	text: {
		paddingVertical: 20,
		fontSize: 18,
	},
	root: {
		flex: 1,
	},
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
		backgroundColor: demoTheme.colors.indigo,
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
