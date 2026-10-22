import { withNavigationItem } from 'hybrid-navigation';
import React, { useRef, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { NestedScrollView, NestedScrollViewHeader } from '@sdcx/nested-scroll';
import { FlatListPage } from '../../components/FlatListPage';
import { PullToRefresh } from '@sdcx/pull-to-refresh';
import { LottiePullToRefreshFooter } from '../PullToRefresh/LottiePullToRefreshFooter';
import { DemoSafeAreaView } from '../../components/DemoKit';

// 故意只放 3 条数据，内容高度小于视口（短列表）。此时内部 FlatList 没有滚动范围，
// 用来验证在 NestedScrollView > PullToRefresh 嵌套结构下：
// 1. 短列表依然可以下拉刷新；
// 2. 短列表依然可以上拉加载更多；
// 3. 上拉（overscroll）后内容能够正常回弹。参见 issue #85。
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

export function PullRefreshFlatListNestedScrollShort() {
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
					<FlatListPage data={flatlistData} />
				</PullToRefresh>
			</NestedScrollView>
		</DemoSafeAreaView>
	);
}

export default withNavigationItem({})(PullRefreshFlatListNestedScrollShort);

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
});
