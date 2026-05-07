import { withNavigationItem } from 'hybrid-navigation';
import React, { useRef, useState } from 'react';
import { PullToRefresh } from '@sdcx/pull-to-refresh';
import { FlatListPage, useDemoFlatlistData } from '../../components/FlatListPage';
import { DemoSafeAreaView } from '../../components/DemoKit';
import { SpinnerPullToRefreshHeader } from '../PullToRefresh/SpinnerPullToRefreshHeader';

interface Props {
	safeArea?: boolean;
}

function PullRefreshFlatList({ safeArea = true }: Props) {
	const [refreshing, setRefreshing] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [noMoreData, setNoMoreData] = useState(false);
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
		}, 2000);
	};

	const endRefresh = () => {
		clearPendingAction();
		setRefreshing(false);
		setNoMoreData(false);
	};

	const loadMore = () => {
		setLoadingMore(true);
		pendingAction.current = setTimeout(() => {
			addFlatlistLoadMoreItem();
			endLoadMore();
		}, 3500);
	};

	const endLoadMore = () => {
		clearPendingAction();
		setLoadingMore(false);
		setNoMoreData(true);
	};

	const content = (
		<PullToRefresh
			style={{ height: '100%' }}
			header={<SpinnerPullToRefreshHeader refreshing={refreshing} onRefresh={beginRefresh} />}
			loadingMore={loadingMore}
			noMoreData={noMoreData}
			onLoadMore={loadMore}
		>
			<FlatListPage data={flatlistData} />
		</PullToRefresh>
	);

	return safeArea ? <DemoSafeAreaView>{content}</DemoSafeAreaView> : content;
}

export default withNavigationItem({})(PullRefreshFlatList);
