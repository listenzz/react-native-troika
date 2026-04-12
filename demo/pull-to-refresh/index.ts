import Navigation from 'hybrid-navigation';

import Home from './Home';
import PullRefreshFlatList from './PullRefreshFlatList';
import PullRefreshGestureHandlerFlatList from './PullRefreshGestureHandlerFlatList';
import PullRefreshScrollView from './PullRefreshScrollView';
import PullRefreshWebView from './PullRefreshWebView';
import PullRefreshPagerView from './PullRefreshPagerView';
import PullRefreshFlatListNestedScroll from './PullRefreshFlatListNestedScroll';
import PullRefreshPagerViewNestedScroll from './PullRefreshPagerViewNestedScroll';
import PullRefreshNestedScrollPagerView from './PullRefreshNestedScrollPagerView';
import PullRefreshWithoutScrollView from './PullRefreshWithoutScrollView';
import PullRefreshRemoveViewLog from './PullRefreshRemoveViewLog';
import './PullToRefresh';

export function registerPullToRefreshComponent() {
	Navigation.registerComponent('PullToRefresh', () => Home);
	Navigation.registerComponent('PullRefreshScrollView', () => PullRefreshScrollView);
	Navigation.registerComponent('PullRefreshWebView', () => PullRefreshWebView);
	Navigation.registerComponent('PullRefreshFlatList', () => PullRefreshFlatList);
	Navigation.registerComponent(
		'PullRefreshGestureHandlerFlatList',
		() => PullRefreshGestureHandlerFlatList,
	);
	Navigation.registerComponent(
		'PullRefreshFlatListNestedScroll',
		() => PullRefreshFlatListNestedScroll,
	);
	Navigation.registerComponent('PullRefreshPagerView', () => PullRefreshPagerView);
	Navigation.registerComponent(
		'PullRefreshPagerViewNestedScroll',
		() => PullRefreshPagerViewNestedScroll,
	);
	Navigation.registerComponent(
		'PullRefreshNestedScrollPagerView',
		() => PullRefreshNestedScrollPagerView,
	);
	Navigation.registerComponent(
		'PullRefreshWithoutScrollView',
		() => PullRefreshWithoutScrollView,
	);
	Navigation.registerComponent(
		'PullRefreshRemoveViewLog',
		() => PullRefreshRemoveViewLog,
	);
}
