import React from 'react';
import { useNavigator, withNavigationItem } from 'hybrid-navigation';
import { DemoItem, DemoList, demoTheme } from '../components/DemoKit';

interface Item extends DemoItem {
	title: string;
	routeName: string;
}

const data: Array<Item> = [
	{
		title: 'PullRefresh + FlatList',
		routeName: 'PullRefreshFlatList',
		subtitle: '标准列表刷新场景',
		accentColor: demoTheme.colors.cyan,
	},
	{
		title: 'PullRefresh + GestureHandlerFlatList',
		routeName: 'PullRefreshGestureHandlerFlatList',
		subtitle: '手势列表与刷新交互',
		accentColor: demoTheme.colors.indigo,
	},
	{
		title: 'PullRefresh + ScrollView',
		routeName: 'PullRefreshScrollView',
		subtitle: '基础滚动容器刷新',
		accentColor: demoTheme.colors.green,
	},
	{
		title: 'PullRefresh Without ScrollView',
		routeName: 'PullRefreshWithoutScrollView',
		subtitle: '无滚动视图内容刷新',
		accentColor: demoTheme.colors.amber,
	},
	{
		title: 'PullRefresh + WebView',
		routeName: 'PullRefreshWebView',
		subtitle: '网页内容刷新与加载态',
		accentColor: demoTheme.colors.violet,
	},
	{
		title: 'PullRefresh + NestedScroll + FlatList',
		routeName: 'PullRefreshFlatListNestedScroll',
		subtitle: '嵌套滚动中的列表刷新',
		accentColor: demoTheme.colors.orange,
	},
	{
		title: 'PullRefresh + NestedScroll + PagerView',
		routeName: 'PullRefreshNestedScrollPagerView',
		subtitle: '分页嵌套容器刷新',
		accentColor: demoTheme.colors.rose,
	},
	{
		title: 'PagerView + PullRefresh',
		routeName: 'PullRefreshPagerView',
		subtitle: '横向分页与纵向刷新',
		accentColor: demoTheme.colors.blue,
	},
	{
		title: 'NestedScroll + PagerView + PullRefresh',
		routeName: 'PullRefreshPagerViewNestedScroll',
		subtitle: '吸顶分页与刷新联动',
		accentColor: demoTheme.colors.green,
	},
	{
		title: 'PullRefresh RemoveView Log',
		routeName: 'PullRefreshRemoveViewLog',
		subtitle: '视图移除时的日志验证',
		accentColor: demoTheme.colors.amber,
	},
];

function Home() {
	const navigator = useNavigator();

	return (
		<DemoList
			title="PullToRefresh"
			subtitle="下拉刷新在不同容器中的交互样例"
			eyebrow="Refresh"
			data={data}
			accentColor={demoTheme.colors.cyan}
			onItemPress={item => navigator.push(item.routeName)}
		/>
	);
}

export default withNavigationItem({})(Home);
