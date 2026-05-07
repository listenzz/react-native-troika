import { withNavigationItem } from 'hybrid-navigation';
import React, { useRef, useState } from 'react';
import { WebViewPage } from '../../components/WebViewPage';
import { PullToRefresh } from '@sdcx/pull-to-refresh';
import { DemoSafeAreaView } from '../../components/DemoKit';

interface Props {
	safeArea?: boolean;
}

function PullRefreshWebView({ safeArea = true }: Props) {
	const [refreshing, setRefreshing] = useState(false);
	const pendingAction = useRef<ReturnType<typeof setTimeout> | null>(null);

	const [url, setUrl] = useState('https://wangdoc.com');

	const clearPendingAction = () => {
		if (pendingAction.current) {
			clearTimeout(pendingAction.current);
		}
	};

	const beginRefresh = async () => {
		setRefreshing(true);
		pendingAction.current = setTimeout(() => {
			setUrl(url =>
				url === 'https://wangdoc.com' ? 'https://todoit.tech' : 'https://wangdoc.com',
			);
			endRefresh();
		}, 1500);
	};

	const endRefresh = () => {
		clearPendingAction();
		setRefreshing(false);
	};

	const content = (
		<PullToRefresh
			style={{ height: '100%', overflow: 'hidden' }}
			refreshing={refreshing}
			onRefresh={beginRefresh}
		>
			<WebViewPage url={url} />
		</PullToRefresh>
	);

	return safeArea ? <DemoSafeAreaView>{content}</DemoSafeAreaView> : content;
}

export default withNavigationItem({})(PullRefreshWebView);
