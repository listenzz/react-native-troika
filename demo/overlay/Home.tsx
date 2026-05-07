import React from 'react';
import { useNavigator, withNavigationItem } from 'hybrid-navigation';
import { DemoItem, DemoList, demoTheme } from '../components/DemoKit';

interface Item extends DemoItem {
	title: string;
	routeName: string;
}

const data: Array<Item> = [
	{
		title: 'Hoverball',
		routeName: 'Hoverball',
		subtitle: '悬浮操作入口',
		accentColor: demoTheme.colors.violet,
	},
	{
		title: 'Toast',
		routeName: 'Toast',
		subtitle: '轻量级顶部反馈',
		accentColor: demoTheme.colors.green,
	},
	{
		title: 'Alert',
		routeName: 'Alert',
		subtitle: '原生层级对话框',
		accentColor: demoTheme.colors.rose,
	},
];

function Home() {
	const navigator = useNavigator();

	return (
		<DemoList
			title="Overlay"
			subtitle="独立于页面层级的顶层 UI"
			eyebrow="Top Layer"
			data={data}
			accentColor={demoTheme.colors.violet}
			onItemPress={item => navigator.push(item.routeName)}
		/>
	);
}

export default withNavigationItem({})(Home);
