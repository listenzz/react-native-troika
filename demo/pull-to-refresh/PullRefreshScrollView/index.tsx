import { withNavigationItem } from 'hybrid-navigation';
import React, { useRef, useState } from 'react';
import { ScrollViewPage } from '../../components/ScrollViewPage';
import { PullToRefresh } from '@sdcx/pull-to-refresh';
import { DemoSafeAreaView } from '../../components/DemoKit';

interface Props {
	safeArea?: boolean;
}

function PullRefreshScrollView({ safeArea = true }: Props) {
	const [refreshing, setRefreshing] = useState(false);

	const pendingAction = useRef<ReturnType<typeof setTimeout> | null>(null);

	const clearPendingAction = () => {
		if (pendingAction.current) {
			clearTimeout(pendingAction.current);
		}
	};

	const beginRefresh = async () => {
		setRefreshing(true);

		pendingAction.current = setTimeout(() => {
			endRefresh();
		}, 1500);
	};

	const endRefresh = () => {
		clearPendingAction();
		setRefreshing(false);
	};

	const content = (
		<PullToRefresh refreshing={refreshing} onRefresh={beginRefresh}>
			<ScrollViewPage />
		</PullToRefresh>
	);

	return safeArea ? <DemoSafeAreaView>{content}</DemoSafeAreaView> : content;
}

export default withNavigationItem({})(PullRefreshScrollView);
