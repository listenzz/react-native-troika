import { withNavigationItem } from 'hybrid-navigation';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { NestedScrollView, NestedScrollViewHeader } from '@sdcx/nested-scroll';
import TabView from '../../components/tabview';
import { DemoSafeAreaView, demoTheme } from '../../components/DemoKit';

export function NestedScrollTabView() {
	const [height, setHeight] = useState(0);

	useEffect(() => {
		setHeight(Math.random() * 300);
	}, []);

	const [visible, setVisible] = useState(false);

	return (
		<DemoSafeAreaView edges={['top']}>
			<NestedScrollView>
				<NestedScrollViewHeader>
					<Image
						source={require('assets/cover.webp')}
						style={styles.image}
						resizeMode="cover"
					/>
					<View style={styles.fullWidth}>
						{visible && <View style={styles.previewBand} />}
						<View style={[styles.dynamicBand, { height }]} />
					</View>
					<View style={styles.actionRow}>
						<HeaderAction
							title={visible ? '隐藏' : '显示'}
							onPress={() => {
								setVisible(!visible);
							}}
						/>
						<HeaderAction
							title="改变高度"
							last
							onPress={() => {
								setHeight(Math.random() * 1000);
							}}
						/>
					</View>
				</NestedScrollViewHeader>
				<TabView />
			</NestedScrollView>
		</DemoSafeAreaView>
	);
}

function HeaderAction({
	title,
	last = false,
	onPress,
}: {
	title: string;
	last?: boolean;
	onPress: () => void;
}) {
	return (
		<Pressable
			style={[styles.actionButton, !last && styles.actionButtonSpacing]}
			onPress={onPress}
		>
			<Text style={styles.actionText} numberOfLines={1}>
				{title}
			</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	image: {
		height: 160,
		width: '100%',
	},
	fullWidth: {
		width: '100%',
	},
	previewBand: {
		height: 100,
		backgroundColor: '#EEF2FF',
	},
	dynamicBand: {
		backgroundColor: '#FFE4E6',
	},
	actionRow: {
		flexDirection: 'row',
		backgroundColor: demoTheme.colors.surface,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: demoTheme.colors.line,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	actionButton: {
		flex: 1,
		height: 42,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: demoTheme.colors.indigo,
		borderRadius: 8,
	},
	actionButtonSpacing: {
		marginRight: 10,
	},
	actionText: {
		color: '#FFFFFF',
		fontSize: 15,
		lineHeight: 20,
		fontWeight: '700',
		letterSpacing: 0,
	},
});

export default withNavigationItem({})(NestedScrollTabView);
