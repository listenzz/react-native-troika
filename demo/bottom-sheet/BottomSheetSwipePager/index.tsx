import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BottomSheet, { type BottomSheetState } from '@sdcx/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { withNavigationItem } from 'hybrid-navigation';
import { DemoButton, DemoPanel, DemoScreen, demoTheme } from '../../components/DemoKit';
import PagerExample from '../../swipe-pager/PagerExample';
import VerticalSlider from './VerticalSlider';

function BottomSheetSwipePager() {
	const [state, setState] = useState<BottomSheetState>('collapsed');
	const { bottom } = useSafeAreaInsets();
	return (
		<GestureHandlerRootView style={styles.root}>
			<DemoScreen title="Bottom Sheet + SwipePager"
				subtitle="图片左右翻页，上下拖动面板；松手后可重新选择拖动方向。">
				<DemoPanel>
					<Text style={styles.description}>上下拖动滑块时面板应保持不动；从图片、抓手或空白处纵拖面板。滑块到端点或移出区域后仍归滑块，抬手后重新判断。</Text>
					<DemoButton title="展开面板" onPress={() => setState('expanded')} />
				</DemoPanel>
			</DemoScreen>
			<BottomSheet fitToContents draggable peekHeight={110 + bottom} state={state}
				onStateChanged={event => setState(event.nativeEvent.state)}
				contentContainerStyle={styles.sheet}>
				<View style={[styles.content, { paddingBottom: bottom + 16 }]}>
					<View style={styles.grabber} />
					<Text style={styles.title}>轮播与普通滑块</Text>
					<Text style={styles.description}>左右切换图片，也可以从图片区域上下拖动。</Text>
					<View style={styles.controls}>
						<View style={styles.pager}><PagerExample variant="pages" /></View>
						<VerticalSlider />
					</View>
					<DemoButton title="收起面板" onPress={() => setState('collapsed')} />
				</View>
			</BottomSheet>
		</GestureHandlerRootView>
	);
}

export default withNavigationItem({})(BottomSheetSwipePager);

const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: demoTheme.colors.background },
	sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24,
		backgroundColor: demoTheme.colors.surface, overflow: 'hidden' },
	controls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
	pager: { flex: 1 },
	content: { paddingHorizontal: 20, paddingTop: 10, gap: 12 },
	grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: demoTheme.colors.line },
	title: { color: demoTheme.colors.text, fontSize: 20, fontWeight: '600' },
	description: { color: demoTheme.colors.muted, fontSize: 14, lineHeight: 21 },
});
