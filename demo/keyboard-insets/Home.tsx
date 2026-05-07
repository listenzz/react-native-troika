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
		title: 'Touch Offset 测试（验证 getContentOriginOffset）',
		routeName: 'TouchOffsetTest',
		subtitle: '键盘偏移与触摸位置验证',
		accentColor: demoTheme.colors.orange,
	},
	{
		title: 'Keyboard Avoiding',
		routeName: 'KeyboardAvoiding',
		subtitle: '输入框自动避让',
		accentColor: demoTheme.colors.indigo,
	},
	{
		title: '聊天键盘处理',
		routeName: 'KeyboardChat',
		subtitle: '聊天输入栏跟随键盘',
		accentColor: demoTheme.colors.green,
	},
	{
		title: '聊天键盘处理(Reanimated)',
		routeName: 'KeyboardChatReanimated',
		subtitle: 'Reanimated 驱动的键盘过渡',
		accentColor: demoTheme.colors.rose,
	},
	{
		title: 'Modal + TextInput',
		routeName: 'ModalTextInput',
		action: 'modal',
		subtitle: 'Modal 内部输入体验',
		accentColor: demoTheme.colors.cyan,
	},
];

function Home() {
	const navigator = useNavigator();

	return (
		<DemoList
			title="Keyboard Insets"
			subtitle="键盘、输入栏和安全区的组合场景"
			eyebrow="Input"
			data={data}
			accentColor={demoTheme.colors.orange}
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
