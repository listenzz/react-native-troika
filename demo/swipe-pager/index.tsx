import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useNavigator, withNavigationItem } from 'hybrid-navigation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DemoButton, DemoPanel, DemoScreen, demoTheme } from '../components/DemoKit';
import PagerExample from './PagerExample';

function SwipePagerDemo() {
	const navigator = useNavigator();
	return (
		<GestureHandlerRootView style={styles.root}>
			<DemoScreen title="SwipePager" subtitle="拖动、反向与按钮切换时，内容和分页点同步过渡。">
				<DemoPanel>
					<Text style={styles.title}>相邻卡片</Text>
					<Text style={styles.description}>保留卡片间距与相邻内容露出。</Text>
					<PagerExample variant="cards" />
				</DemoPanel>
				<DemoPanel>
					<Text style={styles.title}>整页图片</Text>
					<Text style={styles.description}>离场缩小至 94%，入场恢复到原尺寸。</Text>
					<PagerExample variant="pages" />
				</DemoPanel>
				<DemoButton title="在 Bottom Sheet 中体验"
					onPress={() => navigator.push('BottomSheetSwipePager')} />
			</DemoScreen>
		</GestureHandlerRootView>
	);
}

export default withNavigationItem({})(SwipePagerDemo);

const styles = StyleSheet.create({
	root: { flex: 1 },
	title: { color: demoTheme.colors.text, fontSize: 18, fontWeight: '600', marginBottom: 8 },
	description: { color: demoTheme.colors.muted, fontSize: 14, lineHeight: 21, marginBottom: 16 },
});
