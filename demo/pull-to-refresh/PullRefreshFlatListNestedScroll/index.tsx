import { withNavigationItem } from 'hybrid-navigation';
import React, { useRef, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { NestedScrollView, NestedScrollViewHeader } from '@sdcx/nested-scroll';
import { FlatListPage, useDemoFlatlistData } from '../../components/FlatListPage';
import { PullToRefresh } from '@sdcx/pull-to-refresh';
import { LottiePullToRefreshFooter } from '../PullToRefresh/LottiePullToRefreshFooter';
import { DemoSafeAreaView } from '../../components/DemoKit';

export function PullRefreshFlatListNestedScroll() {
	const [refreshing, setRefreshing] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const { flatlistData, addFlatlistRefreshItem, addFlatlistLoadMoreItem } = useDemoFlatlistData();
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

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FF0000',
	},
	coordinator: {
		flex: 1,
		backgroundColor: '#fff',
	},
	refresh: {
		flex: 1,
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
		paddingVertical: 20,
		fontSize: 18,
	},
});

export default withNavigationItem({})(PullRefreshFlatListNestedScroll);
