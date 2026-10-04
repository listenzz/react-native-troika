import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View, useWindowDimensions } from 'react-native';
import { BottomModal } from './BottomModal';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { withNavigationItem } from 'hybrid-navigation';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import AnimatedChoiceGroup from '../components/AnimatedChoiceGroup';
import { DemoButton, DemoPanel, DemoScreen, demoTheme } from '../components/DemoKit';

const options = [
	{ value: 'compact', label: '简洁', testID: 'height-tab-compact' },
	{ value: 'details', label: '详细', testID: 'height-tab-details' },
] as const;

export function BottomSheetAnimatedHeight() {
	const [visible, setVisible] = useState(false);
	const [selection, setSelection] = useState<'compact' | 'details'>('compact');
	const [animate, setAnimate] = useState(true);
	const [extraRows, setExtraRows] = useState(false);
	const { bottom } = useSafeAreaInsets();
	const { height } = useWindowDimensions();
	const rows = selection === 'compact' ? 2 : extraRows ? 12 : 5;

	return (
		<GestureHandlerRootView style={styles.root}>
			<DemoScreen
				title="内容高度过渡"
				subtitle="内容视口方案：普通布局驱动弹层伸缩，原生层不插值高度。"
			>
				<DemoPanel>
					<Text style={styles.description}>
						可以连续反向切换，也可以在过渡中收起或拖动面板。
					</Text>
					<View style={styles.setting}>
						<Text style={styles.title}>高度动画</Text>
						<Switch
							testID="height-animation-switch"
							value={animate}
							onValueChange={setAnimate}
						/>
					</View>
					<DemoButton title="打开面板" onPress={() => setVisible(true)} />
				</DemoPanel>
			</DemoScreen>
			<BottomModal
				fitToContents
				animateContentHeight={animate}
				draggable
				visible={visible}
				onClose={() => setVisible(false)}
				modalContentStyle={[styles.sheet, { maxHeight: height * 0.82 }]}
				background={<SheetBackground />}
				footer={
					<View
						testID="height-sheet-footer"
						style={[styles.footer, { paddingBottom: bottom + 12 }]}
					>
						<DemoButton
							title="收起"
							style={styles.button}
							accentColor={demoTheme.colors.muted}
							onPress={() => setVisible(false)}
						/>
						<DemoButton
							title="切换内容"
							style={styles.button}
							onPress={() =>
								setSelection(current =>
									current === 'compact' ? 'details' : 'compact',
								)
							}
						/>
					</View>
				}
			>
				<View style={styles.header}>
					<View style={styles.grabber} />
					<Text style={styles.title}>内容设置</Text>
					<AnimatedChoiceGroup
						value={selection}
						options={options}
						onChange={setSelection}
						testID="height-sheet-tabs"
					/>
				</View>
				<ScrollView
					nestedScrollEnabled
					style={styles.scroll}
					contentContainerStyle={styles.rows}
				>
					{Array.from({ length: rows }, (_, index) => (
						<View key={index} testID={`height-sheet-row-${index}`} style={styles.row}>
							<Text style={styles.rowTitle}>设置项 {index + 1}</Text>
							<Text style={styles.description}>
								内容正常增删，高度由面板统一过渡。
							</Text>
						</View>
					))}
					{selection === 'details' && (
						<View style={styles.setting}>
							<Text style={styles.rowTitle}>显示更多内容</Text>
							<Switch
								testID="height-more-rows"
								value={extraRows}
								onValueChange={setExtraRows}
							/>
						</View>
					)}
				</ScrollView>
			</BottomModal>
		</GestureHandlerRootView>
	);
}

function SheetBackground() {
	return (
		<Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
			<Defs>
				<LinearGradient id="heightSheetBackground" x1="0" y1="0" x2="0" y2="1">
					<Stop offset="0" stopColor={demoTheme.colors.surface} />
					<Stop offset="0.2" stopColor={demoTheme.colors.background} />
				</LinearGradient>
			</Defs>
			<Rect width="100%" height="100%" fill="url(#heightSheetBackground)" />
		</Svg>
	);
}

export default withNavigationItem({})(BottomSheetAnimatedHeight);

const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: demoTheme.colors.background },
	sheet: {
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		borderWidth: 1,
		borderColor: demoTheme.colors.surface,
		backgroundColor: demoTheme.colors.background,
		overflow: 'hidden',
	},
	header: { padding: 16, gap: 14, flexShrink: 0 },
	grabber: {
		alignSelf: 'center',
		width: 42,
		height: 4,
		borderRadius: 2,
		backgroundColor: demoTheme.colors.line,
	},
	title: { color: demoTheme.colors.text, fontSize: 18, fontWeight: '600' },
	description: { color: demoTheme.colors.muted, fontSize: 14, lineHeight: 21 },
	setting: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginVertical: 16,
	},
	scroll: { flexShrink: 1 },
	rows: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
	row: { padding: 18, gap: 6, borderRadius: 16, backgroundColor: demoTheme.colors.surface },
	rowTitle: { color: demoTheme.colors.text, fontSize: 16, fontWeight: '500' },
	footer: {
		flexDirection: 'row',
		gap: 12,
		padding: 16,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: demoTheme.colors.line,
		backgroundColor: demoTheme.colors.surface,
	},
	button: { flex: 1 },
});
