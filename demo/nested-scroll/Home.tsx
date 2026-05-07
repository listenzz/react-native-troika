import React from 'react';
import { useNavigator, withNavigationItem } from 'hybrid-navigation';
import { DemoItem, DemoList, demoTheme } from '../components/DemoKit';

interface Item extends DemoItem {
	title: string;
	routeName: string;
}

const data: Array<Item> = [
	{
		title: 'NestedScroll + FastList',
		routeName: 'NestedScrollFlatList',
		subtitle: '大列表与原生嵌套滚动容器',
		accentColor: demoTheme.colors.green,
	},
	{
		title: 'NestedScroll + ParallaxHeader',
		routeName: 'NestedScrollParallaxHeader',
		subtitle: '沉浸式头图与滚动导航栏',
		accentColor: demoTheme.colors.indigo,
	},
	{
		title: 'NestedScroll + TabView',
		routeName: 'NestedScrollTabView',
		subtitle: '多 Tab 内容与共享头部',
		accentColor: demoTheme.colors.cyan,
	},
	{
		title: 'NestedScroll + PagerView + StickyHeader',
		routeName: 'NestedScrollPagerViewStickyHeader',
		subtitle: '吸顶 TabBar 与横向分页',
		accentColor: demoTheme.colors.orange,
	},
];

function Home() {
	const navigator = useNavigator();

	return (
		<DemoList
			title="NestedScroll"
			subtitle="复杂滚动结构的核心演示"
			eyebrow="Scroll Layout"
			data={data}
			accentColor={demoTheme.colors.green}
			onItemPress={item => navigator.push(item.routeName)}
		/>
	);
}

export default withNavigationItem({})(Home);
