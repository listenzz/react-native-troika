import React from 'react';
import { useNavigator, withNavigationItem } from 'hybrid-navigation';
import { DemoItem, DemoList, demoTheme } from '../components/DemoKit';

interface Item extends DemoItem {
	title: string;
	routeName: string;
	action?: string;
}

const data: Array<Item> = [
	{
		title: 'BottomSheet without ScrollView',
		routeName: 'BottomSheetWithoutScrollView',
		subtitle: '固定内容与状态切换',
		accentColor: demoTheme.colors.indigo,
	},
	{
		title: 'BottomSheet + FlashList',
		routeName: 'BottomSheetFlashList',
		subtitle: '大列表内容承载',
		accentColor: demoTheme.colors.green,
	},
	{
		title: 'BottomSheet + PagerView',
		routeName: 'BottomSheetPagerView',
		subtitle: '横向分页内容',
		accentColor: demoTheme.colors.cyan,
	},
	{
		title: 'BottomSheet + Backdrop + Shadow',
		routeName: 'BottomSheetBackdropShadow',
		subtitle: '背景遮罩与投影层级',
		accentColor: demoTheme.colors.violet,
	},
	{
		title: 'TextInput BottomSheet',
		routeName: 'TextInputBottomSheet',
		action: 'modal',
		subtitle: '输入焦点与键盘联动',
		accentColor: demoTheme.colors.orange,
	},
];

function Home() {
	const navigator = useNavigator();

	return (
		<DemoList
			title="BottomSheet"
			subtitle="底部面板在列表、分页和输入场景中的表现"
			eyebrow="Sheet"
			data={data}
			accentColor={demoTheme.colors.indigo}
			onItemPress={item => {
				if (item.action === 'modal') {
					navigator.showModal(item.routeName);
				} else {
					navigator.push(item.routeName);
				}
			}}
		/>
	);
}

export default withNavigationItem({})(Home);
