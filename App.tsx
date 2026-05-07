import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigator, withNavigationItem } from 'hybrid-navigation';
import Lottie from 'lottie-react-native';
import { DemoItem, DemoList, demoTheme } from './demo/components/DemoKit';

interface Item extends DemoItem {
	title: string;
	routeName: string;
	count: number;
}

const data: Array<Item> = [
	{
		title: 'NestedScroll',
		routeName: 'NestedScroll',
		subtitle: '吸顶、视差、分页和列表协同',
		badge: '4 页',
		count: 4,
		accentColor: demoTheme.colors.green,
	},
	{
		title: 'PullToRefresh',
		routeName: 'PullToRefresh',
		subtitle: '下拉刷新、分页容器和嵌套滚动',
		badge: '10 页',
		count: 10,
		accentColor: demoTheme.colors.cyan,
	},
	{
		title: 'BottomSheet',
		routeName: 'BottomSheet',
		subtitle: '半屏面板、遮罩、输入和列表',
		badge: '5 页',
		count: 5,
		accentColor: demoTheme.colors.indigo,
	},
	{
		title: 'Keyboard Insets',
		routeName: 'Keyboard',
		subtitle: '输入框避让、聊天面板和 Modal',
		badge: '5 页',
		count: 5,
		accentColor: demoTheme.colors.orange,
	},
	{
		title: 'Overlay',
		routeName: 'Overlay',
		subtitle: 'Toast、Alert 和悬浮入口',
		badge: '3 页',
		count: 3,
		accentColor: demoTheme.colors.violet,
	},
	{
		title: 'Image Crop',
		routeName: 'ImageCropDemo',
		subtitle: '头像、矩形裁剪和主体检测',
		badge: '3 项',
		count: 3,
		accentColor: demoTheme.colors.rose,
	},
	{
		title: 'Activity Indicator',
		routeName: 'ActivityIndicator',
		subtitle: 'Android 原生 Loading 指示器',
		badge: '1 页',
		count: 1,
		accentColor: demoTheme.colors.blue,
	},
	{
		title: 'WheelPicker',
		routeName: 'WheelPicker',
		subtitle: '城市与时间滚轮选择器',
		badge: '1 页',
		count: 1,
		accentColor: demoTheme.colors.amber,
	},
];

const totalScreens = data.reduce((sum, item) => sum + item.count, 0);

function App() {
	const navigator = useNavigator();

	return (
		<DemoList
			title="MyUiDemo"
			subtitle="React Native 原生 UI 组件实验室"
			eyebrow="Component Gallery"
			data={data}
			accentColor={demoTheme.colors.indigo}
			headerMedia={<Header />}
			onItemPress={item => navigator.push(item.routeName)}
		/>
	);
}

function Header() {
	return (
		<View>
			<View style={styles.lottieStage}>
				<Lottie
					style={styles.lottie}
					source={require('assets/trilo-3.json')}
					autoPlay
					loop
					speed={1}
				/>
				<Lottie
					style={styles.lottie}
					source={require('assets/trilo-4.json')}
					autoPlay
					loop
					speed={1}
				/>
				<Lottie
					style={styles.lottie}
					source={require('assets/trilo-5.json')}
					autoPlay
					loop
					speed={1}
				/>
			</View>
			<View style={styles.metrics}>
				<Metric label="组件库" value={data.length} />
				<Metric label="演示页" value={totalScreens} />
				<Metric label="RN" value="0.84" last />
			</View>
		</View>
	);
}

function Metric({
	label,
	value,
	last = false,
}: {
	label: string;
	value: string | number;
	last?: boolean;
}) {
	return (
		<View style={[styles.metric, !last && styles.metricSpacing]}>
			<Text style={styles.metricValue}>{value}</Text>
			<Text style={styles.metricLabel}>{label}</Text>
		</View>
	);
}

export default withNavigationItem({})(App);

const styles = StyleSheet.create({
	lottieStage: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#FFFFFF',
		borderRadius: 8,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: '#E4E7EC',
		paddingVertical: 10,
	},
	lottie: {
		height: 92,
		width: 92,
	},
	metrics: {
		flexDirection: 'row',
		marginTop: 10,
	},
	metric: {
		flex: 1,
		height: 64,
		backgroundColor: '#FFFFFF',
		borderRadius: 8,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: '#E4E7EC',
		alignItems: 'center',
		justifyContent: 'center',
	},
	metricSpacing: {
		marginRight: 8,
	},
	metricValue: {
		color: '#121826',
		fontSize: 20,
		lineHeight: 25,
		fontWeight: '800',
		letterSpacing: 0,
	},
	metricLabel: {
		color: '#667085',
		fontSize: 12,
		lineHeight: 16,
		marginTop: 2,
	},
});
